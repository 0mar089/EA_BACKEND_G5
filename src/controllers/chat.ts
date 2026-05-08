import { Response } from 'express';
import mongoose from 'mongoose';
import Logging from '../library/Logging';
import { AuthRequest } from '../middleware/auth';
import { getMutualFollows, getConversation, markAsRead } from '../services/chat';

const isValidObjectId = (id: string) =>
    mongoose.Types.ObjectId.isValid(id);

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

        // Verificar seguimiento mutuo antes de devolver mensajes
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

        await markAsRead(userId, myId); // Marcar como leídos al abrir

        const messages =
            await getConversation(myId, userId, page);

        Logging.info(`[200] [chat] Conversation Loaded | userId=${myId} targetId=${userId} page=${page}`);

        return res.status(200).json(messages);

    } catch (error) {

        Logging.error(`[500] [chat] Get History Failed | userId=${req.user?.id} error=${error}`);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};