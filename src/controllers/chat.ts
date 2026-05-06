import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getMutualFollows, getConversation, markAsRead } from '../services/chat';

/** GET /chat/contacts → Seguidores mutuos (con quién puedes chatear) */
export const getContacts = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const contacts = await getMutualFollows(userId);
        res.status(200).json(contacts);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo contactos' });
    }
};

/** GET /chat/conversation/:userId → Historial con ese usuario */
export const getHistory = async (req: AuthRequest, res: Response) => {
    try {
        const myId = req.user!.id;
        const { userId } = req.params;
        const page = parseInt(req.query.page as string) || 1;

        // Verificar seguimiento mutuo antes de devolver mensajes
        const contacts = await getMutualFollows(myId);
        const isContact = contacts.some((c: any) => c._id.toString() === userId);
        if (!isContact) {
            return res.status(403).json({ message: 'No puedes ver esta conversación' });
        }

        await markAsRead(userId, myId); // Marcar como leídos al abrir
        const messages = await getConversation(myId, userId, page);
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo mensajes' });
    }
};
