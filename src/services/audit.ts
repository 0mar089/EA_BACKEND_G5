import AdminLog, { AdminAction, IAdminLog } from '../models/AdminLog';

const recordLog = async (data: IAdminLog): Promise<void> => {
  try {
    const log = new AdminLog(data);
    await log.save();
  } catch (error) {
    console.error('Error recording admin log:', error);
    // No lanzamos error para no interrumpir la ejecución principal
  }
};

const getLogs = async (page: number = 1, limit: number = 20, filters: Record<string, any> = {}) => {
  const query: Record<string, any> = {};

  if (filters.adminId) query.admin = filters.adminId;
  if (filters.accion) query.accion = filters.accion;
  if (filters.tipoObjetivo) query.tipoObjetivo = filters.tipoObjetivo;
  if (filters.objetivoId) query.objetivoId = filters.objetivoId;

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  if (filters.search) {
    query.$or = [
      { objetivoId: { $regex: filters.search, $options: 'i' } },
      { detalles: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const options = {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: {
      path: 'admin',
      select: 'nombre email avatarUrl',
    },
  };

  return await AdminLog.paginate(query, options);
};

export default {
  recordLog,
  getLogs,
  AdminAction,
};
