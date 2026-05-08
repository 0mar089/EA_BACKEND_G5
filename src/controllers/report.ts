import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ReportService from '../services/report';
import { AuthRequest } from '../middleware/auth';

const isValidObjectId = (id: string) =>
    mongoose.Types.ObjectId.isValid(id);

const createReport = async (req: AuthRequest, res: Response) => {
    try {

        const usuarioReporta = req.user?.id; // El ID viene del token

        if (!usuarioReporta) {
            return res.status(401).json({
                message: 'No se pudo identificar al usuario que reporta'
            });
        }

        const reportData = {
            ...req.body,
            usuarioReporta
        };

        const savedReport =
            await ReportService.createReport(reportData);

        return res.status(201).json(savedReport);

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
                message: 'Reporte duplicado'
            });
        }

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const readReport = async (req: Request, res: Response) => {

    const reportId = req.params.reportId;

    // Validamos el ObjectId antes de consultar
    if (!isValidObjectId(reportId)) {
        return res.status(400).json({
            message: 'ID de reporte inválido'
        });
    }

    try {

        const report =
            await ReportService.getReport(reportId);

        return report
            ? res.status(200).json(report)
            : res.status(404).json({
                message: 'Reporte no encontrado'
            });

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const readAll = async (req: Request, res: Response) => {
    try {

        const page = req.query.page
            ? parseInt(req.query.page as string)
            : 1;

        const limit = req.query.limit
            ? parseInt(req.query.limit as string)
            : 10;

        const search = req.query.search
            ? req.query.search as string
            : '';

        const tipo = req.query.tipo
            ? req.query.tipo as string
            : 'all';

        const activeOnly = req.query.activeOnly
            ? req.query.activeOnly as string
            : 'false';

        const startDate = req.query.startDate
            ? req.query.startDate as string
            : '';

        const endDate = req.query.endDate
            ? req.query.endDate as string
            : '';

        const estado = req.query.estado
            ? req.query.estado as string
            : 'all';

        // Validación básica de paginación
        if (page < 1 || limit < 1) {
            return res.status(400).json({
                message: 'Valores de paginación inválidos'
            });
        }

        const reports =
            await ReportService.getAllReports(
                page,
                limit,
                search,
                tipo,
                activeOnly,
                startDate,
                endDate,
                estado
            );

        return res.status(200).json(reports);

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const updateStatus = async (req: Request, res: Response) => {

    const reportId = req.params.reportId;
    const { estado } = req.body;

    // Validamos el ObjectId antes de consultar
    if (!isValidObjectId(reportId)) {
        return res.status(400).json({
            message: 'ID de reporte inválido'
        });
    }

    try {

        // Validación básica
        if (!estado) {
            return res.status(400).json({
                message: 'El estado es obligatorio'
            });
        }

        const updatedReport =
            await ReportService.updateReportStatus(
                reportId,
                estado
            );

        return updatedReport
            ? res.status(200).json(updatedReport)
            : res.status(404).json({
                message: 'Reporte no encontrado'
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

const deleteReport = async (req: Request, res: Response) => {

    const reportId = req.params.reportId;

    // Validamos el ObjectId antes de consultar
    if (!isValidObjectId(reportId)) {
        return res.status(400).json({
            message: 'ID de reporte inválido'
        });
    }

    try {

        const deletedReport =
            await ReportService.deleteReport(reportId);

        return deletedReport
            ? res.status(200).json({
                message: 'Reporte eliminado con éxito'
            })
            : res.status(404).json({
                message: 'Reporte no encontrado'
            });

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const readByUser = async (req: Request, res: Response) => {

    const userId = req.params.userId;

    const page = req.query.page
        ? parseInt(req.query.page as string)
        : 1;

    const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : 10;

    // Validamos el ObjectId antes de consultar
    if (!isValidObjectId(userId)) {
        return res.status(400).json({
            message: 'ID de usuario inválido'
        });
    }

    try {

        // Validación básica de paginación
        if (page < 1 || limit < 1) {
            return res.status(400).json({
                message: 'Valores de paginación inválidos'
            });
        }

        const reports =
            await ReportService.getReportsByUser(
                userId,
                page,
                limit
            );

        return res.status(200).json(reports);

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

export default {
    createReport,
    readReport,
    readAll,
    readByUser,
    updateStatus,
    deleteReport
};