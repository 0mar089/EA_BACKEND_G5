import express from 'express';
import controller from '../controllers/asignatura';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { authenticateToken, checkRole } from '../middleware/auth';
import asignatura from '../services/asignatura';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Asignaturas
 *     description: Endpoints CRUD de asignaturas
 *
 * components:
 *   schemas:
 *     Asignatura:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Programación"
 */

/**
 * @openapi
 * /asignaturas:
 *   post:
 *     summary: Crea una asignatura (Solo Admin)
 *     tags: [Asignaturas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Asignatura'
 *     responses:
 *       201:
 *         description: Creada
 */
router.post(
    '/',
    authenticateToken,
    checkRole(['admin']),
    ValidateJoi(Schemas.asignatura.create),
    controller.createAsignatura
);

/**
 * @openapi
 * /asignaturas:
 *   get:
 *     summary: Obtiene todas las asignaturas (Público)
 *     tags: [Asignaturas]
 *     responses:
 *       200:
 *         description: Lista de asignaturas
 */
router.get('/', controller.readAllAsignaturas);

/**
 * @openapi
 * /asignaturas/{asignaturaId}:
 *   get:
 *     summary: Obtiene una asignatura por ID (Público)
 *     tags: [Asignaturas]
 *     parameters:
 *       - in: path
 *         name: asignaturaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/:asignaturaId', controller.readAsignatura);

/**
 * @openapi
 * /asignaturas/{asignaturaId}:
 *   patch:
 *     summary: Actualiza una asignatura (Solo Admin)
 *     tags: [Asignaturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: asignaturaId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Asignatura'
 *     responses:
 *       200:
 *         description: Actualizada
 */
router.patch(
    '/:asignaturaId',
    authenticateToken,
    checkRole(['admin']),
    ValidateJoi(Schemas.asignatura.update),
    controller.updateAsignatura
);

/**
 * @openapi
 * /asignaturas/{asignaturaId}:
 *   delete:
 *     summary: Elimina una asignatura (Solo Admin)
 *     tags: [Asignaturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: asignaturaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Eliminada
 */
router.delete(
    '/:asignaturaId',
    authenticateToken,
    checkRole(['admin']),
    controller.deleteAsignatura
);

export default router;