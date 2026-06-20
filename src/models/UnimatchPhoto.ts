import mongoose, { Document, Schema, Types } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IUnimatchPhoto {
    userId: Types.ObjectId;
    imageUrl: string;
    order: number;
    activo: boolean;
}

export interface IUnimatchPhotoModel extends IUnimatchPhoto, Document {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const UnimatchPhotoSchema: Schema<IUnimatchPhotoModel> = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
            index: true
        },
        imageUrl: {
            type: String,
            required: [true, 'La URL de la imagen es obligatoria'],
            trim: true
        },
        order: {
            type: Number,
            default: 0
        },
        activo: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'unimatch_photos'
    }
);

// Índice compuesto para obtener fotos de un usuario ordenadas
UnimatchPhotoSchema.index({ userId: 1, order: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const UnimatchPhoto = mongoose.model<IUnimatchPhotoModel>('UnimatchPhoto', UnimatchPhotoSchema);

export default UnimatchPhoto;
