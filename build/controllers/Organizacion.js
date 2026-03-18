"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Organizacion_1 = __importDefault(require("../services/Organizacion"));
const createOrganizacion = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const savedOrganizacion = yield Organizacion_1.default.createOrganizacion(req.body);
        return res.status(201).json(savedOrganizacion);
    }
    catch (error) {
        return res.status(500).json({ error });
    }
});
const readOrganizacion = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizacion = yield Organizacion_1.default.getOrganizacion(req.params.organizacionId);
        return organizacion ? res.status(200).json(organizacion) : res.status(404).json({ message: 'not found' });
    }
    catch (error) {
        return res.status(500).json({ error });
    }
});
const readOrganizacionUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizacion = yield Organizacion_1.default.getOrganizacionUsers(req.params.organizacionId);
        return organizacion ? res.status(200).json(organizacion.usuarios) : res.status(404).json({ message: 'not found' });
    }
    catch (error) {
        return res.status(500).json({ error });
    }
});
const readAll = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizaciones = yield Organizacion_1.default.getAllOrganizaciones();
        return res.status(200).json(organizaciones);
    }
    catch (error) {
        return res.status(500).json({ error });
    }
});
const updateOrganizacion = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const organizacionId = req.params.organizacionId;
    try {
        const organizacion = yield Organizacion_1.default.updateOrganizacion(organizacionId, req.body);
        return organizacion ? res.status(200).json(organizacion) : res.status(404).json({ message: 'not found' });
    }
    catch (error) {
        return res.status(500).json({ error });
    }
});
const deleteOrganizacion = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const organizacionId = req.params.organizacionId;
    try {
        const organizacion = yield Organizacion_1.default.deleteOrganizacion(organizacionId);
        return organizacion ? res.status(201).json(organizacion) : res.status(404).json({ message: 'not found' });
    }
    catch (error) {
        return res.status(500).json({ error });
    }
});
exports.default = { createOrganizacion, readOrganizacion, readOrganizacionUsers, readAll, updateOrganizacion, deleteOrganizacion };
