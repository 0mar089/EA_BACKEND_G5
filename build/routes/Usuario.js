"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Usuario_1 = __importDefault(require("../controllers/Usuario"));
const Joi_1 = require("../middleware/Joi");
const router = express_1.default.Router();
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
 *         name:
 *           type: string
 *           example: "Judit"
 *         email:
 *           type: string
 *           example: "judit@gmail.com"
 *         password:
 *           type: string
 *           example: "password123"
 *         organizacion:
 *           type: string
 *           description: ObjectId de la organización
 *           example: "65f1c2a1b2c3d4e5f6789013"
 *     UsuarioCreateUpdate:
 *       type: object
 *       required:
 *         - name
 *         - organizacion
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           example: "Judit"
 *         email:
 *           type: string
 *           example: "judit@gmail.com"
 *         password:
 *           type: string
 *           example: "password123"
 *         organizacion:
 *           type: string
 *           description: ObjectId de la organización (24 hex)
 *           example: "65f1c2a1b2c3d4e5f6789013"
 */
/**
 * @openapi
 * /usuarios:
 *   post:
 *     summary: Crea un usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioCreateUpdate'
 *     responses:
 *       201:
 *         description: Creado
 *       422:
 *         description: Validación fallida (Joi)
 */
router.post('/', (0, Joi_1.ValidateJoi)(Joi_1.Schemas.usuario.create), Usuario_1.default.createUsuario);
/**
 * @openapi
 * /usuarios/{usuarioId}:
 *   get:
 *     summary: Obtiene un usuario por ID
 *     tags: [Usuarios]
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
 *       404:
 *         description: No encontrado
 */
router.get('/:usuarioId', Usuario_1.default.readUsuario);
/**
 * @openapi
 * /usuarios:
 *   get:
 *     summary: Lista todos los usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', Usuario_1.default.readAll);
/**
 * @openapi
 * /usuarios/{usuarioId}:
 *   put:
 *     summary: Actualiza un usuario por ID
 *     tags: [Usuarios]
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
 *       404:
 *         description: No encontrado
 *       422:
 *         description: Validación fallida (Joi)
 */
router.put('/:usuarioId', (0, Joi_1.ValidateJoi)(Joi_1.Schemas.usuario.update), Usuario_1.default.updateUsuario);
/**
 * @openapi
 * /usuarios/{usuarioId}:
 *   delete:
 *     summary: Elimina un usuario por ID
 *     tags: [Usuarios]
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
 *       404:
 *         description: No encontrado
 */
router.delete('/:usuarioId', Usuario_1.default.deleteUsuario);
exports.default = router;
