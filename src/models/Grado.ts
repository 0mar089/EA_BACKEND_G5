import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGrado {
  nombre: string;
  asignaturas: Types.ObjectId[];
  universidad: Types.ObjectId;
}

export interface IGradoModel extends IGrado, Document {}

const GradoSchema: Schema<IGradoModel> = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del grado es obligatorio'],
      trim: true,
    },
    asignaturas: {
      type: [Schema.Types.ObjectId],
      ref: 'Asignatura',
      default: [],
    },
    universidad: {
      type: Schema.Types.ObjectId,
      ref: 'Universidad',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'grados',
  },
);

const Grado = mongoose.model<IGradoModel>('Grado', GradoSchema);
export default Grado;
