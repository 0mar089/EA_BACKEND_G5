import express from 'express';
import { login, register, logout, refreshToken, getMe, updateMe, softDeleteMe } from '../controllers/auth';
import Joi from 'joi';
import { ValidateJoi, Schemas } from '../middleware/Joi';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Schema de validación para login (ahora en Schemas.auth.login)

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Endpoints de autenticación
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Registra un nuevo usuario y devuelve el JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioRegister'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       422:
 *         description: Error de validación (Joi)
 */
router.post('/register', ValidateJoi(Schemas.usuario.register), register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Inicia sesión y devuelve el JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "g5@gmail.com"
 *               password:
 *                 type: string
 *                 example: "secret123"
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve token
 *       401:
 *         description: Credenciales incorrectas
 */
router.post('/login', ValidateJoi(Schemas.auth.login), login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresca el token JWT
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refrescado correctamente
 *       401:
 *         description: No autorizado (token faltante o inválido)
 */
router.post('/refresh', refreshToken);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Cierra sesión y elimina la cookie del refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout exitoso
 */
router.post('/logout', logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario obtenido con éxito
 *       401:
 *         description: No autorizado
 */
router.get('/me', authenticateToken, getMe);

/**
 * @openapi
 * /auth/me:
 *   patch:
 *     summary: Actualiza el perfil del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioUpdateSelf'
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente
 *       401:
 *         description: No autorizado
 */
router.patch('/me', authenticateToken, ValidateJoi(Schemas.usuario.updateSelf), updateMe);

/**
 * @openapi
 * /auth/me/soft-delete:
 *   patch:
 *     summary: Desactiva la cuenta del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cuenta desactivada y sesión cerrada
 *       401:
 *         description: No autorizado
 */
router.patch('/me/soft-delete', authenticateToken, softDeleteMe);

export default router;
