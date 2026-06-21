import mongoose, { Document, Schema, Types } from 'mongoose';

export enum FollowStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
}

export interface IFollow {
  follower: Types.ObjectId; // User who wants to follow
  following: Types.ObjectId; // User being followed
  status: FollowStatus;
  createdAt: Date;
}

export interface IFollowModel extends IFollow, Document {}

const FollowSchema: Schema<IFollowModel> = new Schema(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(FollowStatus),
      default: FollowStatus.ACCEPTED,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'follows',
  },
);

// Asegurar que no haya duplicados de la relación
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

const Follow = mongoose.model<IFollowModel>('Follow', FollowSchema);

export default Follow;
