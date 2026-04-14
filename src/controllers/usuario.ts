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

const readAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const rol = req.user?.rol;
        let usuarios;

        if (rol === 'admin') {
            usuarios = await UsuarioService.getAllUsuariosAdmin();
        } else {
            usuarios = await UsuarioService.getAllUsuarios();
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

export default { createUsuario, readUsuario, readAll, updateUsuario, softDeleteUsuario, hardDeleteUsuario, recoveryUsuario };
