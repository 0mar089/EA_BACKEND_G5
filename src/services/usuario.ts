import mongoose from 'mongoose';
import Usuario, { IUsuarioModel, IUsuario } from '../models/Usuario';
import Universidad from '../models/Universidad';
import Post from '../models/Post';
import Comment from '../models/Comment';

const createUsuario = async (data: Partial<IUsuario>): Promise<IUsuarioModel> => {
    // Normalizamos "" a null para evitar errores de validación de ObjectId
    if (!data.universidad || data.universidad === ('' as any)) data.universidad = undefined;

    const usuario = new Usuario({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });
    await usuario.save();

    if (usuario.universidad) {
        await Universidad.findByIdAndUpdate(
            usuario.universidad,
            { $addToSet: { usuarios: usuario._id } } // Vincular usuario a la universidad
        );
    }
    return usuario;
};

const getUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findById(usuarioId).populate('universidad');
};

const getUsuarioBasic = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findById(usuarioId).select('nombre universidad').populate('universidad', 'nombre ubicacion');
};

const getAllUsuarios = async (search?: string, universidades?: string): Promise<IUsuarioModel[]> => {
    const filter: any = { activo: true };


    if (search) {
        filter.nombre = { $regex: search, $options: "i" };
    }

    if (universidades) {
        let uniArray: string[] = [];

        if (typeof universidades === "string") {
            uniArray = universidades.split(",");
        } else if (Array.isArray(universidades)) {
            uniArray = universidades;
        }

        filter.universidad = {
            $in: uniArray.map(id => new mongoose.Types.ObjectId(id))
        };
    }

    return await Usuario.find(filter)
        .select("nombre email avatarUrl descripcion universidad")
        .populate("universidad", "nombre ubicacion");
};

const getAllUsuariosAdmin = async (search?: string, universidades?: string): Promise<IUsuarioModel[]> => {
    const filter: any = {};


    if (search) {
        filter.nombre = { $regex: search, $options: "i" };
    }

    if (universidades) {
        let uniArray: string[] = [];

        if (typeof universidades === "string") {
            uniArray = universidades.split(",");
        } else if (Array.isArray(universidades)) {
            uniArray = universidades;
        }

        filter.universidad = {
            $in: uniArray.map(id => new mongoose.Types.ObjectId(id))
        };
    }
    
    return await Usuario.find(filter)
        .populate('universidad');
};

const updateUsuario = async (usuarioId: string, data: Partial<IUsuario>): Promise<IUsuarioModel | null> => {
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) return null;

    // Si viene el campo universidad en la data, manejamos la sincronización de la lista
    if ('universidad' in data) {
        const oldUniId = usuario.universidad;
        // Normalizamos "" a null para evitar errores de validación
        if ((data as any).universidad === '') (data as any).universidad = null;
        const newUniId = data.universidad;

        // Si cambió la universidad asociada
        if (String(oldUniId) !== String(newUniId)) {
            // 1. Desvincular de la antigua si existía
            if (oldUniId) {
                await Universidad.findByIdAndUpdate(oldUniId, { $pull: { usuarios: usuario._id } });
            }
            // 2. Vincular a la nueva si se ha proporcionado una
            if (newUniId) {
                await Universidad.findByIdAndUpdate(newUniId, { $addToSet: { usuarios: usuario._id } });
            }
        }
    }

    usuario.set(data);
    return await usuario.save();
};

// Soft Delete: marca como inactivo sin eliminar de la BD
const softDeleteUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findByIdAndUpdate(
        usuarioId,
        { activo: false },
        { new: true }
    );
};

// Recovery: vuelve a activar la cuenta
const recoveryUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findByIdAndUpdate(
        usuarioId,
        { activo: true },
        { new: true }
    );
};

