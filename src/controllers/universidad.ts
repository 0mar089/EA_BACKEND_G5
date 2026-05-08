import { NextFunction, Request, Response } from 'express';
import UniversidadService from '../services/universidad';

const createUniversidad = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const savedUniversidad = await UniversidadService.createUniversidad(req.body);
        return res.status(201).json(savedUniversidad);

    } catch (error: any) {

        if (error.name === 'ValidationError') {
            return res.status(422).json({ message: error.message });
        }

        if (error.code === 11000) {
            return res.status(409).json({ message: 'Universidad ya existe' });
        }

        return res.status(500).json({ error });
    }
};

const readUniversidad = async (req: Request, res: Response, next: NextFunction) => {

    const universidadId = req.params.universidadId;

    try {

        const universidad = await UniversidadService.getUniversidad(universidadId);

        return universidad
            ? res.status(200).json(universidad)
            : res.status(404).json({ message: 'not found' });

    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readAll = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const pageRaw = req.query.page as string;
        const limitRaw = req.query.limit as string;

        const page = pageRaw ? parseInt(pageRaw) : 1;
        const limit = limitRaw ? parseInt(limitRaw) : 10;

        const search = (req.query.search as string) || '';

        if (page < 1 || limit < 1) {
            return res.status(400).json({
                message: 'page y limit deben ser mayores a 0'
            });
        }

        const universidades =
            await UniversidadService.getAllUniversidades(page, limit, search);

        return res.status(200).json(universidades);

    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updateUniversidad = async (req: Request, res: Response, next: NextFunction) => {

    const universidadId = req.params.universidadId;

    try {

        const universidad =
            await UniversidadService.updateUniversidad(universidadId, req.body);

        return universidad
            ? res.status(200).json(universidad)
            : res.status(404).json({ message: 'not found' });

    } catch (error: any) {

        if (error.name === 'ValidationError') {
            return res.status(422).json({ message: error.message });
        }

        if (error.code === 11000) {
            return res.status(409).json({ message: 'Universidad ya existe' });
        }

        return res.status(500).json({ error });
    }
};

const deleteUniversidad = async (req: Request, res: Response, next: NextFunction) => {

    const universidadId = req.params.universidadId;

    try {

        const universidad =
            await UniversidadService.deleteUniversidad(universidadId);

        return universidad
            ? res.status(200).json({ message: 'deleted', universidad })
            : res.status(404).json({ message: 'not found' });

    } catch (error) {
        return res.status(500).json({ error });
    }
};

export default {
    createUniversidad,
    readUniversidad,
    readAll,
    updateUniversidad,
    deleteUniversidad
};