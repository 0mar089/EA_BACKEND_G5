import express from 'express';
import controller from '../controllers/universidad';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { authenticateToken, checkRole } from '../middleware/auth';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Universidades
 *     description: Endpoints CRUD de universidades
 *
 * components:
 *   schemas:
 *     Universidad:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ObjectId de MongoDB
 *           example: "65f1c2a1b2c3d4e5f6789014"
 *         nombre:
 *           type: string
 *           example: "UPC"
 *         ubicacion:
 *           type: string
 *           example: "Barcelona"
 *         usuarios:
 *           type: array
 *           items:
 *             type: string
 *           example: ["65f1c2a1b2c3d4e5f6789012"]
 *     UniversidadCreateUpdate:
 *       type: object
 *       required:
 *         - nombre
 *         - ubicacion
 *       properties:
 *         nombre:
 *           type: string
 *           example: "UPC"
 *         ubicacion:
 *           type: string
 *           example: "Barcelona"
 */

/**
 * @openapi
 * /universidades:
 *   post:
 *     summary: Crea una universidad (Solo Admin)
 *     tags: [Universidades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UniversidadCreateUpdate'
 *     responses:
 *       201:
 *         description: Creado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido (No es admin)
 *       422:
 *         description: Validación fallida (Joi)
 */
router.post('/', authenticateToken, checkRole(['admin']), ValidateJoi(Schemas.universidad.create), controller.createUniversidad);

/**
 * @openapi
 * /universidades/{universidadId}:
 *   get:
 *     summary: Obtiene una universidad por ID (Cualquier Usuario Autenticado)
 *     tags: [Universidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: universidadId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la universidad
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */
router.get('/:universidadId', authenticateToken, controller.readUniversidad);

/**
 * @openapi
 * /universidades:
 *   get:
 *     summary: Lista todas las universidades con nombre y número de integrantes (Cualquier Usuario Autenticado)
 *     tags: [Universidades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: No autorizado
 */
router.get('/', authenticateToken, controller.readAll);

/**
 * @openapi
 * /universidades/{universidadId}:
 *   patch:
 *     summary: Actualiza una universidad por ID (Solo Admin)
 *     tags: [Universidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: universidadId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la universidad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UniversidadCreateUpdate'
 *     responses:
 *       201:
 *         description: Actualizado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido (No es admin)
 *       404:
 *         description: No encontrado
 *       422:
 *         description: Validación fallida (Joi)
 */
router.patch('/:universidadId', authenticateToken, checkRole(['admin']), ValidateJoi(Schemas.universidad.update), controller.updateUniversidad);

/**
 * @openapi
 * /universidades/{universidadId}:
 *   delete:
 *     summary: Elimina una universidad por ID (Solo Admin)
 *     tags: [Universidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: universidadId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la universidad
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido (No es admin)
 *       404:
 *         description: No encontrado
 */
router.delete('/:universidadId', authenticateToken, checkRole(['admin']), controller.deleteUniversidad);

export default router;
