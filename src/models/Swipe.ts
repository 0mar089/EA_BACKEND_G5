import mongoose, { Document, Schema, Types } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export type SwipeType = 'like' | 'dislike';

export interface ISwipe {
  fromUser: Types.ObjectId;
  toUser: Types.ObjectId;
  type: SwipeType;
  createdAt: Date;
}

export interface ISwipeModel extends ISwipe, Document {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const SwipeSchema: Schema<ISwipeModel> = new Schema(
  {
    fromUser: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    toUser: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['like', 'dislike'],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: 'swipes',
  },
);

// Índice compuesto: un usuario solo puede tener un swipe activo hacia otro
SwipeSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });
// Índice para buscar matches inversos rápidamente
SwipeSchema.index({ toUser: 1, fromUser: 1, type: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Swipe = mongoose.model<ISwipeModel>('Swipe', SwipeSchema);

export default Swipe;
