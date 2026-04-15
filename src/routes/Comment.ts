import express from 'express';
import controller from '../controllers/comment';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { authenticateToken, checkRole } from '../middleware/auth';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Comments
 *     description: Endpoints CRUD de comentarios
 *
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789015"
 *         usuario:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789012"
 *         post:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789013"
 *         texto:
 *           type: string
 *           example: "Buen post!"
 *
 *     CommentCreateUpdate:
 *       type: object
 *       required:
 *         - post
 *         - texto
 *       properties:
 *         usuario:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789012"
 *           description: Opcional. Solo procesado si el que llama es Admin.
 *         post:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789013"
 *         texto:
 *           type: string
 *           example: "Buen post!"
 */

/**
 * @openapi
 * /comments:
 *   post:
 *     summary: Crear un comentario
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentCreateUpdate'
 *     responses:
 *       201:
 *         description: Comentario creado
 *       401:
 *         description: No autorizado
 *       422:
 *         description: Error de validación
 */
router.post(
    '/',
    authenticateToken,
    ValidateJoi(Schemas.comment.create),
    controller.createComment
);

/**
 * @openapi
 * /comments:
 *   get:
 *     summary: Obtener todos los comentarios
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de comentarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       401:
 *         description: No autorizado
 */
router.get('/', authenticateToken, controller.getAllComments);

/**
 * @openapi
 * /comments/post/{postId}:
 *   get:
 *     summary: Obtener comentarios de un post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del post
 *     responses:
 *       200:
 *         description: Lista de comentarios del post
 *       401:
 *         description: No autorizado
 */
router.get(
    '/post/:postId',
    authenticateToken,
    controller.getAllCommentsFromPost
);

/**
 * @openapi
 * /comments/{commentId}:
 *   get:
 *     summary: Obtener un comentario por ID
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del comentario
 *     responses:
 *       200:
 *         description: Comentario encontrado
 *       404:
 *         description: No encontrado
 */
router.get('/:commentId', authenticateToken, controller.getComment);

/**
 * @openapi
 * /comments/{commentId}:
 *   patch:
 *     summary: Actualizar un comentario
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentCreateUpdate'
 *     responses:
 *       200:
 *         description: Comentario actualizado
 *       401:
 *         description: No autorizado
 *       422:
 *         description: Error de validación
 */
router.patch(
    '/:commentId',
    authenticateToken,
    ValidateJoi(Schemas.comment.update),
    controller.updateComment
);

/**
 * @openapi
 * /comments/{commentId}:
 *   delete:
 *     summary: Eliminar comentario (Solo Admin)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comentario eliminado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.delete(
    '/:commentId',
    authenticateToken,
    checkRole(['admin']),
    controller.deleteComment
);

export default router;