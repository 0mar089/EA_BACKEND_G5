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

const getAllReports = async (): Promise<IReportModel[]> => {
    return await Report.find().sort({ createdAt: -1 }).populate('usuarioReporta', 'nombre email');
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
