import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessage {
    remitente: Types.ObjectId;
    destinatario: Types.ObjectId;
    contenido: string;
    leido: boolean;
    eliminadoPara: Types.ObjectId[];
    eliminadoParaTodos: boolean;
}

export interface IMessageModel extends IMessage, Document {}

const MessageSchema: Schema<IMessageModel> = new Schema(
    {
        remitente: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true
        },
        destinatario: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true
        },
        contenido: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },
        leido: {
            type: Boolean,
            default: false
        },
        eliminadoPara: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Usuario'
            }
        ],
        eliminadoParaTodos: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'messages'
    }
);

// Índice para cargar conversaciones rápido
MessageSchema.index({ remitente: 1, destinatario: 1 });

const Message = mongoose.model<IMessageModel>('Message', MessageSchema);
export default Message;
