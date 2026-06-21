import Message from '../models/Message';
import Usuario from '../models/Usuario';
import mongoose from 'mongoose';
import GroupChat from '../models/GroupChat';

/**
 * Devuelve los usuarios con los que el usuario dado tiene seguimiento mutuo
 * (es decir, posibles contactos de chat).
 */
export const getMutualFollows = async (userId: string) => {
  const user = await Usuario.findById(userId).select('seguidores seguidos');
  if (!user) return [];

  const seguidoresSet = new Set(
    user.seguidores?.map((id: mongoose.Types.ObjectId) => id.toString()) ?? [],
  );
  const seguidosSet = new Set(
    user.seguidos?.map((id: mongoose.Types.ObjectId) => id.toString()) ?? [],
  );

  // Mutuo = aparece en ambos sets, pero no puede ser uno mismo
  const mutualIds = [...seguidoresSet].filter((id) => seguidosSet.has(id) && id !== userId);

  const contacts = await Usuario.find({ _id: { $in: mutualIds } }).select('_id nombre avatarUrl');

  // Añadir recuento de mensajes sin leer y último mensaje para cada contacto
  const contactsWithUnread = await Promise.all(
    contacts.map(async (contact) => {
      const unreadCount = await Message.countDocuments({
        remitente: contact._id,
        destinatario: userId,
        leido: false,
      });

      // Buscar el último mensaje entre ambos
      const lastMessage = await Message.findOne({
        $or: [
          { remitente: contact._id, destinatario: userId },
          { remitente: userId, destinatario: contact._id },
        ],
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
        lastMessage: lastMessageText,
      };
    }),
  );

  return contactsWithUnread;
};

/**
 * Filtra el contenido de un mensaje (como posts privados) según los permisos del usuario que lo ve.
 */
export const filterMessageForUser = (
  message: {
    remitente: { _id?: unknown } | unknown;
    destinatario?: { _id?: unknown } | unknown;
    grupo?: unknown;
    contenido: string;
    eliminadoParaTodos?: boolean;
    eliminadoPara?: unknown[];
  },
  viewerId: string,
) => {
  const messageObj = message as Record<string, unknown> & {
    toObject?: () => Record<string, unknown>;
  };
  const doc = (messageObj.toObject ? messageObj.toObject() : { ...messageObj }) as Record<
    string,
    unknown
  > & {
    contenido?: string;
    post?: {
      usuario: { privado?: boolean; seguidores?: unknown[] } | unknown;
      contenido: string;
      archivoUrl?: string;
    } | null;
    parentMessage?: {
      post?: {
        usuario: { privado?: boolean; seguidores?: unknown[] } | unknown;
        contenido: string;
        archivoUrl?: string;
      } | null;
      contenido?: string;
    };
  };

  if (doc.eliminadoParaTodos) {
    doc.contenido = 'El mensaje ha sido eliminado';
    doc.post = undefined;
    return doc;
  }

  // Filtrar post principal
  if (doc.post) {
    doc.post = filterPostContent(doc.post, viewerId);
    if (!doc.post) {
      doc.contenido = 'Esta publicación es privada y no puedes verla.';
    }
  }

  // Filtrar post en mensaje citado (parent)
  if (doc.parentMessage?.post) {
    doc.parentMessage.post = filterPostContent(doc.parentMessage.post, viewerId);
    if (!doc.parentMessage.post) {
      doc.parentMessage.contenido = 'Esta publicación es privada y no puedes verla.';
    }
  }

  return doc;
};

/** Helper para filtrar el contenido del post según privacidad */
const filterPostContent = (
  post: {
    usuario: { _id?: unknown; privado?: boolean; seguidores?: unknown[] } | null | unknown;
    contenido: string;
    archivoUrl?: string;
  },
  viewerId: string,
) => {
  if (!post) return undefined;
  const postOwner = post.usuario as {
    _id?: unknown;
    privado?: boolean;
    seguidores?: unknown[];
  } | null;
  if (!postOwner || !postOwner.privado) return post;

  const viewerIdStr = String(viewerId).toLowerCase();
  // Dueño siempre ve su post
  if (String(postOwner._id || postOwner).toLowerCase() === viewerIdStr) return post;

  const seguidoresOwner = postOwner.seguidores || [];
  const viewerFollowsOwner = seguidoresOwner.some(
    (s: { _id?: unknown } | unknown) =>
      String((s as { _id?: unknown })?._id || s).toLowerCase() === viewerIdStr,
  );

  if (!viewerFollowsOwner) return undefined;
  return post;
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
      { remitente: b, destinatario: a },
    ],
    eliminadoPara: { $ne: a },
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('remitente', '_id nombre avatarUrl')
    .populate('destinatario', '_id nombre avatarUrl')
    .populate({
      path: 'post',
      populate: { path: 'usuario', select: '_id nombre avatarUrl privado seguidores seguidos' },
    })
    .populate({
      path: 'parentMessage',
      select: '_id contenido remitente post',
      populate: { path: 'remitente', select: '_id nombre' },
    });

  const result = messages.map((m) => filterMessageForUser(m, userAId));

  return result.reverse();
};

