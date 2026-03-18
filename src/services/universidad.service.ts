import mongoose from 'mongoose';
import Universidad, { IUniversidadModel, IUniversidad } from '../models/Universidad';

const createUniversidad = async (data: Partial<IUniversidad>): Promise<IUniversidadModel> => {
    const universidad = new Universidad({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });
    return await universidad.save();
};

const getUniversidad = async (universidadId: string): Promise<IUniversidadModel | null> => {
    return await Universidad.findById(universidadId);
};

const getAllUniversidades = async (): Promise<IUniversidadModel[]> => {
    return await Universidad.find();
};

const updateUniversidad = async (universidadId: string, data: Partial<IUniversidad>): Promise<IUniversidadModel | null> => {
    const universidad = await Universidad.findById(universidadId);
    if (universidad) {
        universidad.set(data);
        return await universidad.save();
    }
    return null;
};

const deleteUniversidad = async (universidadId: string): Promise<IUniversidadModel | null> => {
    return await Universidad.findByIdAndDelete(universidadId);
};


export default { createUniversidad, getUniversidad, getAllUniversidades, updateUniversidad, deleteUniversidad };