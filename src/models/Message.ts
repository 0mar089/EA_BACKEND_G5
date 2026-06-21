import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessage {
  remitente: Types.ObjectId;
  destinatario?: Types.ObjectId;
  grupo?: Types.ObjectId;
  contenido: string;
  post?: Types.ObjectId; // Nueva referencia a post
  parentMessage?: Types.ObjectId; // Referencia al mensaje citado
  reactions?: { usuario: Types.ObjectId; emoji: string }[];
  leido: boolean;
  leidoPor?: Types.ObjectId[];
  eliminadoPara: Types.ObjectId[];
  eliminadoParaTodos: boolean;
}

export interface IMessageModel extends IMessage, Document {}

const MessageSchema: Schema<IMessageModel> = new Schema(
  {
    remitente: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    destinatario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: false,
    },
    grupo: {
      type: Schema.Types.ObjectId,
      ref: 'GroupChat',
      default: null,
    },
    contenido: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    parentMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    reactions: [
      {
        usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
        emoji: { type: String },
      },
    ],
    leido: {
      type: Boolean,
      default: false,
    },
    leidoPor: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
      },
    ],
    eliminadoPara: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
      },
    ],
    eliminadoParaTodos: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'messages',
  },
);

// Índice para cargar conversaciones rápido
MessageSchema.index({ remitente: 1, destinatario: 1 });
MessageSchema.index({ grupo: 1 });

const Message = mongoose.model<IMessageModel>('Message', MessageSchema);
export default Message;
