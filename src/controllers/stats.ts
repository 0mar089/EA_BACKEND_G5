import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import StatsService from '../services/stats';
import Logging from '../library/Logging';

const readGlobalStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isDbConnected = mongoose.connection.readyState === 1;
        
        if (!isDbConnected) {
            Logging.warning(`[503] [stats] DB Offline - Global Stats Request`);
            return res.status(503).json({ 
                users: 0, 
                universities: 0, 
                posts: 0, 
                comments: 0,
                reports: 0,
                dbStatus: 'offline',
                message: 'Database unavailable'
            });
        }

        const stats = await StatsService.getGlobalStats();

        Logging.info(`[200] [stats] Global Stats Retrieved`);

        return res.status(200).json({ 
            ...stats,
            dbStatus: 'online'
        });

    } catch (error) {
        Logging.error(`[500] [stats] Failed to read global stats`);
        return res.status(500).json({
            message: 'Internal server error',
            dbStatus: 'offline'
        });
    }
};

const readUserCount = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const isDbConnected = mongoose.connection.readyState === 1;

        if (!isDbConnected) {
            Logging.warning(`[503] [stats] DB Offline - User Count`);
            return res.status(503).json({
                message: 'Database unavailable',
                dbStatus: 'offline'
            });
        }

        const counts = await StatsService.getUserCount();

        Logging.info(`[200] [stats] User Count Retrieved`);

        return res.status(200).json(counts);

    } catch (error) {
        Logging.error(`[500] [stats] Failed to read user count`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const readUniversityCount = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const isDbConnected = mongoose.connection.readyState === 1;

        if (!isDbConnected) {
            Logging.warning(`[503] [stats] DB Offline - University Count`);
            return res.status(503).json({
                message: 'Database unavailable',
                dbStatus: 'offline'
            });
        }

        const count = await StatsService.getUniversityCount();

        Logging.info(`[200] [stats] University Count Retrieved`);

        return res.status(200).json({ count });

    } catch (error) {
        Logging.error(`[500] [stats] Failed to read university count`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const readPostCount = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const isDbConnected = mongoose.connection.readyState === 1;

        if (!isDbConnected) {
            Logging.warning(`[503] [stats] DB Offline - Post Count`);
            return res.status(503).json({
                message: 'Database unavailable',
                dbStatus: 'offline'
            });
        }

        const count = await StatsService.getPostCount();

        Logging.info(`[200] [stats] Post Count Retrieved`);

        return res.status(200).json({ count });

    } catch (error) {
        Logging.error(`[500] [stats] Failed to read post count`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const readCommentCount = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const isDbConnected = mongoose.connection.readyState === 1;

        if (!isDbConnected) {
            Logging.warning(`[503] [stats] DB Offline - Comment Count`);
            return res.status(503).json({
                message: 'Database unavailable',
                dbStatus: 'offline'
            });
        }

        const count = await StatsService.getCommentCount();

        Logging.info(`[200] [stats] Comment Count Retrieved`);

        return res.status(200).json({ count });

    } catch (error) {
        Logging.error(`[500] [stats] Failed to read comment count`);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const readReportStats = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const isDbConnected = mongoose.connection.readyState === 1;

        if (!isDbConnected) {
            Logging.warning(`[503] [stats] DB Offline - Report Stats`);
            return res.status(503).json({
                message: 'Database unavailable',
                dbStatus: 'offline'
            });
        }

        const stats = await StatsService.getReportStats();

        Logging.info(`[200] [stats] Report Stats Retrieved`);

        return res.status(200).json(stats);

    } catch (error) {
        Logging.error(`[500] [stats] Failed to read report stats`);
        return res.status(500).json({
            message: 'Internal server error'
        });
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