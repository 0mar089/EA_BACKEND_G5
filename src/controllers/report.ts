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
        const reports = await ReportService.getAllReports();
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

export default {
    createReport,
    readReport,
    readAll,
    updateStatus,
    deleteReport
};
