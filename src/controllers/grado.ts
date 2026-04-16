import { NextFunction, Request, Response } from 'express';
import GradoService from '../services/grado';

const createGrado = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const savedGrado = await GradoService.createGrado(req.body);
        return res.status(201).json(savedGrado);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readGrado = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const grado = await GradoService.getGrado(req.params.gradoId);
        return grado ? res.status(200).json(grado) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readGradosByUniversidad = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const grados = await GradoService.getGradosByUniversidad(req.params.universidadId);
        return res.status(200).json(grados);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updateGrado = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const grado = await GradoService.updateGrado(req.params.gradoId, req.body);
        return grado ? res.status(200).json(grado) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const deleteGrado = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const grado = await GradoService.deleteGrado(req.params.gradoId);
        return grado ? res.status(201).json({ message: 'deleted' }) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

export default { createGrado, readGrado, readGradosByUniversidad, updateGrado, deleteGrado };
