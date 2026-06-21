import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import PostService from '../services/post';
import AuditService from '../services/audit';
import Usuario from '../models/Usuario';
import Logging from '../library/Logging';
import { AuthRequest } from '../middleware/auth';
import { matomoService } from '../services/matomo';

const isValidObjectId = (id: string) =>
    mongoose.Types.ObjectId.isValid(id);

const createPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        if (!req.user) {
            Logging.warning(`[401] [post] Unauthorized Create`);
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        const isAdmin = req.user.rol === 'admin';

        const authorId =
            (isAdmin && req.body.usuario)
                ? req.body.usuario
                : req.user.id;

        if (!isValidObjectId(authorId)) {
            Logging.warning(`[400] [post] Invalid Author ID | userId=${authorId}`);
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

        Logging.info(`[201] [post] Created | postId=${savedPost._id} userId=${authorId}`);
        matomoService.trackEvent(req, 'Posts', 'Create', savedPost._id);

        return res.status(201).json(savedPost);

    } catch (error: unknown) {
        const message = error instanceof Error ? (error as Error).message : String(error);
        if (error instanceof Error && (error as Error).name === 'ValidationError') {
            Logging.warning(`[422] [post] Validation Error`);
            return res.status(422).json({
                message: message
            });
        }

        Logging.error(`[500] [post] Create Failed`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getPost = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const postId = req.params.postId;

    if (!isValidObjectId(postId)) {
        Logging.warning(`[400] [post] Invalid ID | postId=${postId}`);
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

        if (!post) {
            Logging.warning(`[404] [post] Not Found | postId=${postId}`);
            return res.status(404).json({ message: 'not found' });
        }

        Logging.info(`[200] [post] Retrieved | postId=${postId}`);

        return res.status(200).json(post);

    } catch (error: unknown) {
        const message = error instanceof Error ? (error as Error).message : String(error);
        if (message === 'Esta cuenta es privada') {
            Logging.warning(`[403] [post] Private Access Blocked | postId=${postId}`);
            return res.status(403).json({ message });
        }

        Logging.error(`[500] [post] Get Failed | postId=${postId}`);
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

        if (page < 1 || limit < 1) {
            Logging.warning(`[400] [post] Invalid Pagination`);
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

        Logging.info(`[200] [post] List All | page=${page} limit=${limit}`);

        return res.status(200).json(postes);

    } catch (error) {

        Logging.error(`[500] [post] List Failed`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const updatePost = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const postId = req.params.postId;
    const user = req.user;

    if (!user) {
        Logging.warning(`[401] [post] Unauthorized Update`);
        return res.status(401).json({
            message: 'No autenticado'
        });
    }

    if (!isValidObjectId(postId)) {
        Logging.warning(`[400] [post] Invalid Update ID | postId=${postId}`);
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

        if (!post) {
            Logging.warning(`[404] [post] Update Not Found | postId=${postId}`);
            return res.status(404).json({ message: 'not found' });
        }

        Logging.info(`[200] [post] Updated | postId=${postId}`);

        return res.status(200).json(post);

    } catch (error: unknown) {
        const message = error instanceof Error ? (error as Error).message : String(error);
        if (message === 'Forbidden') {
            Logging.warning(`[403] [post] Forbidden Update | postId=${postId}`);
            return res.status(403).json({
                message: 'No tienes permiso para editar este post'
            });
        }

        if (error instanceof Error && (error as Error).name === 'ValidationError') {
            Logging.warning(`[422] [post] Validation Error | postId=${postId}`);
            return res.status(422).json({ message });
        }

        Logging.error(`[500] [post] Update Failed | postId=${postId}`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const deletePost = async (req: AuthRequest, res: Response) => {

    const postId = req.params.postId;
    const user = req.user;

    if (!user) return res.status(401).json({ message: 'No autenticado' });

    if (!isValidObjectId(postId)) {
        Logging.warning(`[400] [post] Invalid Delete ID | postId=${postId}`);
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

        if (!post) {
            Logging.warning(`[404] [post] Delete Not Found | postId=${postId}`);
            return res.status(404).json({ message: 'not found' });
        }

        Logging.info(`[200] [post] Deleted | postId=${postId}`);

        // Log Auditoría si es admin borrando contenido
        if (user.rol === 'admin') {
            await AuditService.recordLog({
                admin: new mongoose.Types.ObjectId(user.id),
                accion: AuditService.AdminAction.DELETE_POST,
                tipoObjetivo: 'post',
                objetivoId: postId,
                detalles: `Post eliminado por moderación`,
                ip: req.ip
            });
        }

        return res.status(200).json(post);

    } catch (error: unknown) {
        const message = error instanceof Error ? (error as Error).message : String(error);
        if (message === 'Forbidden') {
            Logging.warning(`[403] [post] Forbidden Delete | postId=${postId}`);
            return res.status(403).json({ message: 'Forbidden' });
        }

        Logging.error(`[500] [post] Delete Failed | postId=${postId}`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getAllPostsFromUser = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const userId = req.params.userId;

    if (!isValidObjectId(userId)) {
        Logging.warning(`[400] [post] Invalid User ID | userId=${userId}`);
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

        if (page < 1 || limit < 1) {
            Logging.warning(`[400] [post] Invalid Pagination | userId=${userId}`);
            return res.status(400).json({
                message: 'Valores de paginación inválidos'
            });
        }

        const targetUser = await Usuario.findById(userId);

        if (!targetUser) {
            Logging.warning(`[404] [post] User Not Found | userId=${userId}`);
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        if (targetUser.privado && !isAdmin && userId !== requesterId) {

            const isFollowing =
                targetUser.seguidores?.some(
                    (id: mongoose.Types.ObjectId | string) => id.toString() === requesterId
                );

            if (!isFollowing) {
                Logging.info(`[200] [post] Private Feed Blocked | userId=${userId}`);
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

        Logging.info(`[200] [post] User Feed | userId=${userId}`);

        return res.status(200).json(posts);

    } catch (error) {

        Logging.error(`[500] [post] User Feed Failed | userId=${userId}`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const deleteAllPostsFromUser = async (req: Request, res: Response, next: NextFunction) => {

    const userId = req.params.userId;

    if (!isValidObjectId(userId)) {
        Logging.warning(`[400] [post] Invalid Bulk Delete User ID | userId=${userId}`);
        return res.status(400).json({
            message: 'ID de usuario inválido'
        });
    }

    try {

        await PostService.deleteAllPostsFromUser(userId);

        Logging.info(`[200] [post] Bulk Deleted | userId=${userId}`);

        return res.status(200).json({
            message: 'All posts from user deleted successfully'
        });

    } catch (error) {

        Logging.error(`[500] [post] Bulk Delete Failed | userId=${userId}`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const darleLike = async (req: AuthRequest, res: Response) => {

    const postId = req.params.postId;
    const user = req.user;

    if (!user?.id) {
        Logging.warning(`[401] [post] Unauthorized Like`);
        return res.status(401).json({
            message: 'Usuario no autenticado'
        });
    }

    if (!isValidObjectId(postId)) {
        Logging.warning(`[400] [post] Invalid Like ID | postId=${postId}`);
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

        Logging.info(`[200] [post] Like Toggled | postId=${postId} userId=${user.id}`);

        return post
            ? res.status(200).json(post)
            : res.status(404).json({
                message: 'Post not found'
            });

    } catch (error) {

        Logging.error(`[500] [post] Like Failed | postId=${postId}`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getFollowingPosts = async (req: AuthRequest, res: Response) => {
    try {

        if (!req.user) {
            Logging.warning(`[401] [post] Unauthorized Following Feed`);
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

        if (page < 1 || limit < 1) {
            Logging.warning(`[400] [post] Invalid Pagination (following)`);
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

        Logging.info(`[200] [post] Following Feed | userId=${req.user.id}`);

        return res.status(200).json(posts);

    } catch (error) {

        Logging.error(`[500] [post] Following Feed Failed`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getDiscoveryPosts = async (req: AuthRequest, res: Response) => {
    try {

        if (!req.user) {
            Logging.warning(`[401] [post] Unauthorized Discovery Feed`);
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

        if (page < 1 || limit < 1) {
            Logging.warning(`[400] [post] Invalid Pagination (discovery)`);
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

        Logging.info(`[200] [post] Discovery Feed | userId=${req.user.id}`);

        return res.status(200).json(posts);

    } catch (error) {

        Logging.error(`[500] [post] Discovery Feed Failed`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const toggleSavePost = async (req: AuthRequest, res: Response) => {

    try {
        if (!req.user) {
            Logging.warning(`[401] [post] Unauthorized Save Toggle`);
            return res.status(401).json({ message: 'No autenticado' });
        }

        const userId = req.user.id;
        const { postId } = req.params;

        const result = await PostService.toggleSavePost(userId, postId);

        Logging.info(
            `[200] [post] Toggle Save | userId=${userId} postId=${postId} saved=${result.saved}`
        );

        return res.status(200).json(result);

    } catch (error: unknown) {
        const message = error instanceof Error ? (error as Error).message : String(error);
        if (message === 'ID de post inválido') {
            return res.status(400).json({ message });
        }

        Logging.error(`[500] [post] Toggle Save Failed`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getSavedPosts = async (req: AuthRequest, res: Response) => {

    try {

        if (!req.user) {
            Logging.warning(`[401] [post] Unauthorized Saved Posts`);
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

        if (page < 1 || limit < 1) {
            Logging.warning(`[400] [post] Invalid Pagination (saved)`);
            return res.status(400).json({
                message: 'Valores de paginación inválidos'
            });
        }

        const posts =
            await PostService.getSavedPosts(
                req.user.id,
                page,
                limit
            );

        Logging.info(`[200] [post] Saved Posts | userId=${req.user?.id}`);
        return res.status(200).json(posts);

    } catch (error) {

        Logging.error(`[500] [post] Saved Posts Failed`);
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
    getDiscoveryPosts,
    toggleSavePost,
    getSavedPosts
};