// Hard Delete: elimina el documento definitivamente de la BD y todo su rastro (posts, comments, likes)
const hardDeleteUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) return null;

    console.log(`[CLEANUP] Iniciando borrado en cascada para el usuario: ${usuarioId}`);

    // 1. Eliminar todos los POSTS del usuario y los comentarios que haya en esos posts
    const userPosts = await Post.find({ usuario: usuarioId });
    const userPostIds = userPosts.map(p => p._id);
    
    if (userPostIds.length > 0) {
        // Encontramos todos los comentarios de esos posts para limpiar referencias en otros usuarios
        const commentsInPosts = await Comment.find({ post: { $in: userPostIds } });
        const commentIdsInPosts = commentsInPosts.map(c => c._id);
        
        if (commentIdsInPosts.length > 0) {
            await Usuario.updateMany(
                { comments: { $in: commentIdsInPosts } },
                { $pull: { comments: { $in: commentIdsInPosts } } }
            );
        }

        const deletedCommentsCount = await Comment.deleteMany({ post: { $in: userPostIds } });
        const deletedPostsCount = await Post.deleteMany({ usuario: usuarioId });
        console.log(`[CLEANUP] Eliminados ${deletedPostsCount.deletedCount} posts y ${deletedCommentsCount.deletedCount} comentarios de esos posts.`);
    }

    // 2. Eliminar COMENTARIOS hechos por el usuario en posts ajenos
    // Debemos sacarlos del array de comments del Post para que no queden referencias huérfanas
    const userComments = await Comment.find({ usuario: usuarioId });
    if (userComments.length > 0) {
        for (const comment of userComments) {
            await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } });
        }
        await Comment.deleteMany({ usuario: usuarioId });
        console.log(`[CLEANUP] Eliminados ${userComments.length} comentarios del usuario y limpiadas sus referencias.`);
    }

    // 3. Quitar LIKES del usuario en cualquier post de la plataforma
    const likesCleanup = await Post.updateMany(
        { likes: usuarioId },
        { $pull: { likes: usuarioId } }
    );
    console.log(`[CLEANUP] Limpiados likes en ${likesCleanup.modifiedCount} posts.`);

    // 5. Limpiar referencias de seguidores/seguidos
    // Quitar al usuario de la lista de 'seguidos' de otros (el usuario era su seguidor)
    await Usuario.updateMany(
        { seguidos: usuarioId },
        { $pull: { seguidos: usuarioId } }
    );
    // Quitar al usuario de la lista de 'seguidores' de otros (el usuario les seguía)
    await Usuario.updateMany(
        { seguidores: usuarioId },
        { $pull: { seguidores: usuarioId } }
    );
    console.log(`[CLEANUP] Limpiadas referencias de seguidores y seguidos.`);

    // 6. Desvincular de la universidad (si existe)
    if (usuario.universidad) {
        await Universidad.findByIdAndUpdate(usuario.universidad, { $pull: { usuarios: usuario._id } });
        console.log(`[CLEANUP] Usuario desvinculado de la universidad.`);
    }

    // 7. Eliminar el usuario definitivamente
    const deletedUser = await Usuario.findByIdAndDelete(usuarioId);
    console.log(`[CLEANUP] Usuario ${usuarioId} eliminado permanentemente.`);
    
    return deletedUser;
};

const toggleFollow = async (userId: string, targetId: string): Promise<IUsuarioModel | null> => {
    if (userId === targetId) throw new Error('No puedes seguirte a ti mismo');

    const user = await Usuario.findById(userId);
    const target = await Usuario.findById(targetId);

    if (!user || !target) throw new Error('Usuario no encontrado');

    const alreadyFollowing = user.seguidos?.some(id => id.toString() === targetId);

    if (alreadyFollowing) {
        // Unfollow
        await Usuario.findByIdAndUpdate(userId, { $pull: { seguidos: targetId } });
        await Usuario.findByIdAndUpdate(targetId, { $pull: { seguidores: userId } });
    } else {
        // Follow
        await Usuario.findByIdAndUpdate(userId, { $addToSet: { seguidos: targetId } });
        await Usuario.findByIdAndUpdate(targetId, { $addToSet: { seguidores: userId } });
    }

    return await Usuario.findById(userId).populate('seguidos seguidores', 'nombre avatarUrl');
};

const getFollowers = async (userId: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findById(userId).select('seguidores').populate('seguidores', 'nombre email avatarUrl');
};

const getFollowing = async (userId: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findById(userId).select('seguidos').populate('seguidos', 'nombre email avatarUrl');
};

const removeFollower = async (userId: string, followerId: string, requesterId: string, requesterRole: string): Promise<IUsuarioModel | null> => {
    if (userId !== requesterId && requesterRole !== 'admin') {
        throw new Error('Forbidden');
    }

    // El usuario (userId) elimina a alguien (followerId) de su lista de seguidores
    await Usuario.findByIdAndUpdate(userId, { $pull: { seguidores: followerId } });
    // Al seguidor se le quita de su lista de seguidos al usuario
    await Usuario.findByIdAndUpdate(followerId, { $pull: { seguidos: userId } });

    return await Usuario.findById(userId).populate('seguidores', 'nombre avatarUrl');
};

const unfollowUser = async (userId: string, targetId: string, requesterId: string, requesterRole: string): Promise<IUsuarioModel | null> => {
    if (userId !== requesterId && requesterRole !== 'admin') {
        throw new Error('Forbidden');
    }

    // El usuario (userId) deja de seguir a alguien (targetId)
    await Usuario.findByIdAndUpdate(userId, { $pull: { seguidos: targetId } });
    // Al objetivo se le quita de su lista de seguidores al usuario
    await Usuario.findByIdAndUpdate(targetId, { $pull: { seguidores: userId } });

    return await Usuario.findById(userId).populate('seguidos', 'nombre avatarUrl');
};

export default { 
    createUsuario, 
    getUsuario, 
    getUsuarioBasic, 
    getAllUsuarios, 
    getAllUsuariosAdmin, 
    updateUsuario, 
    softDeleteUsuario, 
    hardDeleteUsuario, 
    recoveryUsuario,
    toggleFollow,
    getFollowers,
    getFollowing,
    removeFollower,
    unfollowUser
};