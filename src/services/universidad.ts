import mongoose from 'mongoose';
import Universidad, { IUniversidadModel, IUniversidad } from '../models/Universidad';
import Usuario from '../models/Usuario';

const createUniversidad = async (data: Partial<IUniversidad>): Promise<IUniversidadModel> => {
  const universidad = new Universidad({
    _id: new mongoose.Types.ObjectId(),
    ...data,
  });
  return await universidad.save();
};

const getUniversidad = async (universidadId: string): Promise<IUniversidadModel | null> => {
  return await Universidad.findById(universidadId).populate('usuarios');
};

const getAllUniversidades = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
): Promise<unknown> => {
  const filter: mongoose.FilterQuery<IUniversidad> = {};
  if (search) {
    filter.$or = [
      { nombre: { $regex: search, $options: 'i' } },
      { ubicacion: { $regex: search, $options: 'i' } },
    ];
  }

  const options = {
    page,
    limit,
    select: 'nombre ubicacion usuarios chatGeneral',
    populate: { path: 'chatGeneral', select: 'miembros' },
    lean: true,
  };
  const paginated = await Universidad.paginate(filter, options);
  const docs = (
    paginated.docs as unknown as Array<{
      _id: mongoose.Types.ObjectId | string;
      nombre: string;
      ubicacion: string;
      chatGeneral?:
        | { _id: mongoose.Types.ObjectId | string; miembros?: unknown[] }
        | mongoose.Types.ObjectId
        | string
        | null;
    }>
  ).map((uni) => {
    const chatGeneralObj = uni.chatGeneral;
    const chatGeneralId =
      chatGeneralObj && typeof chatGeneralObj === 'object' ? chatGeneralObj._id : chatGeneralObj;
    const membersCount =
      chatGeneralObj &&
      typeof chatGeneralObj === 'object' &&
      'miembros' in chatGeneralObj &&
      Array.isArray((chatGeneralObj as { miembros?: unknown[] }).miembros)
        ? (chatGeneralObj as { miembros: unknown[] }).miembros.length
        : 0;
    return {
      _id: uni._id,
      nombre: uni.nombre,
      ubicacion: uni.ubicacion,
      numIntegrantes: membersCount,
      chatGeneral: chatGeneralId,
    };
  });
  return {
    ...paginated,
    docs,
  };
};

const updateUniversidad = async (
  universidadId: string,
  data: Partial<IUniversidad>,
): Promise<IUniversidadModel | null> => {
  return await Universidad.findByIdAndUpdate(universidadId, data, { new: true });
};

const deleteUniversidad = async (universidadId: string): Promise<IUniversidadModel | null> => {
  // 1. Desvincular a todos los usuarios de esta universidad
  await Usuario.updateMany({ universidad: universidadId }, { universidad: null });

  // 2. Eliminar la universidad
  return await Universidad.findByIdAndDelete(universidadId);
};

export default {
  createUniversidad,
  getUniversidad,
  getAllUniversidades,
  updateUniversidad,
  deleteUniversidad,
};
