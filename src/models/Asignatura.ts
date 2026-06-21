import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAsignatura {
  nombre: string;
  usuarios?: Types.ObjectId[];
}

export interface IAsignaturaModel extends IAsignatura, Document {}

const AsignaturaSchema: Schema<IAsignaturaModel> = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la asignatura es obligatorio'],
      trim: true,
    },
    usuarios: {
      type: [Schema.Types.ObjectId],
      ref: 'Usuario',
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'asignaturas',
  },
);

const Asignatura = mongoose.model<IAsignaturaModel>('Asignatura', AsignaturaSchema);
export default Asignatura;
