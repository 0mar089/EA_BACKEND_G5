import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import GradoService from '../services/grado';

const isValidObjectId = (id: string) =>
    mongoose.Types.ObjectId.isValid(id);

const createGrado = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const savedGrado =
            await GradoService.createGrado(req.body);

        return res.status(201).json(savedGrado);

    } catch (error: any) {
        // errores de validación
        if (error.name === 'ValidationError') {
            return res.status(422).json({
                message: error.message
            });
        }

        // conflictos / duplicados
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'El grado ya existe'
            });
        }

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const readGrado = async (req: Request, res: Response, next: NextFunction) => {

    const gradoId = req.params.gradoId;

    // Validamos el ObjectId antes de consultar
    if (!isValidObjectId(gradoId)) {
        return res.status(400).json({
            message: 'ID de grado inválido'
        });
    }

    try {

        const grado =
            await GradoService.getGrado(gradoId);

        return grado
            ? res.status(200).json(grado)
            : res.status(404).json({
                message: 'not found'
            });

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const readAllGrados = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const grados =
            await GradoService.getAllGrados();

        return res.status(200).json(grados);

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const readGradosByUniversidad = async (req: Request, res: Response, next: NextFunction) => {

    const universidadId = req.params.universidadId;

    // Validamos el ObjectId antes de consultar
    if (!isValidObjectId(universidadId)) {
        return res.status(400).json({
            message: 'ID de universidad inválido'
        });
    }

    try {

        const grados =
            await GradoService.getGradosByUniversidad(
                universidadId
            );

        return res.status(200).json(grados);

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const updateGrado = async (req: Request, res: Response, next: NextFunction) => {

    const gradoId = req.params.gradoId;

    // Validamos el ObjectId antes de consultar
    if (!isValidObjectId(gradoId)) {
        return res.status(400).json({
            message: 'ID de grado inválido'
        });
    }

    try {

        const grado =
            await GradoService.updateGrado(
                gradoId,
                req.body
            );

        return grado
            ? res.status(200).json(grado)
            : res.status(404).json({
                message: 'not found'
            });

    } catch (error: any) {
        // errores de validación
        if (error.name === 'ValidationError') {
            return res.status(422).json({
                message: error.message
            });
        }

        // conflictos / duplicados
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'El grado ya existe'
            });
        }

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const deleteGrado = async (req: Request, res: Response, next: NextFunction) => {

    const gradoId = req.params.gradoId;

    // Validamos el ObjectId antes de consultar
    if (!isValidObjectId(gradoId)) {
        return res.status(400).json({
            message: 'ID de grado inválido'
        });
    }

    try {

        const grado =
            await GradoService.deleteGrado(gradoId);

        return grado
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

const readAsignaturasByGrado = async (req: Request, res: Response, next: NextFunction) => {

    const gradoId = req.params.gradoId;

    // Validamos el ObjectId antes de consultar
    if (!isValidObjectId(gradoId)) {
        return res.status(400).json({
            message: 'ID de grado inválido'
        });
    }

    try {

        const asignaturas =
            await GradoService.getAsignaturasByGrado(
                gradoId
            );

        return res.status(200).json(asignaturas);

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

export default {
    createGrado,
    readGrado,
    readGradosByUniversidad,
    updateGrado,
    deleteGrado,
    readAsignaturasByGrado,
    readAllGrados
};