/**
 * Guarda un mensaje en la base de datos.
 */
export const saveMessage = async (
  remitenteId: string,
  destinatarioId: string,
  contenido: string,
  postId?: string,
  parentMessageId?: string,
) => {
  const msg = await Message.create({
    remitente: remitenteId,
    destinatario: destinatarioId,
    contenido,
    post: postId || undefined,
    parentMessage: parentMessageId || undefined,
  });

  const populated = await msg.populate([
    { path: 'remitente', select: '_id nombre avatarUrl' },
    { path: 'destinatario', select: '_id nombre avatarUrl' },
    {
      path: 'post',
      populate: { path: 'usuario', select: '_id nombre avatarUrl privado seguidores seguidos' },
    },
    {
      path: 'parentMessage',
      select: '_id contenido remitente post',
      populate: { path: 'remitente', select: '_id nombre' },
    },
  ]);

  return populated;
};

/**
 * Marca como leídos todos los mensajes de `remitenteId` para `destinatarioId`.
 */
export const markAsRead = async (remitenteId: string, destinatarioId: string) => {
  await Message.updateMany(
    { remitente: remitenteId, destinatario: destinatarioId, leido: false },
    { $set: { leido: true } },
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
export const deleteMessages = async (
  userId: string,
  messageIds: string[],
  type: 'me' | 'everyone',
) => {
  const ids = messageIds.map((id) => new mongoose.Types.ObjectId(id));
  const uId = new mongoose.Types.ObjectId(userId);

  if (type === 'me') {
    await Message.updateMany({ _id: { $in: ids } }, { $addToSet: { eliminadoPara: uId } });
  } else {
    // everyone: Solo el remitente puede eliminar para todos
    await Message.updateMany(
      { _id: { $in: ids }, remitente: uId },
      { $set: { eliminadoParaTodos: true } },
    );
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
  const populated = await message.populate([
    { path: 'remitente', select: '_id nombre avatarUrl' },
    { path: 'destinatario', select: '_id nombre avatarUrl' },
    {
      path: 'post',
      populate: { path: 'usuario', select: '_id nombre avatarUrl privado seguidores seguidos' },
    },
    {
      path: 'parentMessage',
      select: '_id contenido remitente post',
      populate: { path: 'remitente', select: '_id nombre' },
    },
  ]);
  return populated;
};

export const getMessageById = async (id: string) => {
  return await Message.findById(id)
    .populate('remitente', '_id nombre avatarUrl')
    .populate('destinatario', '_id nombre avatarUrl');
};

export const getConversationForAdmin = async (userAId: string, userBId: string, limit = 50) => {
  const a = new mongoose.Types.ObjectId(userAId);
  const b = new mongoose.Types.ObjectId(userBId);

  const messages = await Message.find({
    $or: [
      { remitente: a, destinatario: b },
      { remitente: b, destinatario: a },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('remitente', '_id nombre avatarUrl')
    .populate('destinatario', '_id nombre avatarUrl')
    .populate({
      path: 'post',
      populate: { path: 'usuario', select: '_id nombre avatarUrl' },
    })
    .populate({
      path: 'parentMessage',
      model: 'Message',
      populate: [
        { path: 'remitente', model: 'Usuario', select: '_id nombre avatarUrl' },
        { path: 'post', model: 'Post', select: '_id imageUrl caption' },
      ],
    });

  return messages.reverse();
};

export const createGroup = async (creadorId: string, nombre: string, miembrosIds: string[]) => {
  // 1. Un chat grupal debe tener:
  // - mínimo 3 usuarios
  // - máximo 8 usuarios
  // El creador SIEMPRE forma parte del grupo (lo unimos a la lista si no está ya)
  const uniqueMiembros = Array.from(new Set([creadorId, ...miembrosIds]));

  if (uniqueMiembros.length < 3 || uniqueMiembros.length > 8) {
    throw new Error('Un chat grupal debe tener mínimo 3 y máximo 8 usuarios');
  }

  // 2. El creador del grupo:
  // - SIEMPRE forma parte del grupo
  // - SOLO puede invitar a usuarios que él sigue (following)
  const creator = await Usuario.findById(creadorId).select('seguidos');
  if (!creator) {
    throw new Error('Creador no encontrado');
  }

  const seguidosSet = new Set(
    creator.seguidos?.map((id: mongoose.Types.ObjectId) => id.toString()) ?? [],
  );

  const invitedIds = uniqueMiembros.filter((id) => id !== creadorId);
  for (const invitedId of invitedIds) {
    if (!seguidosSet.has(invitedId)) {
      throw new Error('Solo puedes invitar a usuarios que sigues');
    }
  }

  const newGroup = await GroupChat.create({
    nombre,
    creador: creadorId,
    miembros: uniqueMiembros,
  });

  return await newGroup.populate('miembros', '_id nombre avatarUrl');
};

export const getGroupsForUser = async (userId: string) => {
  const groups = await GroupChat.find({ miembros: userId }).populate(
    'miembros',
    '_id nombre avatarUrl',
  );

  const groupsWithUnread = await Promise.all(
    groups.map(async (group) => {
      const unreadCount = await Message.countDocuments({
        grupo: group._id,
        remitente: { $ne: new mongoose.Types.ObjectId(userId) },
        leidoPor: { $ne: new mongoose.Types.ObjectId(userId) },
      });

      // Buscar el último mensaje del grupo
      const lastMessage = await Message.findOne({ grupo: group._id }).sort({ createdAt: -1 });

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
        _id: group._id.toString(),
        nombre: group.nombre,
        avatarUrl: group.avatarUrl,
        isGroup: true,
        creador: group.creador,
        miembros: group.miembros,
        unreadCount,
        lastMessage: lastMessageText,
      };
    }),
  );

  return groupsWithUnread;
};

export const getGroupConversation = async (
  groupId: string,
  viewerId: string,
  page = 1,
  limit = 40,
) => {
  const gId = new mongoose.Types.ObjectId(groupId);
  const vId = new mongoose.Types.ObjectId(viewerId);

  const messages = await Message.find({
    grupo: gId,
    eliminadoPara: { $ne: vId },
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('remitente', '_id nombre avatarUrl')
    .populate({
      path: 'post',
      populate: { path: 'usuario', select: '_id nombre avatarUrl privado seguidores seguidos' },
    })
    .populate({
      path: 'parentMessage',
      select: '_id contenido remitente post',
      populate: { path: 'remitente', select: '_id nombre' },
    });

  const result = messages.map((m) => filterMessageForUser(m, viewerId));

  return result.reverse();
};

export const markGroupAsRead = async (groupId: string, userId: string) => {
  const gId = new mongoose.Types.ObjectId(groupId);
  const uId = new mongoose.Types.ObjectId(userId);

  await Message.updateMany(
    { grupo: gId, remitente: { $ne: uId }, leidoPor: { $ne: uId } },
    { $addToSet: { leidoPor: uId } },
  );
};

export const saveGroupMessage = async (
  remitenteId: string,
  groupId: string,
  contenido: string,
  postId?: string,
  parentMessageId?: string,
) => {
  const msg = await Message.create({
    remitente: remitenteId,
    grupo: groupId,
    contenido,
    post: postId || undefined,
    parentMessage: parentMessageId || undefined,
    leidoPor: [new mongoose.Types.ObjectId(remitenteId)],
  });

  const populated = await msg.populate([
    { path: 'remitente', select: '_id nombre avatarUrl' },
    {
      path: 'post',
      populate: { path: 'usuario', select: '_id nombre avatarUrl privado seguidores seguidos' },
    },
    {
      path: 'parentMessage',
      select: '_id contenido remitente post',
      populate: { path: 'remitente', select: '_id nombre' },
    },
  ]);

  return populated;
};
