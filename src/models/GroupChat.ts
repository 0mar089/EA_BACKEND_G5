import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGroupChat {
  nombre: string;
  creador: Types.ObjectId;
  miembros: Types.ObjectId[]; // Includes creator and all invited users
  avatarUrl?: string;
}

export interface IGroupChatModel extends IGroupChat, Document {}

const GroupChatSchema: Schema<IGroupChatModel> = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del grupo es obligatorio'],
      trim: true,
      maxlength: 100,
    },
    creador: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    miembros: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
      },
    ],
    avatarUrl: {
      type: String,
      default: 'https://api.dicebear.com/7.x/identicon/png?seed=group-avatar',
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'group_chats',
  },
);

// Index for query optimization
GroupChatSchema.index({ miembros: 1 });

const GroupChat = mongoose.model<IGroupChatModel>('GroupChat', GroupChatSchema);
export default GroupChat;
