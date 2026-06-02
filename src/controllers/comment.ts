import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import CommentService from '../services/comment';
import AuditService from '../services/audit';
import NotificationService from '../services/notification';
import Notification from '../models/Notification';
import Logging from '../library/Logging';
import { AuthRequest } from '../middleware/auth';
import Post from '../models/Post';
import { sendPushNotification } from '../services/firebase.service';

const isValidObjectId = (id: string) =>
    mongoose.Types.ObjectId.isValid(id);

const createComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        if (!req.user) {
            Logging.warning(`[401] [comment] Unauthorized Create`);
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        const isAdmin = req.user.rol === 'admin';

        const authorId =
            (isAdmin && req.body.usuario)
                ? req.body.usuario
                : req.user.id;

        const commentData = {
            ...req.body,
            usuario: authorId
        };

        const savedComment =
            await CommentService.createComment(commentData);

        Logging.info(`[201] [comment] Created | commentId=${savedComment._id} userId=${authorId}`);

        // Trigger de Prueba: Buscar token FCM del creador del post original de forma asíncrona y enviar notificación push de test
        if (savedComment.post) {
            Promise.resolve().then(async () => {
                try {
                    const postObj = await Post.findById(savedComment.post).populate('usuario');
                    if (postObj && postObj.usuario) {
                        const recipient = postObj.usuario as any;
                        if (recipient.fcmToken) {
                            await sendPushNotification(
                                recipient.fcmToken,
                                '¡Alguien ha interactuado con tu contenido!',
                                `@${req.user?.nombre || 'Alguien'} ha comentado en tu publicación: "${savedComment.texto.substring(0, 30)}..."`,
                                {
                                    type: 'TEST_TRIGGER',
                                    postId: String(savedComment.post),
                                    commentId: String(savedComment._id)
                                }
                            );
                            Logging.info(`[FCM] Test push notification sent successfully to user ${recipient._id}`);
                        } else {
                            Logging.info(`[FCM] Test push notification skipped: recipient has no fcmToken`);
                        }
                    }
                } catch (pushErr) {
                    Logging.error(`[FCM] Error in test push notification trigger: ${pushErr}`);
                }
            });
        }

        return res.status(201).json(savedComment);

    } catch (error: any) {

        if (error.name === 'ValidationError') {
            Logging.warning(`[422] [comment] Validation Error`);
            return res.status(422).json({
                message: error.message
            });
        }

        Logging.error(`[500] [comment] Create Failed`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getComment = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const commentId = req.params.commentId;

    if (!isValidObjectId(commentId)) {
        Logging.warning(`[400] [comment] Invalid ID | commentId=${commentId}`);
        return res.status(400).json({
            message: 'ID de comentario inválido'
        });
    }

    try {

        const isAdmin = req.user?.rol === 'admin';

        const comment =
            await CommentService.getComment(
                commentId,
                isAdmin
            );

        if (!comment) {
            Logging.warning(`[404] [comment] Not Found | commentId=${commentId}`);
            return res.status(404).json({ message: 'not found' });
        }

        Logging.info(`[200] [comment] Retrieved | commentId=${commentId}`);

        return res.status(200).json(comment);

    } catch (error) {

        Logging.error(`[500] [comment] Get Failed | commentId=${commentId}`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getAllComments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        const page = req.query.page
            ? parseInt(req.query.page as string)
            : 1;

        const limit = req.query.limit
            ? parseInt(req.query.limit as string)
            : 10;

        if (page < 1 || limit < 1) {
            Logging.warning(`[400] [comment] Invalid Pagination`);
            return res.status(400).json({
                message: 'Valores de paginación inválidos'
            });
        }

        const isAdmin = req.user?.rol === 'admin';

        const comments =
            await CommentService.getAllComments(
                page,
                limit,
                isAdmin
            );

        Logging.info(`[200] [comment] List All | page=${page} limit=${limit}`);

        return res.status(200).json(comments);

    } catch (error) {

        Logging.error(`[500] [comment] List Failed`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const updateComment = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const commentId = req.params.commentId;
    const user = req.user;

    if (!user) {
        Logging.warning(`[401] [comment] Unauthorized Update`);
        return res.status(401).json({
            message: 'No autenticado'
        });
    }

    if (!isValidObjectId(commentId)) {
        Logging.warning(`[400] [comment] Invalid Update ID | commentId=${commentId}`);
        return res.status(400).json({
            message: 'ID de comentario inválido'
        });
    }

    try {

        const comment =
            await CommentService.updateComment(
                commentId,
                req.body,
                user.id,
                user.rol
            );

        if (!comment) {
            Logging.warning(`[404] [comment] Update Not Found | commentId=${commentId}`);
            return res.status(404).json({ message: 'not found' });
        }

        Logging.info(`[200] [comment] Updated | commentId=${commentId}`);

        return res.status(200).json(comment);

    } catch (error: any) {

        if (error.message === 'Forbidden') {
            Logging.warning(`[403] [comment] Forbidden Update | commentId=${commentId}`);
            return res.status(403).json({
                message: 'No tienes permiso para editar este comentario'
            });
        }

        if (error.name === 'ValidationError') {
            Logging.warning(`[422] [comment] Validation Error | commentId=${commentId}`);
            return res.status(422).json({ message: error.message });
        }

        Logging.error(`[500] [comment] Update Failed | commentId=${commentId}`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const deleteComment = async (req: AuthRequest, res: Response) => {

    const commentId = req.params.commentId;
    const user = req.user;

    if (!user) {
        Logging.warning(`[401] [comment] Unauthorized Delete`);
        return res.status(401).json({
            message: 'No autenticado'
        });
    }

    if (!isValidObjectId(commentId)) {
        Logging.warning(`[400] [comment] Invalid Delete ID | commentId=${commentId}`);
        return res.status(400).json({
            message: 'ID de comentario inválido'
        });
    }

    try {

        const comment =
            await CommentService.deleteComment(
                commentId,
                user.id,
                user.rol
            );

        if (comment) {
            Logging.info(`[200] [comment] Deleted | commentId=${commentId}`);
            
            // Log Auditoría si es admin borrando contenido
            if (user.rol === 'admin') {
                await AuditService.recordLog({
                    admin: new mongoose.Types.ObjectId(user.id) as any,
                    accion: AuditService.AdminAction.DELETE_COMMENT,
                    tipoObjetivo: 'comment',
                    objetivoId: commentId,
                    detalles: `Comentario eliminado por moderación`,
                    ip: req.ip
                });
            }

            return res.status(200).json(comment);
        }

    } catch (error: any) {

        if (error.message === 'Forbidden') {
            Logging.warning(`[403] [comment] Forbidden Delete | commentId=${commentId}`);
            return res.status(403).json({ message: 'Forbidden' });
        }

        Logging.error(`[500] [comment] Delete Failed | commentId=${commentId}`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getAllCommentsFromPost = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const postId = req.params.postId;

    if (!isValidObjectId(postId)) {
        Logging.warning(`[400] [comment] Invalid Post ID | postId=${postId}`);
        return res.status(400).json({
            message: 'ID de post inválido'
        });
    }

    const isAdmin = req.user?.rol === 'admin';

    try {

        const comments =
            await CommentService.getAllCommentsFromPost(
                postId,
                isAdmin
            );

        Logging.info(`[200] [comment] From Post | postId=${postId}`);

        return res.status(200).json(comments);

    } catch (error) {

        Logging.error(`[500] [comment] From Post Failed | postId=${postId}`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const deleteAllCommentsFromPost = async (req: Request, res: Response, next: NextFunction) => {

    const postId = req.params.postId;

    if (!isValidObjectId(postId)) {
        Logging.warning(`[400] [comment] Invalid Bulk Delete Post ID | postId=${postId}`);
        return res.status(400).json({
            message: 'ID de post inválido'
        });
    }

    try {

        await CommentService.deleteAllCommentsFromPost(postId);

        Logging.info(`[200] [comment] Bulk Deleted | postId=${postId}`);

        return res.status(200).json({
            message: 'All comments from post deleted successfully'
        });

    } catch (error) {

        Logging.error(`[500] [comment] Bulk Delete Failed | postId=${postId}`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getAllCommentsFromUser = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const userId = req.params.userId;

    if (!isValidObjectId(userId)) {
        Logging.warning(`[400] [comment] Invalid User ID | userId=${userId}`);
        return res.status(400).json({
            message: 'ID de usuario inválido'
        });
    }

    try {

        const page = req.query.page
            ? parseInt(req.query.page as string)
            : 1;

        const limit = req.query.limit
            ? parseInt(req.query.limit as string)
            : 10;

        if (page < 1 || limit < 1) {
            Logging.warning(`[400] [comment] Invalid Pagination | userId=${userId}`);
            return res.status(400).json({
                message: 'Valores de paginación inválidos'
            });
        }

        const isAdmin = req.user?.rol === 'admin';

        const comments =
            await CommentService.getAllCommentsFromUser(
                userId,
                page,
                limit,
                isAdmin
            );

        Logging.info(`[200] [comment] From User | userId=${userId}`);

        return res.status(200).json(comments);

    } catch (error) {

        Logging.error(`[500] [comment] From User Failed | userId=${userId}`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const darleLike = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const commentId = req.params.commentId;
    const user = req.user;

    if (!user?.id) {
        Logging.warning(`[401] [comment] Unauthorized Like`);
        return res.status(401).json({
            message: 'Usuario no autenticado'
        });
    }

    if (!isValidObjectId(commentId)) {
        Logging.warning(`[400] [comment] Invalid Like ID | commentId=${commentId}`);
        return res.status(400).json({
            message: 'ID de comentario inválido'
        });
    }

    try {
        const comment = await CommentService.darleLike(commentId, user.id);

        Logging.info(`[200] [comment] Like Toggled | commentId=${commentId} userId=${user.id}`);
        return comment ? res.status(200).json(comment) : res.status(404).json({ message: 'Comentario no encontrado' });

    } catch (error) {
        Logging.error(`[500] [comment] Like Failed | commentId=${commentId} error=${error}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export default {
    createComment,
    getComment,
    getAllComments,
    updateComment,
    deleteComment,
    getAllCommentsFromPost,
    deleteAllCommentsFromPost,
    getAllCommentsFromUser,
    darleLike
};