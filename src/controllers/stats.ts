import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import StatsService from '../services/stats';

const readGlobalStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // En lugar de esperar al fallo, comprobamos el estado de Mongoose (1 = Connected)
        const isDbConnected = mongoose.connection.readyState === 1;
        
        if (!isDbConnected) {
            // Devolvemos los datos vacíos pero con un flag de error de DB
            return res.status(200).json({ 
                users: 0, 
                universities: 0, 
                posts: 0, 
                comments: 0,
                reports: 0,
                dbStatus: 'offline' 
            });
        }

        const stats = await StatsService.getGlobalStats();
        return res.status(200).json({ ...stats, dbStatus: 'online' });
    } catch (error) {
        return res.status(500).json({ error, dbStatus: 'offline' });
    }
};

const readUserCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const count = await StatsService.getUserCount();
        return res.status(200).json({ count });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readUniversityCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const count = await StatsService.getUniversityCount();
        return res.status(200).json({ count });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readPostCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const count = await StatsService.getPostCount();
        return res.status(200).json({ count });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readCommentCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const count = await StatsService.getCommentCount();
        return res.status(200).json({ count });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readReportStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await StatsService.getReportStats();
        return res.status(200).json(stats);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

export default {
    readGlobalStats,
    readUserCount,
    readUniversityCount,
    readPostCount,
    readCommentCount,
    readReportStats
};
