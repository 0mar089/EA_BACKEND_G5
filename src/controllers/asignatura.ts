import { NextFunction, Request, Response } from 'express';
import AsignaturaService from '../services/asignatura';

const createAsignatura = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const savedAsignatura = await AsignaturaService.createAsignatura(req.body);
        return res.status(201).json(savedAsignatura);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readAsignatura = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asignatura = await AsignaturaService.getAsignatura(req.params.asignaturaId);
        return asignatura
            ? res.status(200).json(asignatura)
            : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readAllAsignaturas = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asignaturas = await AsignaturaService.getAllAsignaturas();
        return res.status(200).json(asignaturas);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readAsignaturasByGrado = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asignaturas = await AsignaturaService.getAsignaturasByGrado(req.params.gradoId);
        return res.status(200).json(asignaturas);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updateAsignatura = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asignatura = await AsignaturaService.updateAsignatura(
            req.params.asignaturaId,
            req.body
        );

        return asignatura
            ? res.status(200).json(asignatura)
            : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const deleteAsignatura = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asignatura = await AsignaturaService.deleteAsignatura(req.params.asignaturaId);

        return asignatura
            ? res.status(200).json({ message: 'deleted' })
            : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

export default {
    createAsignatura,
    readAsignatura,
    readAsignaturasByGrado,
    updateAsignatura,
    deleteAsignatura,
    readAllAsignaturas
};