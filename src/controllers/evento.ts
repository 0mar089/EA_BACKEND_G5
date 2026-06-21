import { NextFunction, Response } from 'express';
import mongoose from 'mongoose';
import EventoService from '../services/evento';
import AuditService from '../services/audit';
import Logging from '../library/Logging';
import { AuthRequest } from '../middleware/auth';

const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

const createEvento = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            Logging.warning(`[401] [evento] Unauthorized Create`);
            return res.status(401).json({ message: 'No autenticado' });
        }

        const savedEvento = await EventoService.createEvento(req.body, req.user.id);
        Logging.info(`[201] [evento] Created | eventoId=${savedEvento?._id} userId=${req.user.id}`);
        return res.status(201).json(savedEvento);
    } catch (error: unknown) {
        Logging.error(`[500] [evento] Create Failed: ${(error as Error).message}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const getEvento = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const eventoId = req.params.eventoId;

    if (!isValidObjectId(eventoId)) {
        Logging.warning(`[400] [evento] Invalid ID | eventoId=${eventoId}`);
        return res.status(400).json({ message: 'ID de evento inválido' });
    }

    try {
        const evento = await EventoService.getEvento(eventoId);
        if (!evento) {
            Logging.warning(`[404] [evento] Not Found | eventoId=${eventoId}`);
            return res.status(404).json({ message: 'Evento no encontrado' });
        }

        Logging.info(`[200] [evento] Retrieved | eventoId=${eventoId}`);
        return res.status(200).json(evento);
    } catch (error: unknown) {
        Logging.error(`[500] [evento] Get Failed | eventoId=${eventoId}: ${(error as Error).message}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const getAllEventos = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
        const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
        const distancia = req.query.distancia ? parseFloat(req.query.distancia as string) : undefined;

        const eventos = await EventoService.getAllEventos(lat, lng, distancia);
        Logging.info(`[200] [evento] List All | count=${eventos.length}`);
        return res.status(200).json(eventos);
    } catch (error: unknown) {
        Logging.error(`[500] [evento] List Failed: ${(error as Error).message}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const asistirEvento = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const eventoId = req.params.eventoId;

    if (!req.user) {
        Logging.warning(`[401] [evento] Unauthorized Attend`);
        return res.status(401).json({ message: 'No autenticado' });
    }

    if (!isValidObjectId(eventoId)) {
        Logging.warning(`[400] [evento] Invalid ID | eventoId=${eventoId}`);
        return res.status(400).json({ message: 'ID de evento inválido' });
    }

    try {
        const eventoActualizado = await EventoService.asistirEvento(eventoId, req.user.id);
        if (!eventoActualizado) {
            Logging.warning(`[404] [evento] Attend Not Found | eventoId=${eventoId}`);
            return res.status(404).json({ message: 'Evento no encontrado' });
        }

        Logging.info(`[200] [evento] Attend Toggled | eventoId=${eventoId} userId=${req.user.id}`);
        return res.status(200).json(eventoActualizado);
    } catch (error: unknown) {
        if ((error as Error).message === 'El evento ha alcanzado el límite máximo de asistentes') {
            Logging.warning(`[400] [evento] Attend Limit Reached | eventoId=${eventoId}`);
            return res.status(400).json({ message: (error as Error).message });
        }
        Logging.error(`[500] [evento] Attend Failed | eventoId=${eventoId}: ${(error as Error).message}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteEvento = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const eventoId = req.params.eventoId;

    if (!req.user) {
        Logging.warning(`[401] [evento] Unauthorized Delete`);
        return res.status(401).json({ message: 'No autenticado' });
    }

    if (!isValidObjectId(eventoId)) {
        Logging.warning(`[400] [evento] Invalid ID | eventoId=${eventoId}`);
        return res.status(400).json({ message: 'ID de evento inválido' });
    }

    try {
        const eventoEliminado = await EventoService.deleteEvento(eventoId, req.user.id, req.user.rol);
        if (!eventoEliminado) {
            Logging.warning(`[404] [evento] Delete Not Found | eventoId=${eventoId}`);
            return res.status(404).json({ message: 'Evento no encontrado' });
        }

        Logging.info(`[200] [evento] Deleted | eventoId=${eventoId}`);

        if (req.user.rol === 'admin') {
            await AuditService.recordLog({
                admin: new mongoose.Types.ObjectId(req.user.id),
                accion: AuditService.AdminAction.DELETE_EVENT,
                tipoObjetivo: 'event',
                objetivoId: eventoId,
                detalles: `Evento eliminado por moderación (Admin)`,
                ip: req.ip
            });
        }

        return res.status(200).json(eventoEliminado);
    } catch (error: unknown) {
        if ((error as Error).message === 'Forbidden') {
            Logging.warning(`[403] [evento] Forbidden Delete | eventoId=${eventoId} userId=${req.user.id}`);
            return res.status(403).json({ message: 'No tienes permiso para eliminar este evento' });
        }
        Logging.error(`[500] [evento] Delete Failed | eventoId=${eventoId}: ${(error as Error).message}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export default {
    createEvento,
    getEvento,
    getAllEventos,
    asistirEvento,
    deleteEvento
};
