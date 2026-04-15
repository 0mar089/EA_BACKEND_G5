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
        return res.status(201).json(savedComment);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const comment = await CommentService.getComment(req.params.commentId);
        return comment ? res.status(200).json(comment) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getAllComments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const commentes = await CommentService.getAllComments();
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

const getAllCommentsFromPost = async (req: Request, res: Response, next: NextFunction) => {
    const postId = req.params.postId;

    try {
        const comments = await CommentService.getAllCommentsFromPost(postId);
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

export default { createComment, getComment, getAllComments, updateComment, deleteComment, getAllCommentsFromPost, deleteAllCommentsFromPost };
import { AuthRequest } from '../middleware/auth';