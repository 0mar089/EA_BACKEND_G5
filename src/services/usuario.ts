import mongoose from 'mongoose';
import Usuario, { IUsuarioModel, IUsuario } from '../models/Usuario';
import Universidad from '../models/Universidad';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Follow, { FollowStatus } from '../models/Follow';
import Notification from '../models/Notification';
import notificationService from './notification';
import { NotificationType } from '../models/Notification';
import Logging from '../library/Logging';

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
    return await Usuario.findById(usuarioId).populate('universidad')
    .populate('grado')
    .populate('asignaturas');
};

const getUsuarioBasic = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findOne({ _id: usuarioId, activo: true }).select('nombre universidad')
    .populate('universidad', 'nombre ubicacion')
    .populate('grado', 'nombre')
    .populate('asignaturas', 'nombre');
};

const getAllUsuarios = async (
    search?: string, 
    universidades?: string, 
    grados?: string,      
    asignaturas?: string,  
    page: number = 1, 
    limit: number = 10,
    soloActivos: boolean = true
): Promise<any> => {
    const filter: any = {};
    if (soloActivos) filter.activo = true;

    if (search) {
        filter.$or = [
            { nombre: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ];
    }
    Logging.info(`[UsuarioService] Listing users with filter: ${JSON.stringify(filter)}`);

    //filtrar por universidad
    if (universidades) {
        const uniArray = Array.isArray(universidades) ? universidades : universidades.split(",");
        filter.universidad = {
            $in: uniArray.map(id => new mongoose.Types.ObjectId(id))
        };
    }

    //filtrar por grado
    if (grados) {
        const gradoArray = Array.isArray(grados) ? grados : grados.split(",");
        filter.grado = {
            $in: gradoArray.map(id => new mongoose.Types.ObjectId(id))
        };
    }

    //filtrar por asignaturas
    if (asignaturas) {
        const asigArray = Array.isArray(asignaturas) ? asignaturas : asignaturas.split(",");
        filter.asignaturas = {
            $in: asigArray.map(id => new mongoose.Types.ObjectId(id))
        };
    }

    const options = {
        page,
        limit,
        select: { nombre: 1, email: 1, avatarUrl: 1, descripcion: 1, universidad: 1, rol: 1, activo: 1 },
        lean: true,
        populate: [
            { path: "universidad", select: "nombre ubicacion" },
            { path: "grado", select: "nombre" },
            { path: "asignaturas", select: "nombre" }
        ]
    };

    return await Usuario.paginate(filter, options);
};

const getAllUsuariosAdmin= async (
    search?: string, 
    universidades?: string, 
    grados?: string,      
    asignaturas?: string,  
    page: number = 1, 
    limit: number = 10
): Promise<any> => {
    const filter: any = {}; // Eliminado el filtro activo: true para admins

    if (search) {
        filter.$or = [
            { nombre: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ];
    }
    Logging.info(`[UsuarioService] Admin Listing users with filter: ${JSON.stringify(filter)}`);

    //filtrar por universidad
    if (universidades) {
        const uniArray = Array.isArray(universidades) ? universidades : universidades.split(",");
        filter.universidad = {
            $in: uniArray.map(id => new mongoose.Types.ObjectId(id))
        };
    }

    //filtrar por grado
    if (grados) {
        const gradoArray = Array.isArray(grados) ? grados : grados.split(",");
        filter.grado = {
            $in: gradoArray.map(id => new mongoose.Types.ObjectId(id))
        };
    }

    //filtrar por asignaturas
    if (asignaturas) {
        const asigArray = Array.isArray(asignaturas) ? asignaturas : asignaturas.split(",");
        filter.asignaturas = {
            $in: asigArray.map(id => new mongoose.Types.ObjectId(id))
        };
    }

    const options = {
        page,
        limit,
        select: { nombre: 1, email: 1, avatarUrl: 1, descripcion: 1, universidad: 1, rol: 1, activo: 1 },
        lean: true,
        populate: [
            { path: "universidad", select: "nombre ubicacion" },
            { path: "grado", select: "nombre" },
            { path: "asignaturas", select: "nombre" }
        ]
    };

    return await Usuario.paginate(filter, options);
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
    // Desactivar posts del usuario
    await Post.updateMany({ usuario: usuarioId }, { activo: false });
    // Desactivar comentarios del usuario
    await Comment.updateMany({ usuario: usuarioId }, { activo: false });

    return await Usuario.findByIdAndUpdate(
        usuarioId,
        { activo: false },
        { new: true }
    );
};

// Recovery: vuelve a activar la cuenta
const recoveryUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    // Reactivar posts del usuario
    await Post.updateMany({ usuario: usuarioId }, { activo: true });
    // Reactivar comentarios del usuario
    await Comment.updateMany({ usuario: usuarioId }, { activo: true });

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
    }

    // 2. Eliminar COMENTARIOS hechos por el usuario en posts ajenos
    // Debemos sacarlos del array de comments del Post para que no queden referencias huérfanas
    const userComments = await Comment.find({ usuario: usuarioId });
    if (userComments.length > 0) {
        for (const comment of userComments) {
            await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } });
        }
        await Comment.deleteMany({ usuario: usuarioId });
    }

    // 3. Quitar LIKES del usuario en cualquier post de la plataforma
    const likesCleanup = await Post.updateMany(
        { likes: usuarioId },
        { $pull: { likes: usuarioId } }
    );

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

    // 6. Desvincular de la universidad (si existe)
    if (usuario.universidad) {
        await Universidad.findByIdAndUpdate(usuario.universidad, { $pull: { usuarios: usuario._id } });
    }

    // 7. Eliminar el usuario definitivamente
    const deletedUser = await Usuario.findByIdAndDelete(usuarioId);
    
    return deletedUser;
};

