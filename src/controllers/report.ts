import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ReportService from '../services/report';
import AuditService from '../services/audit';
import { AuthRequest } from '../middleware/auth';
import Logging from '../library/Logging';

const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioReporta = req.user?.id; // El ID viene del token

    if (!usuarioReporta) {
      Logging.warning(`[401] [report] Create Report Unauthorized`);
      return res.status(401).json({
        message: 'No se pudo identificar al usuario que reporta',
      });
    }

    const reportData = {
      ...req.body,
      usuarioReporta,
    };

    const savedReport = await ReportService.createReport(reportData);

    Logging.info(
      `[201] [report] Report Created | reportId=${savedReport._id} | userId=${usuarioReporta}`,
    );

    return res.status(201).json(savedReport);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      Logging.warning(`[422] [report] Validation Error: ${error.message}`);
      return res.status(422).json({
        message: error.message,
      });
    }

    if (error.code === 11000) {
      Logging.warning(`[409] [report] Duplicate Report`);
      return res.status(409).json({
        message: 'Reporte duplicado',
      });
    }

    Logging.error(`[500] [report] Create Report Failed`);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

const readReport = async (req: Request, res: Response) => {
  const reportId = req.params.reportId;

  if (!isValidObjectId(reportId)) {
    Logging.warning(`[400] [report] Invalid Report ID: ${reportId}`);
    return res.status(400).json({
      message: 'ID de reporte inválido',
    });
  }

  try {
    const report = await ReportService.getReport(reportId);

    if (report) {
      Logging.info(`[200] [report] Report Fetched | reportId=${reportId}`);
      return res.status(200).json(report);
    }

    Logging.warning(`[404] [report] Report Not Found | reportId=${reportId}`);
    return res.status(404).json({
      message: 'Reporte no encontrado',
    });
  } catch (error) {
    Logging.error(`[500] [report] Read Report Failed | reportId=${reportId}`);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

const readAll = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const search = req.query.search ? (req.query.search as string) : '';

    const tipo = req.query.tipo ? (req.query.tipo as string) : 'all';

    const activeOnly = req.query.activeOnly ? (req.query.activeOnly as string) : 'false';

    const startDate = req.query.startDate ? (req.query.startDate as string) : '';

    const endDate = req.query.endDate ? (req.query.endDate as string) : '';

    const estado = req.query.estado ? (req.query.estado as string) : 'all';

    if (page < 1 || limit < 1) {
      Logging.warning(`[400] [report] Invalid Pagination`);
      return res.status(400).json({
        message: 'Valores de paginación inválidos',
      });
    }

    const reports = await ReportService.getAllReports(
      page,
      limit,
      search,
      tipo,
      activeOnly,
      startDate,
      endDate,
      estado,
    );

    Logging.info(`[200] [report] Reports Listed | page=${page} limit=${limit}`);

    return res.status(200).json(reports);
  } catch (error) {
    Logging.error(`[500] [report] Read All Reports Failed`);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

const updateStatus = async (req: AuthRequest, res: Response) => {
  const reportId = req.params.reportId;
  const { estado } = req.body;
  const adminId = req.user?.id;

  if (!isValidObjectId(reportId)) {
    Logging.warning(`[400] [report] Invalid Report ID: ${reportId}`);
    return res.status(400).json({
      message: 'ID de reporte inválido',
    });
  }

  try {
    if (!estado) {
      Logging.warning(`[400] [report] Missing Status`);
      return res.status(400).json({
        message: 'El estado es obligatorio',
      });
    }

    const updatedReport = await ReportService.updateReportStatus(reportId, estado);

    if (updatedReport) {
      Logging.info(`[200] [report] Status Updated | reportId=${reportId} | estado=${estado}`);

      // Log Auditoría
      if (adminId) {
        await AuditService.recordLog({
          admin: new mongoose.Types.ObjectId(adminId) as any,
          accion: AuditService.AdminAction.UPDATE_REPORT_STATUS,
          tipoObjetivo: 'report',
          objetivoId: reportId,
          detalles: `Estado cambiado a: ${estado}`,
          ip: req.ip,
        });
      }

      return res.status(200).json(updatedReport);
    }

    Logging.warning(`[404] [report] Report Not Found | reportId=${reportId}`);
    return res.status(404).json({
      message: 'Reporte no encontrado',
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      Logging.warning(`[422] [report] Validation Error: ${error.message}`);
      return res.status(422).json({
        message: error.message,
      });
    }

    Logging.error(`[500] [report] Update Status Failed | reportId=${reportId}`);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

const deleteReport = async (req: AuthRequest, res: Response) => {
  const reportId = req.params.reportId;
  const adminId = req.user?.id;

  if (!isValidObjectId(reportId)) {
    Logging.warning(`[400] [report] Invalid Report ID: ${reportId}`);
    return res.status(400).json({
      message: 'ID de reporte inválido',
    });
  }

  try {
    const deletedReport = await ReportService.deleteReport(reportId);

    if (deletedReport) {
      Logging.info(`[200] [report] Report Deleted | reportId=${reportId}`);

      // Log Auditoría
      if (adminId) {
        await AuditService.recordLog({
          admin: new mongoose.Types.ObjectId(adminId) as any,
          accion: AuditService.AdminAction.DELETE_REPORT,
          tipoObjetivo: 'report',
          objetivoId: reportId,
          detalles: `Reporte eliminado`,
          ip: req.ip,
        });
      }

      return res.status(200).json({
        message: 'Reporte eliminado con éxito',
      });
    }

    Logging.warning(`[404] [report] Report Not Found | reportId=${reportId}`);
    return res.status(404).json({
      message: 'Reporte no encontrado',
    });
  } catch (error) {
    Logging.error(`[500] [report] Delete Report Failed | reportId=${reportId}`);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

const readByUser = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  const page = req.query.page ? parseInt(req.query.page as string) : 1;

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  if (!isValidObjectId(userId)) {
    Logging.warning(`[400] [report] Invalid User ID: ${userId}`);
    return res.status(400).json({
      message: 'ID de usuario inválido',
    });
  }

  try {
    if (page < 1 || limit < 1) {
      Logging.warning(`[400] [report] Invalid Pagination`);
      return res.status(400).json({
        message: 'Valores de paginación inválidos',
      });
    }

    const reports = await ReportService.getReportsByUser(userId, page, limit);

    Logging.info(`[200] [report] Reports By User | userId=${userId}`);

    return res.status(200).json(reports);
  } catch (error) {
    Logging.error(`[500] [report] Read By User Failed | userId=${userId}`);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export default {
  createReport,
  readReport,
  readAll,
  readByUser,
  updateStatus,
  deleteReport,
};
