import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import NotificationService from '../services/notification';
import { AuthRequest } from '../middleware/auth';

const isValidObjectId = (id: string) =>
    mongoose.Types.ObjectId.isValid(id);

const getMyNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        if (!req.user) {
            return res.status(401).json({
                message: 'No autenticado'
            });
        }
        
        const page = req.query.page
            ? parseInt(req.query.page as string)
            : 1;

        const limit = req.query.limit
            ? parseInt(req.query.limit as string)
            : 20;

        // Validación básica de paginación
        if (page < 1 || limit < 1) {
            return res.status(400).json({
                message: 'Valores de paginación inválidos'
            });
        }

        const result =
            await NotificationService.getNotifications(
                req.user.id,
                page,
                limit
            );

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        if (!req.user) {
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        const notificationId = req.params.id;

        // Validamos el ObjectId antes de consultar
        if (!isValidObjectId(notificationId)) {
            return res.status(400).json({
                message: 'ID de notificación inválido'
            });
        }
        
        const notification =
            await NotificationService.markAsRead(
                notificationId,
                req.user.id
            );

        return notification
            ? res.status(200).json(notification)
            : res.status(404).json({
                message: 'Notificación no encontrada'
            });

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        if (!req.user) {
            return res.status(401).json({
                message: 'No autenticado'
            });
        }
        
        await NotificationService.markAllAsRead(req.user.id);

        return res.status(200).json({
            message: 'Todas las notificaciones marcadas como leídas'
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        if (!req.user) {
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        const notificationId = req.params.id;

        // Validamos el ObjectId antes de consultar
        if (!isValidObjectId(notificationId)) {
            return res.status(400).json({
                message: 'ID de notificación inválido'
            });
        }
        
        await NotificationService.deleteNotification(
            notificationId,
            req.user.id
        );

        return res.status(200).json({
            message: 'Notificación eliminada'
        });

    } catch (error: any) {
        if (error.message === 'Notification not found') {
            return res.status(404).json({
                message: 'Notificación no encontrada'
            });
        }

        if (error.message === 'Forbidden') {
            return res.status(403).json({
                message: 'No tienes permiso para eliminar esta notificación'
            });
        }

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

export default {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};