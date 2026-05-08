import { Request, Response } from 'express';
import BugReportService from '../services/bugReport';
import { AuthRequest } from '../middleware/auth';

const createBugReport = async (req: AuthRequest, res: Response) => {
    try {
        const usuarioReporta = req.user?.id;
        if (!usuarioReporta) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        const bugData = {
            ...req.body,
            usuarioReporta
        };

        const savedBug = await BugReportService.createBugReport(bugData);
        return res.status(201).json(savedBug);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getBugReport = async (req: Request, res: Response) => {
    try {
        const bug = await BugReportService.getBugReport(req.params.bugId);
        return bug ? res.status(200).json(bug) : res.status(404).json({ message: 'No encontrado' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getAllBugReports = async (req: Request, res: Response) => {
    try {
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const estado = req.query.estado ? req.query.estado as string : 'all';
        
        const bugs = await BugReportService.getAllBugReports(page, limit, estado);
        return res.status(200).json(bugs);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updateStatus = async (req: Request, res: Response) => {
    try {
        const { estado } = req.body;
        const updated = await BugReportService.updateBugReportStatus(req.params.bugId, estado);
        return updated ? res.status(200).json(updated) : res.status(404).json({ message: 'No encontrado' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const deleteBugReport = async (req: Request, res: Response) => {
    try {
        const deleted = await BugReportService.deleteBugReport(req.params.bugId);
        return deleted ? res.status(200).json({ message: 'Eliminado' }) : res.status(404).json({ message: 'No encontrado' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

export default {
    createBugReport,
    getBugReport,
    getAllBugReports,
    updateStatus,
    deleteBugReport
};
