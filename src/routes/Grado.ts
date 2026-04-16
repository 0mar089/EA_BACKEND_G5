import express from 'express';
import controller from '../controllers/grado';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { authenticateToken, checkRole } from '../middleware/auth';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Grados
 *     description: Endpoints CRUD de grados universitarios
 *
 * components:
 *   schemas:
 *     Grado:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Ingeniería Informática"
 *         asignaturas:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Cálculo", "Física", "Programación"]
 *         universidad:
 *           type: string
 *           description: ObjectId de la universidad
 *           example: "65f1c2a1b2c3d4e5f6789014"
 */

/**
 * @openapi
 * /grados:
 *   post:
 *     summary: Crea un grado (Solo Admin)
 *     tags: [Grados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Grado'
 *     responses:
 *       201:
 *         description: Creado
 */
router.post('/', authenticateToken, checkRole(['admin']), ValidateJoi(Schemas.grado.create), controller.createGrado);

/**
 * @openapi
 * /grados/universidad/{universidadId}:
 *   get:
 *     summary: Obtiene todos los grados de una universidad (Público)
 *     tags: [Grados]
 *     parameters:
 *       - in: path
 *         name: universidadId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/universidad/:universidadId', controller.readGradosByUniversidad);

/**
 * @openapi
 * /grados/{gradoId}:
 *   get:
 *     summary: Obtiene un grado por ID (Público)
 *     tags: [Grados]
 *     parameters:
 *       - in: path
 *         name: gradoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/:gradoId', controller.readGrado);

/**
 * @openapi
 * /grados/{gradoId}:
 *   patch:
 *     summary: Actualiza un grado (Solo Admin)
 *     tags: [Grados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gradoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Grado'
 *     responses:
 *       200:
 *         description: Actualizado
 */
router.patch('/:gradoId', authenticateToken, checkRole(['admin']), ValidateJoi(Schemas.grado.update), controller.updateGrado);

/**
 * @openapi
 * /grados/{gradoId}:
 *   delete:
 *     summary: Elimina un grado (Solo Admin)
 *     tags: [Grados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gradoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Eliminado
 */
router.delete('/:gradoId', authenticateToken, checkRole(['admin']), controller.deleteGrado);

export default router;
