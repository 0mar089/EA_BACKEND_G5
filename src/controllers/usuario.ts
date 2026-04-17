import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import UsuarioService from '../services/usuario';

const createUsuario = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const savedUsuario = await UsuarioService.createUsuario(req.body);
        return res.status(201).json(savedUsuario);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readUsuario = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const usuarioId = req.params.usuarioId;

    try {
        const rol = req.user?.rol;
        let usuario;

        if (rol === 'admin') {
            usuario = await UsuarioService.getUsuario(usuarioId);
        } else {
            usuario = await UsuarioService.getUsuarioBasic(usuarioId);
        }

        return usuario ? res.status(200).json(usuario) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readAll = async (req: AuthRequest, res: Response) => {
    try {
        const rol = req.user?.rol;
        const search = req.query.search as string | undefined;
        const universidades = req.query.universidades as string | undefined;

        let usuarios;

        if (rol === 'admin') {
            usuarios = await UsuarioService.getAllUsuariosAdmin(search, universidades);
        } else {
            usuarios = await UsuarioService.getAllUsuarios(search, universidades);
        }

        return res.status(200).json(usuarios);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updateUsuario = async (req: Request, res: Response, next: NextFunction) => {
    const usuarioId = req.params.usuarioId;
    try {
        const updatedUsuario = await UsuarioService.updateUsuario(usuarioId, req.body);
        return updatedUsuario ? res.status(201).json(updatedUsuario) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};


const softDeleteUsuario = async (req: Request, res: Response, next: NextFunction) => {
    const usuarioId = req.params.usuarioId;

    try {
        const usuario = await UsuarioService.softDeleteUsuario(usuarioId);
        return usuario
            ? res.status(200).json({ message: 'Cuenta desactivada correctamente', usuario })
            : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const recoveryUsuario = async (req: Request, res: Response, next: NextFunction) => {
    const usuarioId = req.params.usuarioId;

    try {
        const usuario = await UsuarioService.recoveryUsuario(usuarioId);
        return usuario
            ? res.status(200).json({ message: 'Cuenta recuperada correctamente', usuario })
            : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const hardDeleteUsuario = async (req: Request, res: Response, next: NextFunction) => {
    const usuarioId = req.params.usuarioId;

    try {
        const usuario = await UsuarioService.hardDeleteUsuario(usuarioId);
        return usuario
            ? res.status(200).json({ message: 'Usuario eliminado permanentemente', usuario })
            : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const toggleFollow = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const targetId = req.params.targetId;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const result = await UsuarioService.toggleFollow(userId, targetId);
        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

const getFollowers = async (req: Request, res: Response) => {
    const usuarioId = req.params.usuarioId;
    try {
        const result = await UsuarioService.getFollowers(usuarioId);
        return result ? res.status(200).json(result) : res.status(404).json({ message: 'User not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getFollowing = async (req: Request, res: Response) => {
    const usuarioId = req.params.usuarioId;
    try {
        const result = await UsuarioService.getFollowing(usuarioId);
        return result ? res.status(200).json(result) : res.status(404).json({ message: 'User not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const removeFollower = async (req: AuthRequest, res: Response) => {
    const userId = req.params.usuarioId;
    const followerId = req.params.followerId;
    const requesterId = req.user?.id;
    const requesterRole = req.user?.rol;

    if (!requesterId || !requesterRole) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const result = await UsuarioService.removeFollower(userId, followerId, requesterId, requesterRole);
        return res.status(200).json(result);
    } catch (error: any) {
        if (error.message === 'Forbidden') return res.status(403).json({ message: 'Forbidden' });
        return res.status(400).json({ message: error.message });
    }
};

const unfollowUser = async (req: AuthRequest, res: Response) => {
    const userId = req.params.usuarioId;
    const targetId = req.params.targetId;
    const requesterId = req.user?.id;
    const requesterRole = req.user?.rol;

    if (!requesterId || !requesterRole) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const result = await UsuarioService.unfollowUser(userId, targetId, requesterId, requesterRole);
        return res.status(200).json(result);
    } catch (error: any) {
        if (error.message === 'Forbidden') return res.status(403).json({ message: 'Forbidden' });
        return res.status(400).json({ message: error.message });
    }
};

export default { 
    createUsuario, 
    readUsuario, 
    readAll, 
    updateUsuario, 
    softDeleteUsuario, 
    hardDeleteUsuario, 
    recoveryUsuario,
    toggleFollow,
    getFollowers,
    getFollowing,
    removeFollower,
    unfollowUser
};
