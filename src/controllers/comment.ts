import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import CommentService from '../services/comment';
import { AuthRequest } from '../middleware/auth';

const isValidObjectId = (id: string) =>
    mongoose.Types.ObjectId.isValid(id);

const createComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        if (!req.user) {
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        // Si es admin, puede elegir el autor. Si no, forzamos su propio ID.
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

        // Notificación (no bloquea el flujo)
        try {

            const Post = require('../models/Post').default;
            const post = await Post.findById(savedComment.post);

            if (post && post.usuario.toString() !== authorId.toString()) {

                const NotificationService =
                    require('../services/notification').default;

                NotificationService.createNotification({
                    recipient: post.usuario,
                    sender: authorId,
                    type: 'comment',
                    post: post._id,
                    comment: savedComment._id
                });
            }

        } catch (notifyError) {
        }

        return res.status(201).json(savedComment);

    } catch (error: any) {
        if (error.name === 'ValidationError') {
            return res.status(422).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getComment = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const commentId = req.params.commentId;

    if (!isValidObjectId(commentId)) {
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

        return comment
            ? res.status(200).json(comment)
            : res.status(404).json({
                message: 'not found'
            });

    } catch (error) {
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
            return res.status(400).json({
                message: 'Valores de paginación inválidos'
            });
        }

        const isAdmin = req.user?.rol === 'admin';

        const commentes =
            await CommentService.getAllComments(
                page,
                limit,
                isAdmin
            );

        return res.status(200).json(commentes);

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const updateComment = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const commentId = req.params.commentId;
    const user = req.user;

    if (!user) {
        return res.status(401).json({
            message: 'No autenticado'
        });
    }

    if (!isValidObjectId(commentId)) {
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

        return comment
            ? res.status(200).json(comment)
            : res.status(404).json({
                message: 'not found'
            });

    } catch (error: any) {
        if (error.message === 'Forbidden') {
            return res.status(403).json({
                message: 'No tienes permiso para editar este comentario'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(422).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const deleteComment = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const commentId = req.params.commentId;
    const user = req.user;

    if (!user) {
        return res.status(401).json({
            message: 'No autenticado'
        });
    }

    if (!isValidObjectId(commentId)) {
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

        return comment
            ? res.status(200).json(comment)
            : res.status(404).json({
                message: 'not found'
            });

    } catch (error: any) {
        if (error.message === 'Forbidden') {
            return res.status(403).json({
                message: 'No tienes permiso para eliminar este comentario'
            });
        }

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getAllCommentsFromPost = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const postId = req.params.postId;

    if (!isValidObjectId(postId)) {
        return res.status(400).json({
            message: 'ID de post inválido'
        });
    }

    try {

        const isAdmin = req.user?.rol === 'admin';

        const comments =
            await CommentService.getAllCommentsFromPost(
                postId,
                isAdmin
            );

        return res.status(200).json(comments);

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const deleteAllCommentsFromPost = async (req: Request, res: Response, next: NextFunction) => {

    const postId = req.params.postId;

    if (!isValidObjectId(postId)) {
        return res.status(400).json({
            message: 'ID de post inválido'
        });
    }

    try {

        await CommentService.deleteAllCommentsFromPost(postId);

        return res.status(200).json({
            message: 'All comments from post deleted successfully'
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getAllCommentsFromUser = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const userId = req.params.userId;

    if (!isValidObjectId(userId)) {
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

        return res.status(200).json(comments);

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
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
    getAllCommentsFromUser
};