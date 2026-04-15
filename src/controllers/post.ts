import { NextFunction, Request, Response } from 'express';
import PostService from '../services/post';

const createPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'No autenticado' });

        // Si es admin, puede elegir el autor. Si no, forzamos su propio ID.
        const isAdmin = req.user.rol === 'admin';
        const authorId = (isAdmin && req.body.usuario) ? req.body.usuario : req.user.id;

        const postData = {
            ...req.body,
            usuario: authorId
        };

        const savedPost = await PostService.createPost(postData);
        return res.status(201).json(savedPost);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const post = await PostService.getPost(req.params.postId);
        return post ? res.status(200).json(post) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getAllPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postes = await PostService.getAllPosts();
        return res.status(200).json(postes);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updatePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const postId = req.params.postId;
    const user = req.user;

    if (!user) return res.status(401).json({ message: 'No autenticado' });

    try {
        const post = await PostService.updatePost(postId, req.body, user.id, user.rol);
        return post ? res.status(200).json(post) : res.status(404).json({ message: 'not found' });
    } catch (error: any) {
        if (error.message === 'Forbidden') {
            return res.status(403).json({ message: 'No tienes permiso para editar este post' });
        }
        return res.status(500).json({ error });
    }
};

const deletePost = async (req: Request, res: Response) => {
    const postId = req.params.postId;
    const user = (req as any).user;

    try {
        const post = await PostService.deletePost(
            postId,
            user.id,
            user.rol
        );

        return post
            ? res.status(200).json(post)
            : res.status(404).json({ message: 'not found' });

    } catch (error: any) {
        if (error.message === 'Forbidden') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        return res.status(500).json({ error });
    }
};

const getAllPostsFromUser = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.userId;

    try {
        const posts = await PostService.getAllPostsFromUser(userId);
        return res.status(200).json(posts);
    } catch (error) {
        return res.status(500).json({ error });
    }
}

const deleteAllPostsFromUser = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.userId;

    try {
        await PostService.deleteAllPostsFromUser(userId);
        return res.status(200).json({ message: 'All posts from user deleted successfully' });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

const darleLike = async (req: Request, res: Response) => {
    const postId = req.params.postId;
    const user = (req as any).user;

    if (!user?.id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    try {
        const post = await PostService.darleLike(postId, user.id);

        return post
            ? res.status(200).json(post)
            : res.status(404).json({ message: 'Post not found' });

    } catch (error) {
        console.error(error); // 👈 CLAVE para ver el 500 real
        return res.status(500).json({ error });
    }
};

export default { createPost, getPost, getAllPosts, updatePost, deletePost, getAllPostsFromUser, deleteAllPostsFromUser, darleLike };
import { AuthRequest } from '../middleware/auth';