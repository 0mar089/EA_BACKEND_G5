import mongoose from 'mongoose';
import Universidad, { IUniversidadModel, IUniversidad } from '../models/Universidad';
import Usuario from '../models/Usuario';

const createUniversidad = async (data: Partial<IUniversidad>): Promise<IUniversidadModel> => {
    const universidad = new Universidad({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });
    return await universidad.save();
};

const getUniversidad = async (universidadId: string): Promise<IUniversidadModel | null> => {
    return await Universidad.findById(universidadId).populate('usuarios');
};

const getAllUniversidades = async (): Promise<IUniversidadModel[]> => {
    return await Universidad.find().populate('usuarios');
};

const updateUniversidad = async (universidadId: string, data: Partial<IUniversidad>): Promise<IUniversidadModel | null> => {
    return await Universidad.findByIdAndUpdate(universidadId, data, { new: true }).populate('usuarios');
};

const deleteUniversidad = async (universidadId: string): Promise<IUniversidadModel | null> => {
    // 1. Desvincular a todos los usuarios de esta universidad
    await Usuario.updateMany({ universidad: universidadId }, { universidad: null });
    
    // 2. Eliminar la universidad
    return await Universidad.findByIdAndDelete(universidadId);
};


export default { createUniversidad, getUniversidad, getAllUniversidades, updateUniversidad, deleteUniversidad };