import { Request, Response, NextFunction } from 'express';
import StatsService from '../services/stats';

const readGlobalStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await StatsService.getGlobalStats();
        return res.status(200).json(stats);
    } catch (error) {
        return res.status(500).json({ error });
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

export default {
    readGlobalStats,
    readUserCount,
    readUniversityCount,
    readPostCount,
    readCommentCount
};
