import express from 'express';
import upload from '../middleware/multer';
import controller from '../controllers/upload';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @openapi
 * /upload:
 *   post:
 *     summary: Subir una imagen a Cloudinary
 *     tags: [Upload]
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
 *       200:
 *         description: Imagen subida con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *       500:
 *         description: Error en la subida
 */
router.post('/', authenticateToken, upload.single('image'), controller.uploadImage);

export default router;
