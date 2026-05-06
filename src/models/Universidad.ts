import mongoose, { Document, Schema, Types } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IUniversidad {
    nombre: string;
    ubicacion: string;
    usuarios: Types.ObjectId[];
    grados?: Types.ObjectId[];
}

// Extiende Document para que sea compatible con los helpers de Mongoose (save, populate, etc.)
export interface IUniversidadModel extends IUniversidad, Document { }

// ─── Schema ───────────────────────────────────────────────────────────────────

const UniversidadSchema: Schema<IUniversidadModel> = new Schema(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre de la universidad es obligatorio'],
            unique: true,
            trim: true
        },
        ubicacion: {
            type: String,
            required: [true, 'La ubicación es obligatoria'],
            trim: true
        },
        usuarios: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Usuario'
            }
        ],
        grados: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Grado'
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'universidades'
    }
);

UniversidadSchema.plugin(mongoosePaginate);

// ─── Model ────────────────────────────────────────────────────────────────────

const Universidad = mongoose.model<IUniversidadModel, mongoose.PaginateModel<IUniversidadModel>>('Universidad', UniversidadSchema);

export default Universidad;
