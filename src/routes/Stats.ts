import express from 'express';
import controller from '../controllers/stats';
import { authenticateToken, checkRole } from '../middleware/auth';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Stats
 *     description: Endpoints para obtención de estadísticas (Solo Admin)
 */

// Todas las rutas requieren token y rol de admin
router.use(authenticateToken, checkRole(['admin']));

/**
 * @openapi
 * /stats/all:
 *   get:
 *     summary: Obtiene todas las estadísticas globales (Solo Admin)
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/all', controller.readGlobalStats);

/**
 * @openapi
 * /stats/users:
 *   get:
 *     summary: Conteo de usuarios (Solo Admin)
 *     tags: [Stats]
 */
router.get('/users', controller.readUserCount);

/**
 * @openapi
 * /stats/universities:
 *   get:
 *     summary: Conteo de universidades (Solo Admin)
 *     tags: [Stats]
 */
router.get('/universities', controller.readUniversityCount);

/**
 * @openapi
 * /stats/posts:
 *   get:
 *     summary: Conteo de posts (Solo Admin)
 *     tags: [Stats]
 */
router.get('/posts', controller.readPostCount);

router.get('/comments', controller.readCommentCount);

/**
 * @openapi
 * /stats/reports:
 *   get:
 *     summary: Conteo de reportes (Solo Admin)
 *     tags: [Stats]
 */
router.get('/reports', controller.readReportStats);

export default router;
