import mongoose from 'mongoose';
import Report, { IReportModel, IReport } from '../models/Report';

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

const getAllReports = async (page: number = 1, limit: number = 10): Promise<any> => {
    const options = {
        page,
        limit,
        sort: { createdAt: -1 },
        populate: { path: 'usuarioReporta', select: 'nombre email' }
    };
    return await Report.paginate({}, options);
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
    updateReportStatus,
    deleteReport
};
