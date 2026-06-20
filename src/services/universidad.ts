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

const getAllUniversidades = async (page: number = 1, limit: number = 10, search: string = ''): Promise<any> => {
    const filter: any = {};
    if (search) {
        filter.$or = [
            { nombre: { $regex: search, $options: 'i' } },
            { ubicacion: { $regex: search, $options: 'i' } }
        ];
    }

    const options = {
        page,
        limit,
        select: 'nombre ubicacion usuarios chatGeneral',
        populate: { path: 'chatGeneral', select: 'miembros' },
        lean: true
    };
    const paginated: any = await Universidad.paginate(filter, options);
    paginated.docs = paginated.docs.map((uni: any) => {
        const chatGeneralObj = uni.chatGeneral;
        const chatGeneralId = chatGeneralObj && typeof chatGeneralObj === 'object' ? chatGeneralObj._id : chatGeneralObj;
        const membersCount = chatGeneralObj && chatGeneralObj.miembros ? chatGeneralObj.miembros.length : 0;
        return {
            _id: uni._id,
            nombre: uni.nombre,
            ubicacion: uni.ubicacion,
            numIntegrantes: membersCount,
            chatGeneral: chatGeneralId
        };
    });
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