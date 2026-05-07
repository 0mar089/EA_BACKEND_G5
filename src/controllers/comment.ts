import { NextFunction, Request, Response } from 'express';
import CommentService from '../services/comment';

const createComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'No autenticado' });

        // Si es admin, puede elegir el autor. Si no, forzamos su propio ID.
        const isAdmin = req.user.rol === 'admin';
        const authorId = (isAdmin && req.body.usuario) ? req.body.usuario : req.user.id;

        const commentData = {
            ...req.body,
            usuario: authorId
        };

        const savedComment = await CommentService.createComment(commentData);

        // Notificar al dueño del post si no es el mismo autor
        try {
            const Post = require('../models/Post').default;
            const post = await Post.findById(savedComment.post);
            if (post && post.usuario.toString() !== authorId.toString()) {
                const NotificationService = require('../services/notification').default;
                NotificationService.createNotification({
                    recipient: post.usuario,
                    sender: authorId,
                    type: 'comment',
                    post: post._id,
                    comment: savedComment._id
                });
            }
        } catch (notifyError) {
            console.error('Error enviando notificación de comentario:', notifyError);
        }

        return res.status(201).json(savedComment);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const isAdmin = req.user?.rol === 'admin';
        const comment = await CommentService.getComment(req.params.commentId, isAdmin);
        return comment ? res.status(200).json(comment) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getAllComments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const isAdmin = req.user?.rol === 'admin';
        const commentes = await CommentService.getAllComments(page, limit, isAdmin);
        return res.status(200).json(commentes);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updateComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const commentId = req.params.commentId;
    const user = req.user;

    if (!user) return res.status(401).json({ message: 'No autenticado' });

    try {
        const comment = await CommentService.updateComment(commentId, req.body, user.id, user.rol);
        return comment ? res.status(200).json(comment) : res.status(404).json({ message: 'not found' });
    } catch (error: any) {
        if (error.message === 'Forbidden') {
            return res.status(403).json({ message: 'No tienes permiso para editar este comentario' });
        }
        return res.status(500).json({ error });
    }
};

const deleteComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const commentId = req.params.commentId;
    const user = req.user;

    if (!user) return res.status(401).json({ message: 'No autenticado' });

    try {
        const comment = await CommentService.deleteComment(commentId, user.id, user.rol);
        return comment ? res.status(201).json(comment) : res.status(404).json({ message: 'not found' });
    } catch (error: any) {
        if (error.message === 'Forbidden') {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este comentario' });
        }
        return res.status(500).json({ error });
    }
};

const getAllCommentsFromPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const postId = req.params.postId;
    const isAdmin = req.user?.rol === 'admin';

    try {
        const comments = await CommentService.getAllCommentsFromPost(postId, isAdmin);
        return res.status(200).json(comments);
    } catch (error) {
        return res.status(500).json({ error });
    }
}

const deleteAllCommentsFromPost = async (req: Request, res: Response, next: NextFunction) => {
    const postId = req.params.postId;

    try {
        await CommentService.deleteAllCommentsFromPost(postId);
        return res.status(200).json({ message: 'All comments from post deleted successfully' });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

const getAllCommentsFromUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.params.userId;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const isAdmin = req.user?.rol === 'admin';

    try {
        const comments = await CommentService.getAllCommentsFromUser(userId, page, limit, isAdmin);
        return res.status(200).json(comments);
    } catch (error) {
        return res.status(500).json({ error });
    }
}

export default { createComment, getComment, getAllComments, updateComment, deleteComment, getAllCommentsFromPost, deleteAllCommentsFromPost, getAllCommentsFromUser };
import { AuthRequest } from '../middleware/auth';