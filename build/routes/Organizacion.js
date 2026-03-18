"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Organizacion_1 = __importDefault(require("../controllers/Organizacion"));
const Joi_1 = require("../middleware/Joi");
const router = express_1.default.Router();
/**
 * @openapi
 * tags:
 *   - name: Organizaciones
 *     description: Endpoints CRUD de organizaciones
 *
 * components:
 *   schemas:
 *     Organizacion:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ObjectId de MongoDB
 *           example: "65f1c2a1b2c3d4e5f6789013"
 *         name:
 *           type: string
 *           example: "EA Company"
 *         usuarios:
 *           type: array
 *           items:
 *             type: string
 *           description: Array de ObjectIds de usuarios
 *           example: ["65f1c2a1b2c3d4e5f6789012"]
 *     OrganizacionCreateUpdate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "EA Company"
 */
/**
 * @openapi
 * /organizaciones:
 *   post:
 *     summary: Crea una organización
 *     tags: [Organizaciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrganizacionCreateUpdate'
 *     responses:
 *       201:
 *         description: Creado
 *       422:
 *         description: Validación fallida (Joi)
 */
router.post('/', (0, Joi_1.ValidateJoi)(Joi_1.Schemas.organizacion.create), Organizacion_1.default.createOrganizacion);
/**
 * @openapi
 * /organizaciones/{organizacionId}:
 *   get:
 *     summary: Obtiene una organización por ID
 *     tags: [Organizaciones]
 *     parameters:
 *       - in: path
 *         name: organizacionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la organización
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Organizacion'
 *       404:
 *         description: No encontrado
 */
router.get('/:organizacionId', Organizacion_1.default.readOrganizacion);
/**
 * @openapi
 * /organizaciones/{organizacionId}/users:
 *   get:
 *     summary: Obtiene los usuarios de una organización por ID
 *     tags: [Organizaciones]
 *     parameters:
 *       - in: path
 *         name: organizacionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la organización
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Organizacion'
 *       404:
 *         description: No encontrado
 */
router.get('/:organizacionId/users', Organizacion_1.default.readOrganizacionUsers);
/**
 * @openapi
 * /organizaciones:
 *   get:
 *     summary: Lista todas las organizaciones
 *     tags: [Organizaciones]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Organizacion'
 */
router.get('/', Organizacion_1.default.readAll);
/**
 * @openapi
 * /organizaciones/{organizacionId}:
 *   put:
 *     summary: Actualiza una organización por ID
 *     tags: [Organizaciones]
 *     parameters:
 *       - in: path
 *         name: organizacionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la organización
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrganizacionCreateUpdate'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Organizacion'
 *       404:
 *         description: No encontrado
 *       422:
 *         description: Validación fallida (Joi)
 */
router.put('/:organizacionId', (0, Joi_1.ValidateJoi)(Joi_1.Schemas.organizacion.update), Organizacion_1.default.updateOrganizacion);
/**
 * @openapi
 * /organizaciones/{organizacionId}:
 *   delete:
 *     summary: Elimina una organización por ID
 *     tags: [Organizaciones]
 *     parameters:
 *       - in: path
 *         name: organizacionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la organización
 *     responses:
 *       200:
 *         description: Eliminado correctamente
 *       404:
 *         description: No encontrado
 */
router.delete('/:organizacionId', Organizacion_1.default.deleteOrganizacion);
exports.default = router;
