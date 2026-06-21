import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/config';
import authService from '../services/auth';
import usuarioService from '../services/usuario';
import { AuthRequest } from '../middleware/auth';
import Usuario from '../models/Usuario';
import Logging from '../library/Logging';

const client = new OAuth2Client(config.google.clientId);

/**
 * POST /auth/register
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const savedUsuario = await usuarioService.createUsuario(req.body);

    const { accessToken, refreshToken } = authService.getTokens(savedUsuario);

    Logging.info(
      `[201] [auth] User Registered | userId=${savedUsuario._id} email=${savedUsuario.email}`,
    );

    res.cookie(config.cookies.refreshName, refreshToken, config.cookies.options);

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
        rol: savedUsuario.rol,
      },
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
    const usuario = await authService.validateUserCredentials(req.body.email, req.body.password);

    if (!usuario) {
      Logging.warning(`[401] [auth] Login Failed (Invalid Credentials) | email=${email}`);
      return res.status(401).json({
        message: 'Credenciales incorrectas',
      });
    }

    const { accessToken, refreshToken } = authService.getTokens(usuario);

    Logging.info(`[200] [auth] Login Success | userId=${usuario._id} email=${email}`);

    res.cookie(config.cookies.refreshName, refreshToken, config.cookies.options);

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
        rol: usuario.rol,
      },
    });
  } catch (error) {
    Logging.error(`[500] [auth] Login Failed | email=${email} error=${error}`);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

/**
 * POST /auth/refresh
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incomingRefreshToken =
      req.cookies?.[config.cookies.refreshName] || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      Logging.warning(`[401] [auth] Refresh Token Missing`);
      return res.status(401).json({
        message: 'Refresh token requerido',
      });
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshUserSession(incomingRefreshToken);

    Logging.info(`[200] [auth] Token Refreshed`);

    res.cookie(config.cookies.refreshName, newRefreshToken, config.cookies.options);

    return res.status(200).json({
      message: 'Token refrescado',
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    Logging.warning(`[401] [auth] Refresh Token Invalid/Expired`);
    return res.status(401).json({
      message: 'Refresh token expirado o inválido',
    });
  }
};

/**
 * POST /auth/logout
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie(config.cookies.refreshName, { ...config.cookies.options });

    Logging.info(`[200] [auth] Logout Success`);

    return res.status(200).json({
      message: 'Logout exitoso',
    });
  } catch (error) {
    Logging.error(`[500] [auth] Logout Failed | error=${error}`);

    return res.status(500).json({
      message: 'Internal server error',
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
        message: 'No autenticado',
      });
    }

    const usuario = await Usuario.findById(req.user.id).populate('universidad');

    if (!usuario) {
      Logging.warning(`[404] [auth] GetMe User Not Found | userId=${req.user.id}`);
      return res.status(404).json({
        message: 'Usuario no encontrado',
      });
    }

    Logging.info(`[200] [auth] GetMe Success | userId=${req.user.id}`);

    return res.status(200).json(usuario);
  } catch (error) {
    Logging.error(`[500] [auth] GetMe Failed | error=${error}`);

    return res.status(500).json({
      message: 'Internal server error',
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
        message: 'No autenticado',
      });
    }

    const updatedUsuario = await usuarioService.updateUsuario(userId, req.body);

    Logging.info(`[200] [auth] UpdateMe Success | userId=${userId}`);

    return res.status(200).json(updatedUsuario);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      Logging.warning(`[422] [auth] UpdateMe Validation Error | userId=${req.user?.id}`);
      return res.status(422).json({
        message: error.message,
      });
    }

    Logging.error(`[500] [auth] UpdateMe Failed | userId=${req.user?.id} error=${error}`);

    return res.status(500).json({
      message: 'Internal server error',
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
        message: 'No autenticado',
      });
    }

    const usuario = await usuarioService.softDeleteUsuario(userId);

    res.clearCookie(config.cookies.refreshName, { ...config.cookies.options });

    Logging.info(`[200] [auth] SoftDelete Account | userId=${userId}`);

    return res.status(200).json({
      message: 'Cuenta desactivada correctamente',
      usuario,
    });
  } catch (error) {
    Logging.error(`[500] [auth] SoftDeleteMe Failed | userId=${req.user?.id}`);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

/**
 * POST /auth/google
 */
export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.body;

  if (!token) {
    Logging.warning(`[400] [auth] Google Login Token Missing`);
    return res.status(400).json({ message: 'Token de Google requerido' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      Logging.warning(`[400] [auth] Google Login Token Invalid`);
      return res.status(400).json({ message: 'Token de Google inválido' });
    }

    const { email, name, picture } = payload;

    // Buscar si existe el usuario
    const usuarioExistente = await Usuario.findOne({ email: email.toLowerCase() });

    if (!usuarioExistente) {
      // Registrar nuevo usuario
      const randomPassword =
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const nuevoUsuario = await usuarioService.createUsuario({
        nombre: name || 'Google User',
        email: email.toLowerCase(),
        password: randomPassword,
        avatarUrl: picture || 'https://api.dicebear.com/7.x/avataaars/png?seed=default-avatar',
        rol: 'user',
        activo: true,
      });

      Logging.info(
        `[201] [auth] Google User Registered | userId=${nuevoUsuario._id} email=${nuevoUsuario.email}`,
      );

      const { accessToken, refreshToken } = authService.getTokens(nuevoUsuario);

      res.cookie(config.cookies.refreshName, refreshToken, config.cookies.options);

      return res.status(200).json({
        message: 'Login exitoso con Google',
        accessToken,
        refreshToken,
        usuario: {
          _id: nuevoUsuario._id,
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          avatarUrl: nuevoUsuario.avatarUrl,
          universidad: nuevoUsuario.universidad,
          rol: nuevoUsuario.rol,
        },
      });
    }

    if (!usuarioExistente.activo) {
      Logging.warning(`[403] [auth] Google Login Attempt by Inactive User | email=${email}`);
      return res.status(403).json({ message: 'Usuario inactivo. Contacte al administrador.' });
    }

    Logging.info(
      `[200] [auth] Google Login Success | userId=${usuarioExistente._id} email=${email}`,
    );

    const { accessToken, refreshToken } = authService.getTokens(usuarioExistente);

    res.cookie(config.cookies.refreshName, refreshToken, config.cookies.options);

    return res.status(200).json({
      message: 'Login exitoso con Google',
      accessToken,
      refreshToken,
      usuario: {
        _id: usuarioExistente._id,
        nombre: usuarioExistente.nombre,
        email: usuarioExistente.email,
        avatarUrl: usuarioExistente.avatarUrl,
        universidad: usuarioExistente.universidad,
        rol: usuarioExistente.rol,
      },
    });
  } catch (error) {
    Logging.error(`[500] [auth] Google Login Failed | error=${error}`);
    return res
      .status(500)
      .json({ message: 'Error interno del servidor al verificar Google Token' });
  }
};

export default {
  login,
  register,
  refreshToken,
  logout,
  getMe,
  updateMe,
  softDeleteMe,
  googleLogin,
};
