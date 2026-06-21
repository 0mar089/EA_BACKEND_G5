import { Response } from 'express';
import mongoose from 'mongoose';
import Logging from '../library/Logging';
import { AuthRequest } from '../middleware/auth';
import {
  getMutualFollows,
  getConversation,
  markAsRead,
  getUnreadCount,
  getMessageById,
  getConversationForAdmin,
  createGroup,
  getGroupsForUser,
  getGroupConversation,
  markGroupAsRead,
} from '../services/chat';

const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

/** GET /chat/context/:userAId/:userBId → Historial para moderación (ADMIN ONLY) */
export const getConversationContext = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const { userAId, userBId } = req.params;

    if (!isValidObjectId(userAId) || !isValidObjectId(userBId)) {
      return res.status(400).json({ message: 'IDs de usuario inválidos' });
    }

    const messages = await getConversationForAdmin(userAId, userBId);
    return res.status(200).json(messages);
  } catch (error) {
    Logging.error(`[500] [chat] Get Conversation Context Failed: ${error}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/** GET /chat/message/:messageId */
export const getMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;

    if (!isValidObjectId(messageId)) {
      return res.status(400).json({ message: 'ID de mensaje inválido' });
    }

    const message = await getMessageById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Mensaje no encontrado' });
    }

    const requesterId = req.user?.id;
    const isAdmin = req.user?.rol === 'admin';

    // IDOR Protection: Only the sender, recipient, group members or an admin can see the message
    let hasAccess = isAdmin || message.remitente.toString() === requesterId;
    if (!hasAccess && message.destinatario) {
      hasAccess = message.destinatario.toString() === requesterId;
    }
    if (!hasAccess && message.grupo) {
      const GroupChat = require('../models/GroupChat').default;
      const group = await GroupChat.findById(message.grupo);
      if (group) {
        hasAccess = group.miembros
          .map((m: mongoose.Types.ObjectId) => m.toString())
          .includes(requesterId);
      }
    }

    if (!hasAccess) {
      Logging.warning(
        `[403] [chat] Forbidden Message Access | requesterId=${requesterId} messageId=${messageId}`,
      );
      return res.status(403).json({ message: 'No tienes permiso para ver este mensaje' });
    }

    return res.status(200).json(message);
  } catch (error) {
    Logging.error(`[500] [chat] Get Message Failed: ${error}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/** GET /chat/contacts → Seguidores mutuos (con quién puedes chatear) y grupos */
export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      Logging.warning(`[401] [chat] Unauthorized Contacts Access`);
      return res.status(401).json({
        message: 'No autenticado',
      });
    }

    const userId = req.user.id;

    const contacts = await getMutualFollows(userId);
    const groups = await getGroupsForUser(userId);

    Logging.info(
      `[200] [chat] Contacts & Groups Retrieved | userId=${userId} contactsCount=${contacts?.length ?? 0} groupsCount=${groups?.length ?? 0}`,
    );

    return res.status(200).json([...contacts, ...groups]);
  } catch (error) {
    Logging.error(`[500] [chat] Get Contacts Failed | userId=${req.user?.id} error=${error}`);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

/** POST /chat/groups → Crear un chat grupal */
export const createGroupChat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const { nombre, miembros } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: 'El nombre del grupo es obligatorio' });
    }
    if (!miembros || !Array.isArray(miembros)) {
      return res
        .status(400)
        .json({ message: 'Los miembros del grupo son obligatorios y deben ser una lista' });
    }

    const group = await createGroup(req.user.id, nombre.trim(), miembros);

    Logging.info(`[201] [chat] Group Chat Created | groupId=${group._id} creator=${req.user.id}`);

    return res.status(201).json({
      ...group.toObject(),
      isGroup: true,
      unreadCount: 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? (error as Error).message : String(error);
    Logging.error(`[500] [chat] Create Group Chat Failed | error=${message}`);
    return res.status(400).json({ message: message || 'Error al crear el grupo' });
  }
};

/** GET /chat/unread-count → Total de mensajes sin leer */
export const getUnreadMessagesCount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });
    const count = await getUnreadCount(req.user.id);
    return res.status(200).json({ count });
  } catch (error) {
    Logging.error(`[500] [chat] Get Unread Count Failed: ${error}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/** GET /chat/conversation/:userId → Historial con ese usuario o grupo */
export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      Logging.warning(`[401] [chat] Unauthorized Conversation Access`);
      return res.status(401).json({
        message: 'No autenticado',
      });
    }

    const myId = req.user.id;
    const { userId } = req.params;

    const page = parseInt(req.query.page as string) || 1;

    // Validación de paginación
    if (page < 1) {
      Logging.warning(`[400] [chat] Invalid Page | userId=${myId} page=${page}`);
      return res.status(400).json({
        message: 'Página inválida',
      });
    }

    // Validación de ObjectId
    if (!isValidObjectId(userId)) {
      Logging.warning(`[400] [chat] Invalid ID | userId=${userId}`);
      return res.status(400).json({
        message: 'ID inválido',
      });
    }

    // Comprobar si el ID es de un chat grupal
    const GroupChat = require('../models/GroupChat').default;
    const group = await GroupChat.findById(userId);

    if (group) {
      const isMember = group.miembros
        .map((m: mongoose.Types.ObjectId) => m.toString())
        .includes(myId);
      if (!isMember) {
        Logging.warning(
          `[403] [chat] Unauthorized Group Access | userId=${myId} groupId=${userId}`,
        );
        return res.status(403).json({
          message: 'No tienes acceso a este grupo',
        });
      }

      await markGroupAsRead(userId, myId);
      const messages = await getGroupConversation(userId, myId, page);
      return res.status(200).json(messages);
    }

    // De lo contrario, tratar como conversación individual
    const contacts = await getMutualFollows(myId);

    const isContact = contacts.some((c: { _id: unknown }) => String(c._id) === userId);

    if (!isContact) {
      Logging.warning(
        `[403] [chat] Unauthorized Conversation Access | userId=${myId} targetId=${userId}`,
      );
      return res.status(403).json({
        message: 'No puedes ver esta conversación',
      });
    }

    await markAsRead(userId, myId);
    const messages = await getConversation(myId, userId, page);

    return res.status(200).json(messages);
  } catch (error) {
    Logging.error(`[500] [chat] Get History Failed | userId=${req.user?.id} error=${error}`);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};
