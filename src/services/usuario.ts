import mongoose from 'mongoose';
import Usuario, { IUsuarioModel, IUsuario } from '../models/Usuario';
import Universidad from '../models/Universidad';

const createUsuario = async (data: Partial<IUsuario>): Promise<IUsuarioModel> => {
    // Normalizamos "" a null para evitar errores de validación de ObjectId
    if (!data.universidad || data.universidad === ('' as any)) data.universidad = undefined;

    const usuario = new Usuario({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });
    await usuario.save();

    if (usuario.universidad) {
        await Universidad.findByIdAndUpdate(
            usuario.universidad,
            { $addToSet: { usuarios: usuario._id } } // Vincular usuario a la universidad
        );
    }
    return usuario;
};

const getUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findById(usuarioId).populate('universidad');
};

const getUsuarioBasic = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findById(usuarioId).select('nombre universidad').populate('universidad', 'nombre');
};

const getAllUsuarios = async (): Promise<IUsuarioModel[]> => {
    return await Usuario.find({ activo: true }).select('nombre universidad').populate('universidad', 'nombre');
};

const getAllUsuariosAdmin = async (): Promise<IUsuarioModel[]> => {
    return await Usuario.find().populate('universidad');
};

const updateUsuario = async (usuarioId: string, data: Partial<IUsuario>): Promise<IUsuarioModel | null> => {
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) return null;

    // Si viene el campo universidad en la data, manejamos la sincronización de la lista
    if ('universidad' in data) {
        const oldUniId = usuario.universidad;
        // Normalizamos "" a null para evitar errores de validación
        if ((data as any).universidad === '') (data as any).universidad = null;
        const newUniId = data.universidad;

        // Si cambió la universidad asociada
        if (String(oldUniId) !== String(newUniId)) {
            // 1. Desvincular de la antigua si existía
            if (oldUniId) {
                await Universidad.findByIdAndUpdate(oldUniId, { $pull: { usuarios: usuario._id } });
            }
            // 2. Vincular a la nueva si se ha proporcionado una
            if (newUniId) {
                await Universidad.findByIdAndUpdate(newUniId, { $addToSet: { usuarios: usuario._id } });
            }
        }
    }

    usuario.set(data);
    return await usuario.save();
};

// Soft Delete: marca como inactivo sin eliminar de la BD
const softDeleteUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findByIdAndUpdate(
        usuarioId,
        { activo: false },
        { new: true }
    );
};

// Recovery: vuelve a activar la cuenta
const recoveryUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findByIdAndUpdate(
        usuarioId,
        { activo: true },
        { new: true }
    );
};

// Hard Delete: elimina el documento definitivamente de la BD
const hardDeleteUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    const usuario = await Usuario.findById(usuarioId);
    if (usuario && usuario.universidad) {
        await Universidad.findByIdAndUpdate(usuario.universidad, { $pull: { usuarios: usuario._id } });
    }
    return await Usuario.findByIdAndDelete(usuarioId);
};

export default { createUsuario, getUsuario, getUsuarioBasic, getAllUsuarios, getAllUsuariosAdmin, updateUsuario, softDeleteUsuario, hardDeleteUsuario, recoveryUsuario };