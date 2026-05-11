import express from 'express';
import controller from '../controllers/bugReport';
import { authenticateToken, checkRole } from '../middleware/auth';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Bug Reports
 *     description: Endpoints para gestionar reportes de bugs técnicos
 */

/**
 * @openapi
 * /bugs:
 *   post:
 *     tags: [Bug Reports]
 *     summary: Crear un nuevo reporte de bug
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, descripcion]
 *             properties:
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               comoReplicarlo:
 *                 type: string
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Bug reportado con éxito
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error de servidor
 */
router.post('/', authenticateToken, controller.createBugReport);

/**
 * @openapi
 * /bugs:
 *   get:
 *     tags: [Bug Reports]
 *     summary: Obtener todos los reportes de bugs (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de bugs
 */
router.get('/', authenticateToken, checkRole(['admin']), controller.getAllBugReports);

router.get('/:bugId', authenticateToken, checkRole(['admin']), controller.getBugReport);
router.patch('/:bugId/status', authenticateToken, checkRole(['admin']), controller.updateStatus);
router.delete('/:bugId', authenticateToken, checkRole(['admin']), controller.deleteBugReport);

export default router;
