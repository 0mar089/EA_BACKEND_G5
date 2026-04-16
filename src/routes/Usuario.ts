import express from 'express';
import controller from '../controllers/usuario';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { authenticateToken, checkRole } from '../middleware/auth';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Usuarios
 *     description: Endpoints CRUD de usuarios
 *
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ObjectId de MongoDB
 *           example: "65f1c2a1b2c3d4e5f6789012"
 *         nombre:
 *           type: string
 *           example: "Judit"
 *         email:
 *           type: string
 *           example: "judit@gmail.com"
 *         rol:
 *           type: string
 *           example: "user"
 *         activo:
 *           type: boolean
 *           example: true
 *           description: Indica si la cuenta está activa (false = soft deleted)
  *         universidad:
 *           type: string
 *           description: ObjectId de la universidad
 *           example: "65f1c2a1b2c3d4e5f6789013"
 *         descripcion:
 *           type: string
 *           example: "Estudiante de Ingeniería y amante del café ☕"
 *     UsuarioCreateUpdate:
 *       type: object
 *       required:
 *         - nombre
 *         - email
 *         - password
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Judit"
 *         email:
 *           type: string
 *           example: "judit@gmail.com"
 *         password:
 *           type: string
 *           example: "password123"
 *         rol:
 *           type: string
 *           example: "user"
 *         avatarUrl:
 *           type: string
 *           example: "https://ejemplo.com/foto.jpg"
 *         descripcion:
 *           type: string
 *           example: "Estudiante de Ingeniería y amante del café ☕"
 *         universidad:
 *           type: string
 *           description: ObjectId de la universidad
 *           example: "65f1c2a1b2c3d4e5f6789013"
 *     UsuarioRegister:
 *       type: object
 *       required:
 *         - nombre
 *         - email
 *         - password
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Judit"
 *         email:
 *           type: string
 *           example: "judit@gmail.com"
 *         password:
 *           type: string
 *           example: "password123"
 *         avatarUrl:
 *           type: string
 *           example: "https://ejemplo.com/foto.jpg"
 *     UsuarioUpdateSelf:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Judit"
 *         email:
 *           type: string
 *           example: "judit@gmail.com"
 *         password:
 *           type: string
 *           example: "password123"
 *         avatarUrl:
 *           type: string
 *           example: "https://ejemplo.com/foto.jpg"
 *         descripcion:
 *           type: string
 *           example: "Estudiante de Ingeniería y amante del café ☕"
 *         universidad:
 *           type: string
 *           description: ObjectId de la universidad
 *           example: "65f1c2a1b2c3d4e5f6789013"
 */

/**
 * @openapi
 * /usuarios:
 *   post:
 *     summary: Crea un usuario (Solo Admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioCreateUpdate'
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
router.post('/', authenticateToken, checkRole(['admin']), ValidateJoi(Schemas.usuario.create), controller.createUsuario);

/**
 * @openapi
 * /usuarios/{usuarioId}:
 *   get:
 *     summary: Obtiene un usuario por ID (Respuesta varía según el rol)
 *     description: |
 *       - **Admin**: Obtiene todos los detalles del usuario.
 *       - **User**: Obtiene solo nombre y universidad.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del usuario
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */
router.get('/:usuarioId', authenticateToken, controller.readUsuario);

/**
 * @openapi
 * /usuarios:
 *   get:
 *     summary: Lista de usuarios (Respuesta varía según el rol)
 *     description: |
 *       - **Admin**: Obtiene todos los usuarios (activos e inactivos) con detalles completos.
 *       - **User**: Obtiene solo nombres y universidad de usuarios activos.
 *     tags: [Usuarios]
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
 * /usuarios/{usuarioId}:
 *   patch:
 *     summary: Actualiza un usuario por ID (Solo Admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioCreateUpdate'
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
router.patch('/:usuarioId', authenticateToken, checkRole(['admin']), ValidateJoi(Schemas.usuario.update), controller.updateUsuario);

/**
 * @openapi
 * /usuarios/{usuarioId}/soft-delete:
 *   patch:
 *     summary: Desactiva un usuario (soft delete) (Solo Admin)
 *     description: Marca la cuenta como inactiva (activo=false) sin eliminar el documento de la BD.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del usuario
 *     responses:
 *       200:
 *         description: Cuenta desactivada correctamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido (No es admin)
 *       404:
 *         description: No encontrado
 */
router.patch('/:usuarioId/soft-delete', authenticateToken, checkRole(['admin']), controller.softDeleteUsuario);

/**
 * @openapi
 * /usuarios/{usuarioId}/recovery:
 *   patch:
 *     summary: Reactiva un usuario (recovery) (Solo Admin)
 *     description: Vuelve a activar la cuenta (activo=true).
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del usuario
 *     responses:
 *       200:
 *         description: Cuenta recuperada correctamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido (No es admin)
 *       404:
 *         description: No encontrado
 */
router.patch('/:usuarioId/recovery', authenticateToken, checkRole(['admin']), controller.recoveryUsuario);

/**
 * @openapi
 * /usuarios/{usuarioId}:
 *   delete:
 *     summary: Elimina un usuario permanentemente (hard delete) (Solo Admin)
 *     description: Elimina el documento del usuario definitivamente de la base de datos.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del usuario
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
router.delete('/:usuarioId', authenticateToken, checkRole(['admin']), controller.hardDeleteUsuario);

/**
 * @openapi
 * /usuarios/follow/{targetId}:
 *   post:
 *     summary: Sigue o deja de seguir a un usuario (Toggle)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/follow/:targetId', authenticateToken, controller.toggleFollow);

/**
 * @openapi
 * /usuarios/followers/{usuarioId}:
 *   get:
 *     summary: Obtiene la lista de seguidores de un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/followers/:usuarioId', authenticateToken, controller.getFollowers);

/**
 * @openapi
 * /usuarios/following/{usuarioId}:
 *   get:
 *     summary: Obtiene la lista de usuarios seguidos por un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/following/:usuarioId', authenticateToken, controller.getFollowing);

/**
 * @openapi
 * /usuarios/{usuarioId}/followers/{followerId}:
 *   delete:
 *     summary: Elimina a un seguidor (Solo Admin o el usuario dueño del perfil)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *       - in: path
 *         name: followerId
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 */
router.delete('/:usuarioId/followers/:followerId', authenticateToken, controller.removeFollower);

/**
 * @openapi
 * /usuarios/{usuarioId}/following/{targetId}:
 *   delete:
 *     summary: Deja de seguir a un usuario (Solo Admin o el usuario dueño)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *       - in: path
 *         name: targetId
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 */
router.delete('/:usuarioId/following/:targetId', authenticateToken, controller.unfollowUser);

export default router;
