import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IComment {
    usuario: Types.ObjectId; // Referencia al usuario que hizo el comentario
    post: Types.ObjectId; // Referencia al post al que pertenece el comentario
    texto: string;
  };

  export interface ICommentModel extends IComment, Document { }

  const CommentSchema: Schema<ICommentModel> = new Schema(
    {
        usuario: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            required: [true, 'El usuario es obligatorio']
        },
        post: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
            required: [true, 'El post es obligatorio']
        },
        texto: {
            type: String,
            required: [true, 'El texto del comentario es obligatorio'],
            trim: true
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'comments'
    }
)

  
const Comment = mongoose.model<ICommentModel>('Comment', CommentSchema);

export default Comment;
