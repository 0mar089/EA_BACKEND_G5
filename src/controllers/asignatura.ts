import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import AsignaturaService from '../services/asignatura';

const isValidObjectId = (id: string) =>
    mongoose.Types.ObjectId.isValid(id);

const createAsignatura = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const savedAsignatura =
            await AsignaturaService.createAsignatura(req.body);

        return res.status(201).json(savedAsignatura);

    } catch (error: any) {

        if (error.name === 'ValidationError') {
            return res.status(422).json({
                message: error.message
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                message: 'La asignatura ya existe'
            });
        }


        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const readAsignatura = async (req: Request, res: Response, next: NextFunction) => {

    const asignaturaId = req.params.asignaturaId;

    if (!isValidObjectId(asignaturaId)) {
        return res.status(400).json({
            message: 'ID de asignatura inválido'
        });
    }

    try {

        const asignatura =
            await AsignaturaService.getAsignatura(asignaturaId);

        return asignatura
            ? res.status(200).json(asignatura)
            : res.status(404).json({
                message: 'not found'
            });

    } catch (error) {

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const readAllAsignaturas = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const asignaturas =
            await AsignaturaService.getAllAsignaturas();

        return res.status(200).json(asignaturas);

    } catch (error) {

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const readAsignaturasByGrado = async (req: Request, res: Response, next: NextFunction) => {

    const gradoId = req.params.gradoId;

    if (!isValidObjectId(gradoId)) {
        return res.status(400).json({
            message: 'ID de grado inválido'
        });
    }

    try {

        const asignaturas =
            await AsignaturaService.getAsignaturasByGrado(gradoId);

        return res.status(200).json(asignaturas);

    } catch (error) {

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const updateAsignatura = async (req: Request, res: Response, next: NextFunction) => {

    const asignaturaId = req.params.asignaturaId;

    if (!isValidObjectId(asignaturaId)) {
        return res.status(400).json({
            message: 'ID de asignatura inválido'
        });
    }

    try {

        const asignatura =
            await AsignaturaService.updateAsignatura(
                asignaturaId,
                req.body
            );

        return asignatura
            ? res.status(200).json(asignatura)
            : res.status(404).json({
                message: 'not found'
            });

    } catch (error: any) {

        if (error.name === 'ValidationError') {
            return res.status(422).json({
                message: error.message
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                message: 'La asignatura ya existe'
            });
        }

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const deleteAsignatura = async (req: Request, res: Response, next: NextFunction) => {

    const asignaturaId = req.params.asignaturaId;

    if (!isValidObjectId(asignaturaId)) {
        return res.status(400).json({
            message: 'ID de asignatura inválido'
        });
    }

    try {

        const asignatura =
            await AsignaturaService.deleteAsignatura(asignaturaId);

        return asignatura
            ? res.status(200).json({
                message: 'deleted'
            })
            : res.status(404).json({
                message: 'not found'
            });

    } catch (error) {

        return res.status(500).json({
            message: 'Internal server error'
        });
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