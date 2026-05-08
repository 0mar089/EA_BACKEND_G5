import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { getMutualFollows, getConversation, markAsRead } from '../services/chat';

const isValidObjectId = (id: string) =>
    mongoose.Types.ObjectId.isValid(id);

/** GET /chat/contacts → Seguidores mutuos (con quién puedes chatear) */
export const getContacts = async (req: AuthRequest, res: Response) => {
    try {

        if (!req.user) {
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        const userId = req.user.id;

        const contacts =
            await getMutualFollows(userId);

        return res.status(200).json(contacts);

    } catch (error) {

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

/** GET /chat/conversation/:userId → Historial con ese usuario */
export const getHistory = async (req: AuthRequest, res: Response) => {
    try {

        if (!req.user) {
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        const myId = req.user.id;
        const { userId } = req.params;

        const page = parseInt(req.query.page as string) || 1;

        // Validación de paginación
        if (page < 1) {
            return res.status(400).json({
                message: 'Página inválida'
            });
        }

        // Validación de ObjectId
        if (!isValidObjectId(userId)) {
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
            return res.status(403).json({
                message: 'No puedes ver esta conversación'
            });
        }

        await markAsRead(userId, myId); // Marcar como leídos al abrir

        const messages =
            await getConversation(myId, userId, page);

        return res.status(200).json(messages);

    } catch (error) {

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};