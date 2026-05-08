import mongoose, { Document, Schema, Types } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface IBugReport {
    usuarioReporta: Types.ObjectId;
    titulo: string;
    descripcion: string;
    comoReplicarlo: string;
    imageUrls: string[];
    estado: 'pendiente' | 'en_progreso' | 'resuelto' | 'rechazado';
}

export interface IBugReportModel extends IBugReport, Document { }

const BugReportSchema: Schema<IBugReportModel> = new Schema(
    {
        usuarioReporta: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            required: [true, 'El usuario que reporta es obligatorio']
        },
        titulo: {
            type: String,
            required: [true, 'El título es obligatorio'],
            trim: true
        },
        descripcion: {
            type: String,
            required: [true, 'La descripción es obligatoria'],
            trim: true
        },
        comoReplicarlo: {
            type: String,
            default: '',
            trim: true
        },
        imageUrls: {
            type: [String],
            default: []
        },
        estado: {
            type: String,
            enum: ['pendiente', 'en_progreso', 'resuelto', 'rechazado'],
            default: 'pendiente'
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'bugreports'
    }
);

BugReportSchema.plugin(mongoosePaginate);

const BugReport = mongoose.model<IBugReportModel, mongoose.PaginateModel<IBugReportModel>>('BugReport', BugReportSchema);

export default BugReport;
