import mongoose, { Document, Schema, Types } from 'mongoose';

export type ReportType = 'user' | 'post' | 'comment';

export interface IReport {
    usuarioReporta: Types.ObjectId; // Quién hace el reporte
    tipo: ReportType; // Qué se está reportando
    objetivoId: Types.ObjectId; // El ID de lo reportado (User, Post o Comment)
    descripcion: string;
    estado: 'pendiente' | 'revisado' | 'resuelto';
}

export interface IReportModel extends IReport, Document { }

const ReportSchema: Schema<IReportModel> = new Schema(
    {
        usuarioReporta: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            required: [true, 'El usuario que reporta es obligatorio']
        },
        tipo: {
            type: String,
            enum: ['user', 'post', 'comment'],
            required: [true, 'El tipo de reporte es obligatorio']
        },
        objetivoId: {
            type: Schema.Types.ObjectId,
            required: [true, 'El ID del objetivo reportado es obligatorio'],
            refPath: 'tipo' // Esto permite que Mongoose sepa a qué colección apuntar si hacemos populate dinámico (aunque 'user' != 'Usuario', 'post' != 'Post', etc., así que mejor manual o corregir nombres)
        },
        descripcion: {
            type: String,
            required: [true, 'La descripción del reporte es obligatoria'],
            trim: true
        },
        estado: {
            type: String,
            enum: ['pendiente', 'revisado', 'resuelto'],
            default: 'pendiente'
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'reports'
    }
);

const Report = mongoose.model<IReportModel>('Report', ReportSchema);

export default Report;
