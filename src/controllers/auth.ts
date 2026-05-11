import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';
import authService from '../services/auth';
import usuarioService from '../services/usuario';
import { AuthRequest } from '../middleware/auth';
import Usuario from '../models/Usuario';
import Logging from '../library/Logging';

/**
 * POST /auth/register
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const savedUsuario =
            await usuarioService.createUsuario(req.body);

        const { accessToken, refreshToken } =
            authService.getTokens(savedUsuario);

        Logging.info(`[201] [auth] User Registered | userId=${savedUsuario._id} email=${savedUsuario.email}`);

        res.cookie(
            config.cookies.refreshName,
            refreshToken,
            config.cookies.options
        );

        return res.status(201).json({
            message: 'Usuario registrado exitosamente',
            accessToken,
            refreshToken,
            usuario: {
                _id: savedUsuario._id,
                nombre: savedUsuario.nombre,
                email: savedUsuario.email,
                avatarUrl: savedUsuario.avatarUrl,
                universidad: savedUsuario.universidad,
                rol: savedUsuario.rol
            }
        });

    } catch (error: any) {

        if (error.name === 'ValidationError') {
            Logging.warning(`[422] [auth] Register Validation Error | message=${error.message}`);
            return res.status(422).json({ message: error.message });
        }

        if (error.code === 11000) {
            Logging.warning(`[409] [auth] Email Already Exists | email=${req.body.email}`);
            return res.status(409).json({ message: 'El email ya está registrado' });
        }

        Logging.error(`[500] [auth] Register Failed | error=${error}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * POST /auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {

    const { email } = req.body;

    try {

        const usuario =
            await authService.validateUserCredentials(
                req.body.email,
                req.body.password
            );

        if (!usuario) {
            Logging.warning(`[401] [auth] Login Failed (Invalid Credentials) | email=${email}`);
            return res.status(401).json({
                message: 'Credenciales incorrectas'
            });
        }

        const { accessToken, refreshToken } =
            authService.getTokens(usuario);

        Logging.info(`[200] [auth] Login Success | userId=${usuario._id} email=${email}`);

        res.cookie(
            config.cookies.refreshName,
            refreshToken,
            config.cookies.options
        );

        return res.status(200).json({
            message: 'Login exitoso',
            accessToken,
            refreshToken,
            usuario: {
                _id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                avatarUrl: usuario.avatarUrl,
                universidad: usuario.universidad,
                rol: usuario.rol
            }
        });

    } catch (error) {

        Logging.error(`[500] [auth] Login Failed | email=${email} error=${error}`);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

/**
 * POST /auth/refresh
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const incomingRefreshToken =
            req.cookies?.[config.cookies.refreshName] ||
            req.body?.refreshToken;

        if (!incomingRefreshToken) {
            Logging.warning(`[401] [auth] Refresh Token Missing`);
            return res.status(401).json({
                message: 'Refresh token requerido'
            });
        }

        const {
            accessToken,
            refreshToken: newRefreshToken
        } = await authService.refreshUserSession(incomingRefreshToken);

        Logging.info(`[200] [auth] Token Refreshed`);

        res.cookie(
            config.cookies.refreshName,
            newRefreshToken,
            config.cookies.options
        );

        return res.status(200).json({
            message: 'Token refrescado',
            accessToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {

        Logging.warning(`[401] [auth] Refresh Token Invalid/Expired`);
        return res.status(401).json({
            message: 'Refresh token expirado o inválido'
        });
    }
};

/**
 * POST /auth/logout
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {

        res.clearCookie(
            config.cookies.refreshName,
            { ...config.cookies.options }
        );

        Logging.info(`[200] [auth] Logout Success`);

        return res.status(200).json({
            message: 'Logout exitoso'
        });

    } catch (error) {

        Logging.error(`[500] [auth] Logout Failed | error=${error}`);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

/**
 * GET /auth/me
 */
export const getMe = async (req: AuthRequest, res: Response) => {
    try {

        if (!req.user) {
            Logging.warning(`[401] [auth] GetMe Unauthorized`);
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        const usuario =
            await Usuario.findById(req.user.id)
                .populate('universidad');

        if (!usuario) {
            Logging.warning(`[404] [auth] GetMe User Not Found | userId=${req.user.id}`);
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        Logging.info(`[200] [auth] GetMe Success | userId=${req.user.id}`);

        return res.status(200).json(usuario);

    } catch (error) {

        Logging.error(`[500] [auth] GetMe Failed | error=${error}`);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

/**
 * PATCH /auth/me
 */
export const updateMe = async (req: AuthRequest, res: Response) => {
    try {

        const userId = req.user?.id;

        if (!userId) {
            Logging.warning(`[401] [auth] UpdateMe Unauthorized`);
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        const updatedUsuario =
            await usuarioService.updateUsuario(
                userId,
                req.body
            );

        Logging.info(`[200] [auth] UpdateMe Success | userId=${userId}`);

        return res.status(200).json(updatedUsuario);

    } catch (error: any) {

        if (error.name === 'ValidationError') {
            Logging.warning(`[422] [auth] UpdateMe Validation Error | userId=${req.user?.id}`);
            return res.status(422).json({
                message: error.message
            });
        }

        Logging.error(`[500] [auth] UpdateMe Failed | userId=${req.user?.id} error=${error}`);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

/**
 * PATCH /auth/me/soft-delete
 */
export const softDeleteMe = async (req: AuthRequest, res: Response) => {
    try {

        const userId = req.user?.id;

        if (!userId) {
            Logging.warning(`[401] [auth] SoftDeleteMe Unauthorized`);
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        const usuario =
            await usuarioService.softDeleteUsuario(userId);

        res.clearCookie(
            config.cookies.refreshName,
            { ...config.cookies.options }
        );

        Logging.info(`[200] [auth] SoftDelete Account | userId=${userId}`);

        return res.status(200).json({
            message: 'Cuenta desactivada correctamente',
            usuario
        });

    } catch (error) {

        Logging.error(`[500] [auth] SoftDeleteMe Failed | userId=${req.user?.id}`);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

export default {
    login,
    register,
    refreshToken,
    logout,
    getMe,
    updateMe,
    softDeleteMe
};