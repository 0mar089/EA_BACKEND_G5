import mongoose from 'mongoose';
import Asignatura, { IAsignaturaModel, IAsignatura } from '../models/Asignatura';
import Usuario from '../models/Usuario';
import Grado from '../models/Grado';

const createAsignatura = async (data: Partial<IAsignatura>): Promise<IAsignaturaModel> => {
    const asignatura = new Asignatura({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });
    
    return await asignatura.save();
};

const getAsignatura = async (asignaturaId: string): Promise<IAsignaturaModel | null> => {
    return await Asignatura.findById(asignaturaId);
};

const getAllAsignaturas = async (): Promise<IAsignaturaModel[]> => {
    return await Asignatura.find();
}

const getAsignaturasByGrado = async (gradoId: string): Promise<IAsignaturaModel[]> => {
    return await Asignatura.find({ grado: gradoId });
};

const updateAsignatura = async (asignaturaId: string, data: Partial<IAsignatura>): Promise<IAsignaturaModel | null> => {
    return await Asignatura.findByIdAndUpdate(asignaturaId, data, { new: true });
};

const deleteAsignatura = async (asignaturaId: string): Promise<IAsignaturaModel | null> => {
    const asignatura = await Asignatura.findById(asignaturaId);
    if (asignatura) {
        // quitar la asignatura de TODOS los grados
        await Grado.updateMany(
            { asignaturas: asignaturaId },
            { $pull: { asignaturas: asignaturaId } }
        );
        // quitar la asignatura de TODOS los usuarios        
        await Usuario.updateMany(
            { asignaturas: asignaturaId },
            { $pull: { asignaturas: asignaturaId } }
        );
    }

    // borrar la asignatura
    return await Asignatura.findByIdAndDelete(asignaturaId);
};

export default { createAsignatura, getAsignatura, getAsignaturasByGrado, updateAsignatura, deleteAsignatura, getAllAsignaturas };
