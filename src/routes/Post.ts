import express from 'express';
import controller from '../controllers/post';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { authenticateToken, checkRole } from '../middleware/auth';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Posts
 *     description: Endpoints CRUD de posts
 *
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789013"
 *         usuario:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789012"
 *         imageUrl:
 *           type: string
 *           example: "https://images.pexels.com/photos/14424025/pexels-photo-14424025.jpeg"
 *         caption:
 *           type: string
 *           example: "Mi primer post"
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - "65f1c2a1b2c3d4e5f6789013"
 *             - "65f1c2a1b2c3d4e5f6789014"
 *         comments:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - "65f1c2a1b2c3d4e5f6789015"
 *
 *     PostCreateUpdate:
 *       type: object
 *       properties:
 *         usuario:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789012"
 *           description: Opcional. Solo procesado si el que llama es Admin.
 *         imageUrl:
 *           type: string
 *           example: "https://images.pexels.com/photos/14424025/pexels-photo-14424025.jpeg"
 *         caption:
 *           type: string
 *           example: "Mi primer post"
 */

/**
 * @openapi
 * /posts:
 *   post:
 *     summary: Crear un post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostCreateUpdate'
 *     responses:
 *       201:
 *         description: Post creado
 *       401:
 *         description: No autorizado
 *       422:
 *         description: Error de validación
 */
router.post(
    '/',
    authenticateToken,
    ValidateJoi(Schemas.post.create),
    controller.createPost
);

/**
 * @openapi
 * /posts:
 *   get:
 *     summary: Obtener todos los posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       401:
 *         description: No autorizado
 */
router.get('/', authenticateToken, controller.getAllPosts);

/**
 * @openapi
 * /posts/user/{userId}:
 *   get:
 *     summary: Obtener todos los posts de un usuario
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del usuario
 *     responses:
 *       200:
 *         description: Lista de posts del usuario
 *       401:
 *         description: No autorizado
 */
router.get(
    '/user/:userId',
    authenticateToken,
    controller.getAllPostsFromUser
);

/**
 * @openapi
 * /posts/{postId}:
 *   get:
 *     summary: Obtener un post por ID
 *     tags: [Posts]
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
 *         description: Post encontrado
 *       404:
 *         description: No encontrado
 */
router.get('/:postId', authenticateToken, controller.getPost);

/**
 * @openapi
 * /posts/{postId}:
 *   patch:
 *     summary: Actualizar un post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostCreateUpdate'
 *     responses:
 *       200:
 *         description: Post actualizado
 *       401:
 *         description: No autorizado
 *       422:
 *         description: Error de validación
 */
router.patch(
    '/:postId',
    authenticateToken,
    ValidateJoi(Schemas.post.update),
    controller.updatePost
);

/**
 * @openapi
 * /posts/{postId}:
 *   delete:
 *     summary: Eliminar un post (Solo Admin)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post eliminado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.delete(
    '/:postId',
    authenticateToken,
    controller.deletePost
);
/**
 * @openapi
 * /posts/{postId}/like:
 *   patch:
 *     summary: Dar o quitar like a un post (toggle)
 *     tags: [Posts]
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
 *         description: Post actualizado con like/unlike
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Post no encontrado
 */
router.patch(
    '/:postId/like',
    authenticateToken,
    controller.darleLike
);

export default router;