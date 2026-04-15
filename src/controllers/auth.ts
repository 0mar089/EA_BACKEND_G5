import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';
import authService from '../services/auth';
import usuarioService from '../services/usuario';
import { AuthRequest } from '../middleware/auth';
import Usuario from '../models/Usuario';

/**
 * POST /auth/register
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const savedUsuario = await usuarioService.createUsuario(req.body);
        const { accessToken, refreshToken } = authService.getTokens(savedUsuario);

        res.cookie(config.cookies.refreshName, refreshToken, config.cookies.options);

        return res.status(201).json({
            message: 'Usuario registrado exitosamente',
            accessToken,
            usuario: {
                _id: savedUsuario._id,
                nombre: savedUsuario.nombre,
                email: savedUsuario.email,
                avatarUrl: savedUsuario.avatarUrl,
                universidad: savedUsuario.universidad,
                rol: savedUsuario.rol
            }
        });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

/**
 * POST /auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    try {
        const usuario = await authService.validateUserCredentials(email, password);

        if (!usuario) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const { accessToken, refreshToken } = authService.getTokens(usuario);

        res.cookie(config.cookies.refreshName, refreshToken, config.cookies.options);

        return res.status(200).json({
            message: 'Login exitoso',
            accessToken,
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
        return res.status(500).json({ error });
    }
};

/**
 * POST /auth/refresh
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const incomingRefreshToken = req.cookies?.[config.cookies.refreshName] || req.body?.refreshToken;

        if (!incomingRefreshToken) {
            return res.status(401).json({ message: 'Refresh token requerido' });
        }

        const { accessToken, refreshToken: newRefreshToken } = await authService.refreshUserSession(incomingRefreshToken);

        res.cookie(config.cookies.refreshName, newRefreshToken, config.cookies.options);

        return res.status(200).json({
            message: 'Token refrescado',
            accessToken
        });
    } catch (error) {
        return res.status(401).json({ message: 'Refresh token expirado o inválido' });
    }
};

/**
 * POST /auth/logout
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.clearCookie(config.cookies.refreshName, {
            ...config.cookies.options
        });

        return res.status(200).json({ message: 'Logout exitoso' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

/**
 * GET /auth/me
 */
export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const usuario = await Usuario.findById(req.user?.id).populate('universidad');
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        return res.status(200).json(usuario);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

/**
 * PATCH /auth/me
 */
export const updateMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'No autenticado' });

        const updatedUsuario = await usuarioService.updateUsuario(userId, req.body);
        return res.status(200).json(updatedUsuario);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

/**
 * PATCH /auth/me/soft-delete
 */
export const softDeleteMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'No autenticado' });

        const usuario = await usuarioService.softDeleteUsuario(userId);
        res.clearCookie(config.cookies.refreshName, { ...config.cookies.options }); // Cerrar sesión al desactivar
        return res.status(200).json({ message: 'Cuenta desactivada correctamente', usuario });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

/**
 * DELETE /auth/me
 */
export default { login, register, refreshToken, logout, getMe, updateMe, softDeleteMe };
