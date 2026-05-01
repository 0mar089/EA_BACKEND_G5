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

const getAllUniversidades = async (page: number = 1, limit: number = 10): Promise<any> => {
    const options = {
        page,
        limit,
        select: 'nombre ubicacion usuarios',
        lean: true
    };
    const paginated: any = await Universidad.paginate({}, options);
    paginated.docs = paginated.docs.map((uni: any) => ({
        _id: uni._id,
        nombre: uni.nombre,
        ubicacion: uni.ubicacion,
        numIntegrantes: uni.usuarios ? uni.usuarios.length : 0
    }));
    return paginated;
};

const updateUniversidad = async (universidadId: string, data: Partial<IUniversidad>): Promise<IUniversidadModel | null> => {
    return await Universidad.findByIdAndUpdate(universidadId, data, { new: true });
};

const deleteUniversidad = async (universidadId: string): Promise<IUniversidadModel | null> => {
    // 1. Desvincular a todos los usuarios de esta universidad
    await Usuario.updateMany({ universidad: universidadId }, { universidad: null });
    
    // 2. Eliminar la universidad
    return await Universidad.findByIdAndDelete(universidadId);
};


export default { createUniversidad, getUniversidad, getAllUniversidades, updateUniversidad, deleteUniversidad };