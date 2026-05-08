import { Request, Response } from 'express';
import mongoose from 'mongoose';
import BugReportService from '../services/bugReport';
import { AuthRequest } from '../middleware/auth';

const isValidObjectId = (id: string) =>
    mongoose.Types.ObjectId.isValid(id);

const createBugReport = async (req: AuthRequest, res: Response) => {
    try {

        const usuarioReporta = req.user?.id;

        if (!usuarioReporta) {
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        const bugData = {
            ...req.body,
            usuarioReporta
        };

        const savedBug =
            await BugReportService.createBugReport(bugData);

        return res.status(201).json(savedBug);

    } catch (error: any) {

        if (error.name === 'ValidationError') {
            return res.status(422).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getBugReport = async (req: Request, res: Response) => {

    const bugId = req.params.bugId;

    if (!isValidObjectId(bugId)) {
        return res.status(400).json({
            message: 'ID inválido'
        });
    }

    try {

        const bug =
            await BugReportService.getBugReport(bugId);

        return bug
            ? res.status(200).json(bug)
            : res.status(404).json({
                message: 'No encontrado'
            });

    } catch (error) {

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getAllBugReports = async (req: Request, res: Response) => {
    try {

        const page = req.query.page
            ? parseInt(req.query.page as string)
            : 1;

        const limit = req.query.limit
            ? parseInt(req.query.limit as string)
            : 10;

        const estado = req.query.estado
            ? req.query.estado as string
            : 'all';

        const plataforma = req.query.plataforma
            ? req.query.plataforma as string
            : 'all';

        const activeOnly = req.query.activeOnly
            ? req.query.activeOnly as string
            : 'false';

        if (page < 1 || limit < 1) {
            return res.status(400).json({
                message: 'Valores de paginación inválidos'
            });
        }

        const bugs =
            await BugReportService.getAllBugReports(
                page,
                limit,
                estado,
                plataforma,
                activeOnly
            );

        return res.status(200).json(bugs);

    } catch (error) {

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const updateStatus = async (req: Request, res: Response) => {

    const bugId = req.params.bugId;

    if (!isValidObjectId(bugId)) {
        return res.status(400).json({
            message: 'ID inválido'
        });
    }

    try {

        const { estado } = req.body;

        const updated =
            await BugReportService.updateBugReportStatus(
                bugId,
                estado
            );

        return updated
            ? res.status(200).json(updated)
            : res.status(404).json({
                message: 'No encontrado'
            });

    } catch (error: any) {

        if (error.name === 'ValidationError') {
            return res.status(422).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const deleteBugReport = async (req: Request, res: Response) => {

    const bugId = req.params.bugId;

    if (!isValidObjectId(bugId)) {
        return res.status(400).json({
            message: 'ID inválido'
        });
    }

    try {

        const deleted =
            await BugReportService.deleteBugReport(bugId);

        return deleted
            ? res.status(200).json({
                message: 'Eliminado'
            })
            : res.status(404).json({
                message: 'No encontrado'
            });

    } catch (error) {

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

export default {
    createBugReport,
    getBugReport,
    getAllBugReports,
    updateStatus,
    deleteBugReport
};