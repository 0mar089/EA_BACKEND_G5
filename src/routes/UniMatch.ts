import express from 'express';
import upload from '../middleware/multer';
import controller from '../controllers/unimatch';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @openapi
 * /unimatch/discover:
 *   get:
 *     summary: Descubrir perfiles para UniMatch
 *     tags: [UniMatch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de perfiles
 */
router.get('/discover', authenticateToken, controller.discover);

/**
 * @openapi
 * /unimatch/swipe:
 *   post:
 *     summary: Registrar un swipe (like o dislike)
 *     tags: [UniMatch]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [toUserId, type]
 *             properties:
 *               toUserId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [like, dislike]
 *     responses:
 *       200:
 *         description: Swipe registrado
 */
router.post('/swipe', authenticateToken, controller.swipe);

/**
 * @openapi
 * /unimatch/photos:
 *   post:
 *     summary: Subir una foto de UniMatch
 *     tags: [UniMatch]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Foto subida
 */
router.post('/photos', authenticateToken, upload.single('image'), controller.uploadPhoto);

/**
 * @openapi
 * /unimatch/photos:
 *   get:
 *     summary: Obtener mis fotos de UniMatch
 *     tags: [UniMatch]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de fotos
 */
router.get('/photos', authenticateToken, controller.getMyPhotos);

/**
 * @openapi
 * /unimatch/photos/{userId}:
 *   get:
 *     summary: Obtener fotos de UniMatch de un usuario
 *     tags: [UniMatch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de fotos
 */
router.get('/photos/:userId', authenticateToken, controller.getUserPhotos);

/**
 * @openapi
 * /unimatch/photos/{photoId}:
 *   delete:
 *     summary: Eliminar una foto de UniMatch
 *     tags: [UniMatch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Foto eliminada
 */
router.delete('/photos/:photoId', authenticateToken, controller.deletePhoto);

/**
 * @openapi
 * /unimatch/photos/reorder:
 *   patch:
 *     summary: Reordenar fotos de UniMatch
 *     tags: [UniMatch]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               photoIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Fotos reordenadas
 */
router.patch('/photos/reorder', authenticateToken, controller.reorderPhotos);

/**
 * @openapi
 * /unimatch/accept-terms:
 *   post:
 *     summary: Aceptar los términos de UniMatch
 *     tags: [UniMatch]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Términos aceptados
 */
router.post('/accept-terms', authenticateToken, controller.acceptTerms);

/**
 * @openapi
 * /unimatch/matches:
 *   get:
 *     summary: Obtener lista de matches
 *     tags: [UniMatch]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de matches
 */
router.get('/matches', authenticateToken, controller.getMatches);

export default router;
