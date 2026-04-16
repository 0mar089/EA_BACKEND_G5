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

const getAllUsuarios = async (): Promise<IUsuarioModel[]> => {
    return await Usuario.find({ activo: true }).select('nombre universidad').populate('universidad', 'nombre ubicacion');
};

const getAllUsuariosAdmin = async (): Promise<IUsuarioModel[]> => {
    return await Usuario.find().populate('universidad');
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

    // 4. Desvincular de la universidad (si existe)
    if (usuario.universidad) {
        await Universidad.findByIdAndUpdate(usuario.universidad, { $pull: { usuarios: usuario._id } });
        console.log(`[CLEANUP] Usuario desvinculado de la universidad.`);
    }

    // 5. Eliminar el usuario definitivamente
    const deletedUser = await Usuario.findByIdAndDelete(usuarioId);
    console.log(`[CLEANUP] Usuario ${usuarioId} eliminado permanentemente.`);
    
    return deletedUser;
};

export default { createUsuario, getUsuario, getUsuarioBasic, getAllUsuarios, getAllUsuariosAdmin, updateUsuario, softDeleteUsuario, hardDeleteUsuario, recoveryUsuario };