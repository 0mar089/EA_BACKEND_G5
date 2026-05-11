import express from 'express';
import controller from '../controllers/audit';
import { authenticateToken, checkRole } from '../middleware/auth';

const router = express.Router();

/**
 * @openapi
 * /audit/logs:
 *   get:
 *     summary: Obtener logs de auditoría (Solo Admin)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 */
router.get('/logs', authenticateToken, checkRole(['admin']), controller.getAllLogs);

export default router;
