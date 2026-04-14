import { NextFunction, Request, Response } from 'express';
import CommentService from '../services/comment';

const createComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const savedComment = await CommentService.createComment(req.body);
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

const updateComment = async (req: Request, res: Response, next: NextFunction) => {
    const commentId = req.params.commentId;

    try {
        const comment = await CommentService.updateComment(commentId, req.body);
        return comment ? res.status(200).json(comment) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    const commentId = req.params.commentId;

    try {
        const comment = await CommentService.deleteComment(commentId);
        return comment ? res.status(201).json(comment) : res.status(404).json({ message: 'not found' });
    } catch (error) {
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
        return res.status(200).json({ message: 'All comments from user deleted successfully' });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

export default { createComment, getComment, getAllComments, updateComment, deleteComment, getAllCommentsFromPost, deleteAllCommentsFromPost };