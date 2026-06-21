import mongoose from 'mongoose';
import BugReport, { IBugReportModel, IBugReport } from '../models/BugReport';

const createBugReport = async (data: Partial<IBugReport>): Promise<IBugReportModel> => {
  const bug = new BugReport({
    _id: new mongoose.Types.ObjectId(),
    ...data,
  });
  return await bug.save();
};

const getBugReport = async (bugId: string): Promise<IBugReportModel | null> => {
  return await BugReport.findById(bugId).populate('usuarioReporta', 'nombre email avatarUrl');
};

const getAllBugReports = async (
  page: number = 1,
  limit: number = 10,
  estado: string = 'all',
  plataforma: string = 'all',
  activeOnly: string = 'false',
): Promise<any> => {
  const query: Record<string, any> = {};
  if (estado !== 'all') {
    query.estado = estado;
  } else if (activeOnly === 'true') {
    query.estado = { $nin: ['resuelto', 'rechazado'] };
  }

  if (plataforma !== 'all') {
    query.plataforma = plataforma;
  }

  const options = {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: { path: 'usuarioReporta', select: 'nombre email avatarUrl' },
  };
  return await BugReport.paginate(query, options);
};

const updateBugReportStatus = async (
  bugId: string,
  estado: string,
): Promise<IBugReportModel | null> => {
  return await BugReport.findByIdAndUpdate(bugId, { estado }, { new: true }).populate(
    'usuarioReporta',
    'nombre email avatarUrl',
  );
};

const deleteBugReport = async (bugId: string): Promise<IBugReportModel | null> => {
  return await BugReport.findByIdAndDelete(bugId);
};

export default {
  createBugReport,
  getBugReport,
  getAllBugReports,
  updateBugReportStatus,
  deleteBugReport,
};
