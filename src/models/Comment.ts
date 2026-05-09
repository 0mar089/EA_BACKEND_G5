import mongoose, { Document, Schema, Types } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface IComment {
    usuario: Types.ObjectId; // Referencia al usuario que hizo el comentario
    post: Types.ObjectId; // Referencia al post al que pertenece el comentario
    texto: string;
    activo: boolean;
    likes: Types.ObjectId[];
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
        },
        activo: {
            type: Boolean,
            default: true
        },
        likes: [{
            type: Schema.Types.ObjectId,
            ref: 'Usuario'
        }]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'comments'
    }
)

CommentSchema.plugin(mongoosePaginate);

const Comment = mongoose.model<ICommentModel, mongoose.PaginateModel<ICommentModel>>('Comment', CommentSchema);

export default Comment;
