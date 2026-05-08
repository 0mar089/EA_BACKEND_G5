import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import PostService from '../services/post';
import Usuario from '../models/Usuario';
import { AuthRequest } from '../middleware/auth';

const isValidObjectId = (id: string) =>
    mongoose.Types.ObjectId.isValid(id);

const createPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

        // Validamos el ID del autor
        if (!isValidObjectId(authorId)) {
            return res.status(400).json({
                message: 'ID de usuario inválido'
            });
        }

        const postData = {
            ...req.body,
            usuario: authorId
        };

        const savedPost =
            await PostService.createPost(postData);

        return res.status(201).json(savedPost);

    } catch (error: any) {
        // errores de validación
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

const getPost = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const postId = req.params.postId;

    // Validamos el ObjectId antes de consultar
    if (!isValidObjectId(postId)) {
        return res.status(400).json({
            message: 'ID de post inválido'
        });
    }

    try {

        const isAdmin = req.user?.rol === 'admin';
        const requesterId = req.user?.id;

        const post =
            await PostService.getPost(
                postId,
                requesterId,
                isAdmin
            );

        return post
            ? res.status(200).json(post)
            : res.status(404).json({
                message: 'not found'
            });

    } catch (error: any) {
        if (error.message === 'Esta cuenta es privada') {
            return res.status(403).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getAllPosts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        const page = req.query.page
            ? parseInt(req.query.page as string)
            : 1;

        const limit = req.query.limit
            ? parseInt(req.query.limit as string)
            : 10;

        const search = req.query.search as string;

        // Validación básica de paginación
        if (page < 1 || limit < 1) {
            return res.status(400).json({
                message: 'Valores de paginación inválidos'
            });
        }

        const isAdmin = req.user?.rol === 'admin';
        const requesterId = req.user?.id;

        const postes =
            await PostService.getAllPosts(
                page,
                limit,
                search,
                requesterId,
                isAdmin
            );

        return res.status(200).json(postes);

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const updatePost = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const postId = req.params.postId;
    const user = req.user;

    if (!user) {
        return res.status(401).json({
            message: 'No autenticado'
        });
    }

    // Validamos el ObjectId antes de consultar
    if (!isValidObjectId(postId)) {
        return res.status(400).json({
            message: 'ID de post inválido'
        });
    }

    try {

        const post =
            await PostService.updatePost(
                postId,
                req.body,
                user.id,
                user.rol
            );

        return post
            ? res.status(200).json(post)
            : res.status(404).json({
                message: 'not found'
            });

    } catch (error: any) {
        if (error.message === 'Forbidden') {
            return res.status(403).json({
                message: 'No tienes permiso para editar este post'
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

const deletePost = async (req: Request, res: Response) => {

    const postId = req.params.postId;
    const user = (req as any).user;

    // Validamos el ObjectId antes de consultar
    if (!isValidObjectId(postId)) {
        return res.status(400).json({
            message: 'ID de post inválido'
        });
    }

    try {

        const post =
            await PostService.deletePost(
                postId,
                user.id,
                user.rol
            );

        return post
            ? res.status(200).json(post)
            : res.status(404).json({
                message: 'not found'
            });

    } catch (error: any) {
        if (error.message === 'Forbidden') {
            return res.status(403).json({
                message: 'Forbidden'
            });
        }

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getAllPostsFromUser = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const userId = req.params.userId;

    // Validamos el ObjectId antes de consultar
    if (!isValidObjectId(userId)) {
        return res.status(400).json({
            message: 'ID de usuario inválido'
        });
    }

    const requesterId = req.user?.id;

    const page = req.query.page
        ? parseInt(req.query.page as string)
        : 1;

    const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : 10;

    const isAdmin = req.user?.rol === 'admin';

    try {

        // Validación básica de paginación
        if (page < 1 || limit < 1) {
            return res.status(400).json({
                message: 'Valores de paginación inválidos'
            });
        }

        // 1. Obtener información básica del usuario destino para ver si es privado
        const targetUser = await Usuario.findById(userId);

        if (!targetUser) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        // 2. Verificar privacidad
        if (targetUser.privado && !isAdmin && userId !== requesterId) {

            // Comprobar si el solicitante sigue al usuario destino
            const isFollowing =
                targetUser.seguidores?.some(
                    (id: any) => id.toString() === requesterId
                );

            if (!isFollowing) {
                return res.status(200).json({
                    message: 'Esta cuenta es privada',
                    isPrivate: true,
                    docs: [],
                    totalDocs: 0,
                    limit,
                    page,
                    totalPages: 0
                });
            }
        }

        const posts =
            await PostService.getAllPostsFromUser(
                userId,
                page,
                limit,
                isAdmin
            );

        return res.status(200).json(posts);

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const deleteAllPostsFromUser = async (req: Request, res: Response, next: NextFunction) => {

    const userId = req.params.userId;

    // Validamos el ObjectId antes de consultar
    if (!isValidObjectId(userId)) {
        return res.status(400).json({
            message: 'ID de usuario inválido'
        });
    }

    try {

        await PostService.deleteAllPostsFromUser(userId);

        return res.status(200).json({
            message: 'All posts from user deleted successfully'
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const darleLike = async (req: AuthRequest, res: Response) => {

    const postId = req.params.postId;
    const user = req.user;

    if (!user?.id) {
        return res.status(401).json({
            message: 'Usuario no autenticado'
        });
    }

    // Validamos el ObjectId antes de consultar
    if (!isValidObjectId(postId)) {
        return res.status(400).json({
            message: 'ID de post inválido'
        });
    }

    try {

        const post =
            await PostService.darleLike(
                postId,
                user.id
            );

        if (post) {

            // Notificar por socket y persistir si el like es de otra persona
            const postOwnerId = post.usuario._id.toString();

            const isNewLike =
                post.likes.some(
                    (id: any) => id.toString() === user.id
                );

            if (isNewLike && postOwnerId !== user.id) {

                const NotificationService =
                    require('../services/notification').default;

                NotificationService.createNotification({
                    recipient: postOwnerId,
                    sender: user.id,
                    type: 'like',
                    post: post._id
                });
            }
        }

        return post
            ? res.status(200).json(post)
            : res.status(404).json({
                message: 'Post not found'
            });

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getFollowingPosts = async (req: AuthRequest, res: Response) => {
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
            : 10;

        // Validación básica de paginación
        if (page < 1 || limit < 1) {
            return res.status(400).json({
                message: 'Valores de paginación inválidos'
            });
        }

        const posts =
            await PostService.getFollowingPosts(
                req.user.id,
                page,
                limit
            );

        return res.status(200).json(posts);

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getDiscoveryPosts = async (req: AuthRequest, res: Response) => {
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
            : 10;

        // Validación básica de paginación
        if (page < 1 || limit < 1) {
            return res.status(400).json({
                message: 'Valores de paginación inválidos'
            });
        }

        const posts =
            await PostService.getDiscoveryPosts(
                req.user.id,
                page,
                limit
            );

        return res.status(200).json(posts);

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

export default {
    createPost,
    getPost,
    getAllPosts,
    updatePost,
    deletePost,
    getAllPostsFromUser,
    deleteAllPostsFromUser,
    darleLike,
    getFollowingPosts,
    getDiscoveryPosts
};