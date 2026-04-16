import mongoose from 'mongoose';
import Grado, { IGradoModel, IGrado } from '../models/Grado';
import Universidad from '../models/Universidad';

const createGrado = async (data: Partial<IGrado>): Promise<IGradoModel> => {
    const grado = new Grado({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });
    const savedGrado = await grado.save();
    
    // Al crear un grado, lo añadimos al array de la universidad correspondiente
    await Universidad.findByIdAndUpdate(data.universidad, {
        $push: { grados: savedGrado._id }
    });

    return savedGrado;
};

const getGrado = async (gradoId: string): Promise<IGradoModel | null> => {
    return await Grado.findById(gradoId).populate('universidad');
};

const getGradosByUniversidad = async (universidadId: string): Promise<IGradoModel[]> => {
    return await Grado.find({ universidad: universidadId });
};

const updateGrado = async (gradoId: string, data: Partial<IGrado>): Promise<IGradoModel | null> => {
    return await Grado.findByIdAndUpdate(gradoId, data, { new: true });
};

const deleteGrado = async (gradoId: string): Promise<IGradoModel | null> => {
    const grado = await Grado.findById(gradoId);
    if (grado) {
        // Al eliminar un grado, lo quitamos del array de la universidad
        await Universidad.findByIdAndUpdate(grado.universidad, {
            $pull: { grados: grado._id }
        });
    }
    return await Grado.findByIdAndDelete(gradoId);
};

export default { createGrado, getGrado, getGradosByUniversidad, updateGrado, deleteGrado };