const toggleFollow = async (userId: string, targetId: string): Promise<any> => {
    if (userId === targetId) throw new Error('No puedes seguirte a ti mismo');

    const user = await Usuario.findById(userId);
    const target = await Usuario.findById(targetId);

    if (!user || !target) throw new Error('Usuario no encontrado');

    const existingFollow = await Follow.findOne({ follower: userId, following: targetId });

    if (existingFollow) {
        // Unfollow or Cancel Request
        await Follow.deleteOne({ _id: existingFollow._id });
        
        // Limpiar cualquier notificación previa de este usuario hacia el target
        await Notification.deleteMany({
            recipient: targetId,
            sender: userId,
            type: { $in: [NotificationType.FOLLOW_REQUEST, NotificationType.FOLLOW] }
        });
        
        // Si estaba aceptado, quitar de los arrays de caché
        if (existingFollow.status === FollowStatus.ACCEPTED) {
            await Usuario.findByIdAndUpdate(userId, { $pull: { seguidos: targetId } });
            await Usuario.findByIdAndUpdate(targetId, { $pull: { seguidores: userId } });
        }
        
        return { message: 'Follow removido', status: null };
    } else {
        // New Follow Request or Instant Follow
        const status = target.privado ? FollowStatus.PENDING : FollowStatus.ACCEPTED;
        
        const newFollow = new Follow({
            follower: userId,
            following: targetId,
            status
        });
        await newFollow.save();

        if (status === FollowStatus.ACCEPTED) {
            await Usuario.findByIdAndUpdate(userId, { $addToSet: { seguidos: targetId } });
            await Usuario.findByIdAndUpdate(targetId, { $addToSet: { seguidores: userId } });
            
            // Notificación de nuevo seguidor
            await notificationService.createNotification({
                recipient: targetId,
                sender: userId,
                type: NotificationType.FOLLOW
            });
        } else {
            // Notificación de solicitud de seguimiento
            await notificationService.createNotification({
                recipient: targetId,
                sender: userId,
                type: NotificationType.FOLLOW_REQUEST
            });
            
            // Emitir evento específico de socket (opcional si ya se emite new_notification)
            try {
                const { getIO } = require('../socket');
                const io = getIO();
                io.to(`user_${targetId}`).emit('new_follow_request', {
                    follower: {
                        _id: user._id,
                        nombre: user.nombre,
                        avatarUrl: user.avatarUrl
                    }
                });
            } catch (err) {}
        }

        return { message: target.privado ? 'Solicitud enviada' : 'Siguiendo', status };
    }
};

