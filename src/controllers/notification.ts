import { Request, Response, NextFunction } from 'express';
import NotificationService from '../services/notification';
import { AuthRequest } from '../middleware/auth';

const getMyNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'No autenticado' });
        
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

        const result = await NotificationService.getNotificationsForUser(req.user.id, page, limit);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'No autenticado' });
        
        const notification = await NotificationService.markAsRead(req.params.id, req.user.id);
        return notification ? res.status(200).json(notification) : res.status(404).json({ message: 'Notificación no encontrada' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'No autenticado' });
        
        await NotificationService.markAllAsRead(req.user.id);
        return res.status(200).json({ message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'No autenticado' });
        
        await NotificationService.deleteNotification(req.params.id, req.user.id);
        return res.status(200).json({ message: 'Notificación eliminada' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

export default {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
