import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import NotificationService from '../services/notification';
import Logging from '../library/Logging';
import { AuthRequest } from '../middleware/auth';

const isValidObjectId = (id: string) =>
    mongoose.Types.ObjectId.isValid(id);

const getMyNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        if (!req.user) {
            Logging.warning(`[401] [notification] Unauthorized Access`);
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

        if (page < 1 || limit < 1) {
            Logging.warning(`[400] [notification] Invalid Pagination | userId=${req.user.id}`);
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

        Logging.info(`[200] [notification] List | userId=${req.user.id} page=${page} limit=${limit}`);

        return res.status(200).json(result);

    } catch (error) {

        Logging.error(`[500] [notification] List Failed | userId=${req.user?.id}`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        if (!req.user) {
            Logging.warning(`[401] [notification] Unauthorized Mark As Read`);
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        const notificationId = req.params.id;

        if (!isValidObjectId(notificationId)) {
            Logging.warning(`[400] [notification] Invalid ID | id=${notificationId}`);
            return res.status(400).json({
                message: 'ID de notificación inválido'
            });
        }

        const notification =
            await NotificationService.markAsRead(
                notificationId,
                req.user.id
            );

        if (!notification) {
            Logging.warning(`[404] [notification] Not Found | id=${notificationId}`);
            return res.status(404).json({
                message: 'Notificación no encontrada'
            });
        }

        Logging.info(`[200] [notification] Mark As Read | id=${notificationId} userId=${req.user.id}`);

        return res.status(200).json(notification);

    } catch (error) {

        Logging.error(`[500] [notification] Mark As Read Failed | userId=${req.user?.id}`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        if (!req.user) {
            Logging.warning(`[401] [notification] Unauthorized Mark All As Read`);
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        await NotificationService.markAllAsRead(req.user.id);

        Logging.info(`[200] [notification] Mark All As Read | userId=${req.user.id}`);

        return res.status(200).json({
            message: 'Todas las notificaciones marcadas como leídas'
        });

    } catch (error) {

        Logging.error(`[500] [notification] Mark All As Read Failed | userId=${req.user?.id}`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        if (!req.user) {
            Logging.warning(`[401] [notification] Unauthorized Delete`);
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        const notificationId = req.params.id;

        if (!isValidObjectId(notificationId)) {
            Logging.warning(`[400] [notification] Invalid Delete ID | id=${notificationId}`);
            return res.status(400).json({
                message: 'ID de notificación inválido'
            });
        }

        await NotificationService.deleteNotification(
            notificationId,
            req.user.id
        );

        Logging.info(`[200] [notification] Deleted | id=${notificationId} userId=${req.user.id}`);

        return res.status(200).json({
            message: 'Notificación eliminada'
        });

    } catch (error: unknown) {

        if ((error as Error).message === 'Notification not found') {
            Logging.warning(`[404] [notification] Not Found | id=${req.params.id}`);
            return res.status(404).json({
                message: 'Notificación no encontrada'
            });
        }

        if ((error as Error).message === 'Forbidden') {
            Logging.warning(`[403] [notification] Forbidden Delete | id=${req.params.id}`);
            return res.status(403).json({
                message: 'No tienes permiso para eliminar esta notificación'
            });
        }

        Logging.error(`[500] [notification] Delete Failed | userId=${req.user?.id}`);
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