import { Request, Response } from 'express';
import mongoose from 'mongoose';
import BugReportService from '../services/bugReport';
import { AuthRequest } from '../middleware/auth';
import Logging from '../library/Logging';

const isValidObjectId = (id: string) =>
    mongoose.Types.ObjectId.isValid(id);

const createBugReport = async (req: AuthRequest, res: Response) => {
    try {

        const usuarioReporta = req.user?.id;

        if (!usuarioReporta) {
            Logging.warning(`[401] [bug] Unauthorized Create Bug`);
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

        Logging.info(`[201] [bug] Created | bugId=${savedBug._id} userId=${usuarioReporta}`);

        return res.status(201).json(savedBug);

    } catch (error: any) {

        if (error.name === 'ValidationError') {
            Logging.warning(`[422] [bug] Validation Error | message=${error.message}`);
            return res.status(422).json({ message: error.message });
        }

        Logging.error(`[500] [bug] Create Failed | error=${error}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const getBugReport = async (req: Request, res: Response) => {

    const bugId = req.params.bugId;

    if (!isValidObjectId(bugId)) {
        Logging.warning(`[400] [bug] Invalid ID | bugId=${bugId}`);
        return res.status(400).json({ message: 'ID inválido' });
    }

    try {

        const bug =
            await BugReportService.getBugReport(bugId);

        if (!bug) {
            Logging.warning(`[404] [bug] Not Found | bugId=${bugId}`);
            return res.status(404).json({ message: 'No encontrado' });
        }

        Logging.info(`[200] [bug] Retrieved | bugId=${bugId}`);

        return res.status(200).json(bug);

    } catch (error) {

        Logging.error(`[500] [bug] Get Failed | bugId=${bugId}`);
        return res.status(500).json({ message: 'Internal server error' });
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
            Logging.warning(`[400] [bug] Invalid Pagination | page=${page} limit=${limit}`);
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

        Logging.info(`[200] [bug] List All | page=${page} limit=${limit} estado=${estado}`);

        return res.status(200).json(bugs);

    } catch (error) {

        Logging.error(`[500] [bug] List Failed | error=${error}`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const updateStatus = async (req: Request, res: Response) => {

    const bugId = req.params.bugId;

    if (!isValidObjectId(bugId)) {
        Logging.warning(`[400] [bug] Invalid Update ID | bugId=${bugId}`);
        return res.status(400).json({ message: 'ID inválido' });
    }

    try {

        const { estado } = req.body;

        const updated =
            await BugReportService.updateBugReportStatus(
                bugId,
                estado
            );

        if (!updated) {
            Logging.warning(`[404] [bug] Update Not Found | bugId=${bugId}`);
            return res.status(404).json({ message: 'No encontrado' });
        }

        Logging.info(`[200] [bug] Status Updated | bugId=${bugId} estado=${estado}`);

        return res.status(200).json(updated);

    } catch (error: any) {

        if (error.name === 'ValidationError') {
            Logging.warning(`[422] [bug] Update Validation Error | bugId=${bugId}`);
            return res.status(422).json({ message: error.message });
        }

        Logging.error(`[500] [bug] Update Failed | bugId=${bugId}`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const deleteBugReport = async (req: Request, res: Response) => {

    const bugId = req.params.bugId;

    if (!isValidObjectId(bugId)) {
        Logging.warning(`[400] [bug] Invalid Delete ID | bugId=${bugId}`);
        return res.status(400).json({ message: 'ID inválido' });
    }

    try {

        const deleted =
            await BugReportService.deleteBugReport(bugId);

        if (!deleted) {
            Logging.warning(`[404] [bug] Delete Not Found | bugId=${bugId}`);
            return res.status(404).json({ message: 'No encontrado' });
        }

        Logging.info(`[200] [bug] Deleted | bugId=${bugId}`);

        return res.status(200).json({
            message: 'Eliminado'
        });

    } catch (error) {

        Logging.error(`[500] [bug] Delete Failed | bugId=${bugId}`);
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