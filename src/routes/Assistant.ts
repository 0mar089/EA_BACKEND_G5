import { Router } from 'express';
import controller from '../controllers/assistant';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /assistant/chat:
 *   post:
 *     summary: Enviar una pregunta al asistente virtual "Toni"
 *     tags: [Assistant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pregunta]
 *             properties:
 *               pregunta:
 *                 type: string
 *                 example: "¿Cuáles son las asignaturas del Grado en Ingeniería de Satélites?"
 *     responses:
 *       200:
 *         description: Respuesta generada por Toni
 *       400:
 *         description: Falta la pregunta
 *       500:
 *         description: Error de servidor o del LLM
 */
router.post('/chat', authenticateToken, controller.ask);

export default router;
