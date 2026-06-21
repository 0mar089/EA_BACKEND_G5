import express from 'express';
import controller from '../controllers/evento';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Eventos
 *     description: Endpoints para gestionar eventos y el mapa interactivo
 */

/**
 * @openapi
 * /eventos:
 *   post:
 *     summary: Crear un nuevo evento
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - descripcion
 *               - fecha
 *               - ubicacionNombre
 *               - lat
 *               - lng
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: "Estudiar Examen EA"
 *               descripcion:
 *                 type: string
 *                 example: "Quedamos en la biblioteca del Campus Nord"
 *               fecha:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-05T15:00:00Z"
 *               ubicacionNombre:
 *                 type: string
 *                 example: "Biblioteca Rector Gabriel Ferraté"
 *               lat:
 *                 type: number
 *                 example: 41.3892
 *               lng:
 *                 type: number
 *                 example: 2.1130
 *               maxAsistentes:
 *                 type: integer
 *                 example: 6
 *     responses:
 *       201:
 *         description: Evento creado exitosamente
 *       401:
 *         description: No autorizado
 *       422:
 *         description: Error de validación (Joi)
 */
router.post('/', authenticateToken, ValidateJoi(Schemas.evento.create), controller.createEvento);

/**
 * @openapi
 * /eventos:
 *   get:
 *     summary: Obtener todos los eventos activos (opcionalmente ordenados por cercanía)
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitud del usuario para búsqueda de proximidad
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Longitud del usuario para búsqueda de proximidad
 *       - in: query
 *         name: distancia
 *         schema:
 *           type: number
 *         description: Distancia máxima en metros (por defecto 50000)
 *     responses:
 *       200:
 *         description: Lista de eventos
 *       401:
 *         description: No autorizado
 */
router.get('/', authenticateToken, controller.getAllEventos);

/**
 * @openapi
 * /eventos/{eventoId}:
 *   get:
 *     summary: Obtener un evento por ID
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Evento encontrado
 *       404:
 *         description: Evento no encontrado
 */
router.get('/:eventoId', authenticateToken, controller.getEvento);

/**
 * @openapi
 * /eventos/{eventoId}/asistir:
 *   post:
 *     summary: Unirse o abandonar un evento (Toggle)
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Evento actualizado con el nuevo asistente
 *       400:
 *         description: Límite de asistentes superado
 *       404:
 *         description: Evento no encontrado
 */
router.post('/:eventoId/asistir', authenticateToken, controller.asistirEvento);

/**
 * @openapi
 * /eventos/{eventoId}:
 *   delete:
 *     summary: Eliminar un evento (Solo el creador o un admin)
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Evento eliminado exitosamente
 *       403:
 *         description: No tienes permiso para eliminar este evento
 *       404:
 *         description: Evento no encontrado
 */
router.delete('/:eventoId', authenticateToken, controller.deleteEvento);

export default router;
