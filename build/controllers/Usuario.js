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
const Usuario_1 = __importDefault(require("../services/Usuario"));
const createUsuario = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const savedUsuario = yield Usuario_1.default.createUsuario(req.body);
        return res.status(201).json(savedUsuario);
    }
    catch (error) {
        return res.status(500).json({ error });
    }
});
const readUsuario = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const usuarioId = req.params.usuarioId;
    try {
        const usuario = yield Usuario_1.default.getUsuario(usuarioId);
        return usuario ? res.status(200).json(usuario) : res.status(404).json({ message: 'not found' });
    }
    catch (error) {
        return res.status(500).json({ error });
    }
});
const readAll = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const usuarios = yield Usuario_1.default.getAllUsuarios();
        return res.status(200).json(usuarios);
    }
    catch (error) {
        return res.status(500).json({ error });
    }
});
const updateUsuario = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const usuarioId = req.params.usuarioId;
    try {
        const updatedUsuario = yield Usuario_1.default.updateUsuario(usuarioId, req.body);
        return updatedUsuario ? res.status(201).json(updatedUsuario) : res.status(404).json({ message: 'not found' });
    }
    catch (error) {
        return res.status(500).json({ error });
    }
});
const deleteUsuario = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const usuarioId = req.params.usuarioId;
    try {
        const usuario = yield Usuario_1.default.deleteUsuario(usuarioId);
        return usuario ? res.status(201).json(usuario) : res.status(404).json({ message: 'not found' });
    }
    catch (error) {
        return res.status(500).json({ error });
    }
});
exports.default = { createUsuario, readUsuario, readAll, updateUsuario, deleteUsuario };
