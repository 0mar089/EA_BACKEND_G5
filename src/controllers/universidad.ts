import { NextFunction, Request, Response } from 'express';
import UniversidadService from '../services/universidad';

const createUniversidad = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const savedUniversidad = await UniversidadService.createUniversidad(req.body);
        return res.status(201).json(savedUniversidad);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readUniversidad = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const universidad = await UniversidadService.getUniversidad(req.params.universidadId);
        return universidad ? res.status(200).json(universidad) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const universidades = await UniversidadService.getAllUniversidades();
        return res.status(200).json(universidades);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updateUniversidad = async (req: Request, res: Response, next: NextFunction) => {
    const universidadId = req.params.universidadId;

    try {
        const universidad = await UniversidadService.updateUniversidad(universidadId, req.body);
        return universidad ? res.status(200).json(universidad) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const deleteUniversidad = async (req: Request, res: Response, next: NextFunction) => {
    const universidadId = req.params.universidadId;

    try {
        const universidad = await UniversidadService.deleteUniversidad(universidadId);
        return universidad ? res.status(201).json(universidad) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

export default { createUniversidad, readUniversidad, readAll, updateUniversidad, deleteUniversidad };