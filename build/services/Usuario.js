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
const mongoose_1 = __importDefault(require("mongoose"));
const Usuario_1 = __importDefault(require("../models/Usuario"));
const Organizacion_1 = __importDefault(require("./Organizacion"));
const createUsuario = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const usuario = new Usuario_1.default(Object.assign({ _id: new mongoose_1.default.Types.ObjectId() }, data));
    const savedUsuario = yield usuario.save();
    if (savedUsuario.organizacion) {
        // Agregar Usuario a una Organizacion
        yield Organizacion_1.default.addUsuarioToOrganizacion(savedUsuario.organizacion, savedUsuario._id);
    }
    return savedUsuario;
});
const getUsuario = (usuarioId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Usuario_1.default.findById(usuarioId).populate('organizacion');
});
const getAllUsuarios = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield Usuario_1.default.find().populate('organizacion');
});
const updateUsuario = (usuarioId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const oldUsuario = yield Usuario_1.default.findById(usuarioId);
    if (!oldUsuario)
        return null;
    const oldOrganizacion = oldUsuario.organizacion;
    // Clean data de campos vacíos o nulos para que no sobrescriban
    const updateData = {};
    Object.keys(data).forEach((key) => {
        const value = data[key];
        if (value !== undefined && value !== null && value !== '') {
            updateData[key] = value;
        }
    });
    const updatedUsuario = yield Usuario_1.default.findByIdAndUpdate(usuarioId, { $set: updateData }, { new: true });
    if (!updatedUsuario)
        return null;
    // Si ha cambiado la organización o se ha desvinculado
    if (data.organizacion !== undefined && String(oldOrganizacion) !== String(data.organizacion)) {
        if (oldOrganizacion) {
            yield Organizacion_1.default.removeUsuarioFromOrganizacion(oldOrganizacion, updatedUsuario._id);
        }
        if (data.organizacion) {
            yield Organizacion_1.default.addUsuarioToOrganizacion(data.organizacion, updatedUsuario._id);
        }
    }
    return updatedUsuario;
});
const deleteUsuario = (usuarioId) => __awaiter(void 0, void 0, void 0, function* () {
    const deletedUsuario = yield Usuario_1.default.findByIdAndDelete(usuarioId);
    if (deletedUsuario && deletedUsuario.organizacion) {
        // Eliminar Usuario de la Organizacion
        yield Organizacion_1.default.removeUsuarioFromOrganizacion(deletedUsuario.organizacion, deletedUsuario._id);
    }
    return deletedUsuario;
});
exports.default = { createUsuario, getUsuario, getAllUsuarios, updateUsuario, deleteUsuario };
