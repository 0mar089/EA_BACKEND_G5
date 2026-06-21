import { Request, Response } from 'express';
import AuditService from '../services/audit';
import { AuthRequest } from '../middleware/auth';

const getAllLogs = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        
        // Filtros extendidos
        const filters: Record<string, any> = {
            adminId: req.query.adminId,
            accion: req.query.accion,
            tipoObjetivo: req.query.tipoObjetivo,
            objetivoId: req.query.objetivoId,
            search: req.query.search,
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };

        const logs = await AuditService.getLogs(page, limit, filters);
        
        return res.status(200).json(logs);
    } catch (error: unknown) {
        return res.status(500).json({ message: (error as Error).message });
    }
};

export default {
    getAllLogs
};
