import { Response } from 'express';
import mongoose from 'mongoose';
import Logging from '../library/Logging';
import { AuthRequest } from '../middleware/auth';
import { getMutualFollows, getConversation, markAsRead, getUnreadCount, getMessageById, getConversationForAdmin } from '../services/chat';

const isValidObjectId = (id: string) =>
    mongoose.Types.ObjectId.isValid(id);

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

        // IDOR Protection: Only the sender, recipient or an admin can see the message
        if (!isAdmin &&
            message.remitente.toString() !== requesterId &&
            message.destinatario.toString() !== requesterId) {
            Logging.warning(`[403] [chat] Forbidden Message Access | requesterId=${requesterId} messageId=${messageId}`);
            return res.status(403).json({ message: 'No tienes permiso para ver este mensaje' });
        }

        return res.status(200).json(message);
    } catch (error) {
        Logging.error(`[500] [chat] Get Message Failed: ${error}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/** GET /chat/contacts → Seguidores mutuos (con quién puedes chatear) */
export const getContacts = async (req: AuthRequest, res: Response) => {
    try {

        if (!req.user) {
            Logging.warning(`[401] [chat] Unauthorized Contacts Access`);
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        const userId = req.user.id;

        const contacts =
            await getMutualFollows(userId);

        Logging.info(`[200] [chat] Contacts Retrieved | userId=${userId} count=${contacts?.length ?? 0}`);

        return res.status(200).json(contacts);

    } catch (error) {

        Logging.error(`[500] [chat] Get Contacts Failed | userId=${req.user?.id} error=${error}`);

        return res.status(500).json({
            message: 'Internal server error'
        });
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

/** GET /chat/conversation/:userId → Historial con ese usuario */
export const getHistory = async (req: AuthRequest, res: Response) => {
    try {

        if (!req.user) {
            Logging.warning(`[401] [chat] Unauthorized Conversation Access`);
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        const myId = req.user.id;
        const { userId } = req.params;

        const page = parseInt(req.query.page as string) || 1;

        // Validación de paginación
        if (page < 1) {
            Logging.warning(`[400] [chat] Invalid Page | userId=${myId} page=${page}`);
            return res.status(400).json({
                message: 'Página inválida'
            });
        }

        // Validación de ObjectId
        if (!isValidObjectId(userId)) {
            Logging.warning(`[400] [chat] Invalid UserId | userId=${userId}`);
            return res.status(400).json({
                message: 'ID de usuario inválido'
            });
        }

        const contacts = await getMutualFollows(myId);

        const isContact = contacts.some(
            (c: any) => c._id.toString() === userId
        );

        if (!isContact) {
            Logging.warning(`[403] [chat] Unauthorized Conversation Access | userId=${myId} targetId=${userId}`);
            return res.status(403).json({
                message: 'No puedes ver esta conversación'
            });
        }

        await markAsRead(userId, myId);
        const messages = await getConversation(myId, userId, page);

        return res.status(200).json(messages);

    } catch (error) {

        Logging.error(`[500] [chat] Get History Failed | userId=${req.user?.id} error=${error}`);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};