const acceptFollowRequest = async (userId: string, followerId: string) => {
    const follow = await Follow.findOne({ follower: followerId, following: userId, status: FollowStatus.PENDING });
    if (!follow) throw new Error('Solicitud no encontrada');

    follow.status = FollowStatus.ACCEPTED;
    await follow.save();

    // Actualizar caché en modelos de Usuario
    await Usuario.findByIdAndUpdate(followerId, { $addToSet: { seguidos: userId } });
    await Usuario.findByIdAndUpdate(userId, { $addToSet: { seguidores: followerId } });

    // 1. Eliminar TODAS las notificaciones de solicitud originales para evitar zombies
    await Notification.deleteMany({
        recipient: userId,
        sender: followerId,
        type: NotificationType.FOLLOW_REQUEST
    });

    // 2. Notificar al seguidor que su solicitud fue aceptada
    const acceptNotification = await notificationService.createNotification({
        recipient: followerId,
        sender: userId,
        type: NotificationType.FOLLOW_ACCEPTED
    });

    // 3. Emitir evento exclusivo por WebSocket al User B (el que solicitó)
    try {
        const { getIO } = require('../socket');
        const io = getIO();
        const userA = await Usuario.findById(userId);
        if (userA) {
            io.to(`user_${followerId}`).emit('new_notification', {
                type: 'FOLLOW_ACCEPTED',
                message: `${userA.nombre} ha aceptado tu solicitud de seguimiento.`,
                notification: acceptNotification
            });
        }
    } catch (err) {
        // Ignorar errores de socket
    }

    return { message: 'Solicitud aceptada' };
};

const rejectFollowRequest = async (userId: string, followerId: string) => {
    const result = await Follow.deleteOne({ follower: followerId, following: userId, status: FollowStatus.PENDING });
    if (result.deletedCount === 0) throw new Error('Solicitud no encontrada');

    // Eliminar TODAS las notificaciones de solicitud originales para evitar zombies
    await Notification.deleteMany({
        recipient: userId,
        sender: followerId,
        type: NotificationType.FOLLOW_REQUEST
    });

    return { message: 'Solicitud rechazada' };
};

const getFollowers = async (userId: string, isAdmin: boolean = false): Promise<IUsuarioModel | null> => {
    const filter = isAdmin ? { _id: userId } : { _id: userId, activo: true };
    const populateOptions: any = { path: 'seguidores', select: 'nombre email avatarUrl' };
    
    if (!isAdmin) {
        populateOptions.match = { activo: true };
    }

    return await Usuario.findOne(filter).select('seguidores').populate(populateOptions);
};

const getFollowing = async (userId: string, isAdmin: boolean = false): Promise<IUsuarioModel | null> => {
    const filter = isAdmin ? { _id: userId } : { _id: userId, activo: true };
    const populateOptions: any = { path: 'seguidos', select: 'nombre email avatarUrl' };
    
    if (!isAdmin) {
        populateOptions.match = { activo: true };
    }

    return await Usuario.findOne(filter).select('seguidos').populate(populateOptions);
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

const assignGrado = async (usuarioId: string, gradoId: string) => {
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) return null;

    usuario.grado = new mongoose.Types.ObjectId(gradoId);

    return await usuario.save();
};

const setAsignaturas = async (usuarioId: string, asignaturas: string[]) => {
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) return null;

    usuario.asignaturas = asignaturas.map(id => new mongoose.Types.ObjectId(id));

    return await usuario.save();
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
    unfollowUser,
    assignGrado,
    setAsignaturas,
    acceptFollowRequest,
    rejectFollowRequest
};