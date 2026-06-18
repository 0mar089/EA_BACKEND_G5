import mongoose, { Document, Schema, Types } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface IEvento {
    titulo: string;
    descripcion: string;
    fecha: Date;
    ubicacionNombre: string; //ayuda IA
    location: {
        type: 'Point';
        coordinates: [number, number]; // [longitud, latitud]
    };
    creador: Types.ObjectId;
    asistentes: Types.ObjectId[];
    maxAsistentes?: number | null;
    activo: boolean;
    fechaLimite?: Date | null;
}

export interface IEventoModel extends IEvento, Document {}

const EventoSchema: Schema<IEventoModel> = new Schema(
    {
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
        fecha: {
            type: Date,
            required: [true, 'La fecha es obligatoria']
        },
        fechaLimite: {
            type: Date,
            default: null
        },
        ubicacionNombre: {
            type: String,
            required: [true, 'El nombre de la ubicación es obligatorio'],
            trim: true
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                required: true,
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitud, latitud]
                required: true
            }
        },
        creador: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            required: [true, 'El creador es obligatorio']
        },
        asistentes: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'Usuario'
                }
            ],
            default: []
        },
        maxAsistentes: {
            type: Number,
            default: null
        },
        activo: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'eventos'
    }
);

// Índice geoespacial 2dsphere para permitir búsquedas de proximidad
EventoSchema.index({ location: '2dsphere' });

EventoSchema.plugin(mongoosePaginate);

const Evento = mongoose.model<IEventoModel, mongoose.PaginateModel<IEventoModel>>('Evento', EventoSchema);

export default Evento;
