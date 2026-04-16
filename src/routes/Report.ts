import express from 'express';
import controller from '../controllers/report';
import { authenticateToken, checkRole } from '../middleware/auth';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Reportes
 *     description: Endpoints para gestionar reportes de contenido
 */

// Cualquier usuario autenticado puede crear un reporte
router.post('/', authenticateToken, controller.createReport);

// Solo administradores pueden gestionar reportes
router.get('/', authenticateToken, checkRole(['admin']), controller.readAll);
router.get('/:reportId', authenticateToken, checkRole(['admin']), controller.readReport);
router.patch('/:reportId/status', authenticateToken, checkRole(['admin']), controller.updateStatus);
router.delete('/:reportId', authenticateToken, checkRole(['admin']), controller.deleteReport);

export default router;
