import { Request, Response } from 'express';
import ReportService from '../services/report';
import { AuthRequest } from '../middleware/auth';

const createReport = async (req: AuthRequest, res: Response) => {
    try {
        const usuarioReporta = req.user?.id; // El ID viene del token
        if (!usuarioReporta) {
            return res.status(401).json({ message: 'No se pudo identificar al usuario que reporta' });
        }

        const reportData = {
            ...req.body,
            usuarioReporta
        };

        const savedReport = await ReportService.createReport(reportData);
        return res.status(201).json(savedReport);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readReport = async (req: Request, res: Response) => {
    const reportId = req.params.reportId;
    try {
        const report = await ReportService.getReport(reportId);
        return report ? res.status(200).json(report) : res.status(404).json({ message: 'Reporte no encontrado' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readAll = async (req: Request, res: Response) => {
    try {
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const search = req.query.search ? req.query.search as string : '';
        const tipo = req.query.tipo ? req.query.tipo as string : 'all';
        const activeOnly = req.query.activeOnly ? req.query.activeOnly as string : 'false';
        const startDate = req.query.startDate ? req.query.startDate as string : '';
        const endDate = req.query.endDate ? req.query.endDate as string : '';
        const estado = req.query.estado ? req.query.estado as string : 'all';
        
        const reports = await ReportService.getAllReports(page, limit, search, tipo, activeOnly, startDate, endDate, estado);
        return res.status(200).json(reports);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updateStatus = async (req: Request, res: Response) => {
    const reportId = req.params.reportId;
    const { estado } = req.body;
    try {
        const updatedReport = await ReportService.updateReportStatus(reportId, estado);
        return updatedReport ? res.status(200).json(updatedReport) : res.status(404).json({ message: 'Reporte no encontrado' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const deleteReport = async (req: Request, res: Response) => {
    const reportId = req.params.reportId;
    try {
        const deletedReport = await ReportService.deleteReport(reportId);
        return deletedReport ? res.status(200).json({ message: 'Reporte eliminado con éxito' }) : res.status(404).json({ message: 'Reporte no encontrado' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readByUser = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    try {
        const reports = await ReportService.getReportsByUser(userId, page, limit);
        return res.status(200).json(reports);
    } catch (error) {
        return res.status(500).json({ error });
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
