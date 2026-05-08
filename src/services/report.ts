import mongoose, { Types } from 'mongoose';
import Report, { IReportModel, IReport } from '../models/Report';
import Usuario from '../models/Usuario';

const createReport = async (data: Partial<IReport>): Promise<IReportModel> => {
    const report = new Report({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });
    return await report.save();
};

const getReport = async (reportId: string): Promise<IReportModel | null> => {
    return await Report.findById(reportId).populate('usuarioReporta', 'nombre email');
};

const getAllReports = async (
    page: number = 1, 
    limit: number = 10,
    search: string = '',
    tipo: string = 'all',
    activeOnly: string = 'false',
    startDate: string = '',
    endDate: string = '',
    estado: string = 'all'
): Promise<any> => {
    const query: any = {};

    if (search) {
        query.$or = [
            { descripcion: { $regex: search, $options: 'i' } },
            { objetivoId: { $regex: search, $options: 'i' } }
        ];
    }

    if (tipo !== 'all') {
        query.tipo = tipo;
    }

    if (estado !== 'all') {
        query.estado = estado;
    } else if (activeOnly === 'true') {
        query.estado = { $ne: 'resuelto' };
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
            query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt.$lte = end;
        }
    }

    const options = {
        page,
        limit,
        sort: { createdAt: -1 },
        populate: { path: 'usuarioReporta', select: 'nombre email' }
    };
    return await Report.paginate(query, options);
};

const getReportsByUser = async (userId: string, page: number = 1, limit: number = 10): Promise<any> => {
    const user = await Usuario.findById(userId).select('posts comments');
    if (!user) throw new Error('User not found');

    const postIds = user.posts || [];
    const commentIds = user.comments || [];

    const query = {
        $or: [
            { tipo: 'user', objetivoId: new mongoose.Types.ObjectId(userId) },
            { tipo: 'post', objetivoId: { $in: postIds } },
            { tipo: 'comment', objetivoId: { $in: commentIds } }
        ]
    };

    const options = {
        page,
        limit,
        sort: { createdAt: -1 },
        populate: { path: 'usuarioReporta', select: 'nombre email' }
    };
    return await Report.paginate(query, options);
};

const updateReportStatus = async (reportId: string, estado: string): Promise<IReportModel | null> => {
    return await Report.findByIdAndUpdate(reportId, { estado }, { new: true }).populate('usuarioReporta', 'nombre email');
};

const deleteReport = async (reportId: string): Promise<IReportModel | null> => {
    return await Report.findByIdAndDelete(reportId);
};

export default {
    createReport,
    getReport,
    getAllReports,
    getReportsByUser,
    updateReportStatus,
    deleteReport
};
