import mongoose, { Document, Schema, Types } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export enum AdminAction {
  // Reportes
  UPDATE_REPORT_STATUS = 'UPDATE_REPORT_STATUS',
  DELETE_REPORT = 'DELETE_REPORT',

  // Contenido
  DELETE_POST = 'DELETE_POST',
  UPDATE_POST = 'UPDATE_POST',
  DELETE_COMMENT = 'DELETE_COMMENT',

  // Usuarios
  BAN_USER = 'BAN_USER',
  UNBAN_USER = 'UNBAN_USER',
  CHANGE_ROLE = 'CHANGE_ROLE',
  UPDATE_USER = 'UPDATE_USER',

  // Auth (Opcional)
  ADMIN_LOGIN = 'ADMIN_LOGIN',
}

export interface IAdminLog {
  admin: Types.ObjectId;
  accion: AdminAction;
  tipoObjetivo: 'report' | 'post' | 'comment' | 'user' | 'system';
  objetivoId?: string; // ID del recurso afectado
  detalles: string; // Descripción legible
  metadata?: any; // Datos técnicos extra (ej: valores antes/después)
  ip?: string;
}

export interface IAdminLogModel extends IAdminLog, Document {}

const AdminLogSchema: Schema<IAdminLogModel> = new Schema(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    accion: {
      type: String,
      enum: Object.values(AdminAction),
      required: true,
    },
    tipoObjetivo: {
      type: String,
      enum: ['report', 'post', 'comment', 'user', 'system'],
      required: true,
    },
    objetivoId: {
      type: String,
    },
    detalles: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ip: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'admin_logs',
  },
);

AdminLogSchema.plugin(mongoosePaginate);

const AdminLog = mongoose.model<IAdminLogModel, mongoose.PaginateModel<IAdminLogModel>>(
  'AdminLog',
  AdminLogSchema,
);

export default AdminLog;
