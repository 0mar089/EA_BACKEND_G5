import Message from '../models/Message';
import Usuario from '../models/Usuario';
import mongoose from 'mongoose';

/**
 * Devuelve los usuarios con los que el usuario dado tiene seguimiento mutuo
 * (es decir, posibles contactos de chat).
 */
export const getMutualFollows = async (userId: string) => {
    const user = await Usuario.findById(userId).select('seguidores seguidos');
    if (!user) return [];

    const seguidoresSet = new Set(user.seguidores?.map((id: any) => id.toString()) ?? []);
    const seguidosSet = new Set(user.seguidos?.map((id: any) => id.toString()) ?? []);

    // Mutuo = aparece en ambos sets, pero no puede ser uno mismo
    const mutualIds = [...seguidoresSet].filter(id => seguidosSet.has(id) && id !== userId);

    const contacts = await Usuario.find({ _id: { $in: mutualIds } })
        .select('_id nombre avatarUrl');

    // Añadir recuento de mensajes sin leer y último mensaje para cada contacto
    const contactsWithUnread = await Promise.all(contacts.map(async (contact) => {
        const unreadCount = await Message.countDocuments({
            remitente: contact._id,
            destinatario: userId,
            leido: false
        });

        // Buscar el último mensaje entre ambos
        const lastMessage = await Message.findOne({
            $or: [
                { remitente: contact._id, destinatario: userId },
                { remitente: userId, destinatario: contact._id }
            ]
        }).sort({ createdAt: -1 });

        let lastMessageText = null;
        if (lastMessage) {
            if (lastMessage.eliminadoParaTodos) {
                lastMessageText = 'El mensaje ha sido eliminado';
            } else if (lastMessage.post) {
                lastMessageText = 'Envió una publicación';
            } else {
                lastMessageText = lastMessage.contenido;
            }
        }

        return {
            ...contact.toObject(),
            unreadCount,
            lastMessage: lastMessageText
        };
    }));

    return contactsWithUnread;
};

/**
 * Devuelve el historial de mensajes entre dos usuarios, ordenados por fecha.
 */
export const getConversation = async (userAId: string, userBId: string, page = 1, limit = 40) => {
    const a = new mongoose.Types.ObjectId(userAId);
    const b = new mongoose.Types.ObjectId(userBId);

    const messages = await Message.find({
        $or: [
            { remitente: a, destinatario: b },
            { remitente: b, destinatario: a }
        ],
        eliminadoPara: { $ne: a }
    })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('remitente', '_id nombre avatarUrl')
        .populate('destinatario', '_id nombre avatarUrl')
        .populate({
            path: 'post',
            populate: { path: 'usuario', select: '_id nombre avatarUrl privado seguidores' }
        })
        .populate({
            path: 'parentMessage',
            select: '_id contenido remitente',
            populate: { path: 'remitente', select: '_id nombre' }
        });

    // Mapear contenido si fue eliminado para todos (Soft Delete)
    const result = messages.map((m) => {
        const doc = m.toObject();
        if (doc.eliminadoParaTodos) {
            doc.contenido = 'El mensaje ha sido eliminado';
            doc.post = undefined;
        }
        return doc;
    });

    return result.reverse();
};

/**
 * Guarda un mensaje en la base de datos.
 */
export const saveMessage = async (remitenteId: string, destinatarioId: string, contenido: string, postId?: string, parentMessageId?: string) => {
    const msg = await Message.create({
        remitente: remitenteId,
        destinatario: destinatarioId,
        contenido,
        post: postId || undefined,
        parentMessage: parentMessageId || undefined
    });

    return msg.populate([
        { path: 'remitente', select: '_id nombre avatarUrl' },
        { path: 'destinatario', select: '_id nombre avatarUrl' },
        { 
            path: 'post', 
            populate: { path: 'usuario', select: '_id nombre avatarUrl privado seguidores' } 
        },
        {
            path: 'parentMessage',
            select: '_id contenido remitente',
            populate: { path: 'remitente', select: '_id nombre' }
        }
    ]);
};

/**
 * Marca como leídos todos los mensajes de `remitenteId` para `destinatarioId`.
 */
export const markAsRead = async (remitenteId: string, destinatarioId: string) => {
    await Message.updateMany(
        { remitente: remitenteId, destinatario: destinatarioId, leido: false },
        { $set: { leido: true } }
    );
};

/**
 * Número de mensajes sin leer que tiene `userId`.
 */
export const getUnreadCount = async (userId: string) => {
    return Message.countDocuments({ destinatario: userId, leido: false });
};

/**
 * Elimina mensajes para el usuario o para todos.
 */
export const deleteMessages = async (userId: string, messageIds: string[], type: 'me' | 'everyone') => {
    const ids = messageIds.map((id) => new mongoose.Types.ObjectId(id));
    const uId = new mongoose.Types.ObjectId(userId);

    if (type === 'me') {
        await Message.updateMany({ _id: { $in: ids } }, { $addToSet: { eliminadoPara: uId } });
    } else {
        // everyone: Solo el remitente puede eliminar para todos
        await Message.updateMany({ _id: { $in: ids }, remitente: uId }, { $set: { eliminadoParaTodos: true } });
    }
};

/**
 * Añade o quita una reacción a un mensaje.
 */
export const reactToMessage = async (userId: string, messageId: string, emoji: string) => {
    const message = await Message.findById(messageId);
    if (!message) throw new Error('Mensaje no encontrado');

    const userIdObj = new mongoose.Types.ObjectId(userId);
    
    if (!message.reactions) message.reactions = [];

    // Buscar si el usuario ya reaccionó
    const existingIndex = message.reactions.findIndex((r) => r.usuario.toString() === userId);

    if (existingIndex !== -1) {
        if (message.reactions[existingIndex].emoji === emoji) {
            // Si es el mismo emoji, quitar la reacción
            message.reactions.splice(existingIndex, 1);
        } else {
            // Si es diferente, cambiar el emoji
            message.reactions[existingIndex].emoji = emoji;
        }
    } else {
        // Añadir nueva reacción
        message.reactions.push({ usuario: userIdObj, emoji });
    }

    await message.save();
    return message.populate([
        { path: 'remitente', select: '_id nombre avatarUrl' },
        { path: 'destinatario', select: '_id nombre avatarUrl' },
        { path: 'parentMessage', populate: { path: 'remitente', select: '_id nombre' } }
    ]);
};
