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

/**
 * @openapi
 * /reports:
 *   post:
 *     tags: [Reportes]
 *     summary: Crear un nuevo reporte
 *     description: Cualquier usuario autenticado puede reportar un post, comentario o usuario.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo, objetivoId, descripcion]
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [user, post, comment]
 *               objetivoId:
 *                 type: string
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reporte creado con éxito
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.post('/', authenticateToken, controller.createReport);

/**
 * @openapi
 * /reports:
 *   get:
 *     tags: [Reportes]
 *     summary: Obtener todos los reportes (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reportes
 */
router.get('/', authenticateToken, checkRole(['admin']), controller.readAll);

router.get('/user/:userId', authenticateToken, checkRole(['admin']), controller.readByUser);
router.get('/:reportId', authenticateToken, checkRole(['admin']), controller.readReport);
router.patch('/:reportId/status', authenticateToken, checkRole(['admin']), controller.updateStatus);
router.delete('/:reportId', authenticateToken, checkRole(['admin']), controller.deleteReport);

export default router;
