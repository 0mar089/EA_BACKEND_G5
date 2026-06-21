import mongoose from 'mongoose';
import Evento, { IEventoModel, IEvento } from '../models/Evento';

const eventoPopulate = [
  {
    path: 'creador',
    select: 'nombre email avatarUrl',
  },
  {
    path: 'asistentes',
    select: 'nombre email avatarUrl',
  },
];

const createEvento = async (data: any, creadorId: string): Promise<IEventoModel | null> => {
  const { titulo, descripcion, fecha, ubicacionNombre, lat, lng, maxAsistentes, fechaLimite } =
    data;

  const nuevoEvento = new Evento({
    _id: new mongoose.Types.ObjectId(),
    titulo,
    descripcion,
    fecha: new Date(fecha),
    fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
    ubicacionNombre,
    location: {
      type: 'Point',
      coordinates: [lng, lat], // [longitud, latitud]
    },
    creador: new mongoose.Types.ObjectId(creadorId),
    asistentes: [],
    maxAsistentes: maxAsistentes ? Number(maxAsistentes) : null,
    activo: true,
  });

  const savedEvento = await nuevoEvento.save();
  return await Evento.findById(savedEvento._id).populate(eventoPopulate);
};

const getEvento = async (eventoId: string): Promise<IEventoModel | null> => {
  return await Evento.findOne({ _id: eventoId, activo: true }).populate(eventoPopulate);
};

const getAllEventos = async (
  lat?: number,
  lng?: number,
  maxDistance?: number,
): Promise<IEventoModel[]> => {
  const now = new Date();
  const query: any = {
    activo: true,
    $or: [{ fechaLimite: null, fecha: { $gte: now } }, { fechaLimite: { $ne: null, $gte: now } }],
  };

  if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
    const nearSphereQuery: any = {
      $geometry: {
        type: 'Point',
        coordinates: [lng, lat], // [longitud, latitud]
      },
    };
    if (maxDistance !== undefined && maxDistance > 0) {
      nearSphereQuery.$maxDistance = maxDistance;
    }
    query.location = {
      $nearSphere: nearSphereQuery,
    };
  }

  return await Evento.find(query).populate(eventoPopulate);
};

const asistirEvento = async (eventoId: string, userId: string): Promise<IEventoModel | null> => {
  const evento = await Evento.findOne({ _id: eventoId, activo: true });
  if (!evento) return null;

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const yaAsiste = evento.asistentes.some((asistenteId) => asistenteId.toString() === userId);

  if (yaAsiste) {
    // Abandonar evento
    evento.asistentes = evento.asistentes.filter(
      (asistenteId) => asistenteId.toString() !== userId,
    );
  } else {
    // Apuntarse a evento
    if (evento.maxAsistentes && evento.asistentes.length >= evento.maxAsistentes) {
      throw new Error('El evento ha alcanzado el límite máximo de asistentes');
    }
    evento.asistentes.push(userObjectId);
  }

  await evento.save();
  return await Evento.findById(eventoId).populate(eventoPopulate);
};

const deleteEvento = async (
  eventoId: string,
  userId: string,
  userRol: string,
): Promise<IEventoModel | null> => {
  const evento = await Evento.findById(eventoId);
  if (!evento) return null;

  // Verificar si es creador o admin
  if (evento.creador.toString() !== userId && userRol !== 'admin') {
    throw new Error('Forbidden');
  }

  // Hard delete
  return await Evento.findByIdAndDelete(eventoId);
};

export default {
  createEvento,
  getEvento,
  getAllEventos,
  asistirEvento,
  deleteEvento,
};
