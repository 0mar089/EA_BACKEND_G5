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
const Organizacion_1 = __importDefault(require("../models/Organizacion"));
const createOrganizacion = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const organizacion = new Organizacion_1.default(Object.assign({ _id: new mongoose_1.default.Types.ObjectId() }, data));
    return yield organizacion.save();
});
const getOrganizacion = (organizacionId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Organizacion_1.default.findById(organizacionId).populate('usuarios');
});
// Getear Usuarios de una Organizacion
const getOrganizacionUsers = (organizacionId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Organizacion_1.default.findById(organizacionId).populate('usuarios').lean();
});
const getAllOrganizaciones = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield Organizacion_1.default.find();
});
const updateOrganizacion = (organizacionId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const organizacion = yield Organizacion_1.default.findById(organizacionId);
    if (organizacion) {
        organizacion.set(data);
        return yield organizacion.save();
    }
    return null;
});
const deleteOrganizacion = (organizacionId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Organizacion_1.default.findByIdAndDelete(organizacionId);
});
// Agregar Usuario a una Organizacion
const addUsuarioToOrganizacion = (organizacionId, usuarioId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Organizacion_1.default.findByIdAndUpdate(organizacionId, {
        $push: { usuarios: usuarioId }
    });
});
// Eliminar Usuario de una Organizacion
const removeUsuarioFromOrganizacion = (organizacionId, usuarioId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Organizacion_1.default.findByIdAndUpdate(organizacionId, {
        $pull: { usuarios: usuarioId }
    });
});
exports.default = { createOrganizacion, getOrganizacion, getAllOrganizaciones, updateOrganizacion, deleteOrganizacion, getOrganizacionUsers, addUsuarioToOrganizacion, removeUsuarioFromOrganizacion };
