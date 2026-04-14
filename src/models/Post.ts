import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPost {
    usuario: Types.ObjectId; // Referencia al usuario que hizo el post
    imageUrl?: string; //nse como haremos lo de las img pero de momento urls
    caption?: string;
    likes: Types.ObjectId[]; // Referencia a los usuarios que le dieron like
    comments: Types.ObjectId[];
  };

export interface IPostModel extends IPost, Document { }

const PostSchema: Schema<IPostModel> = new Schema(
    {
        usuario: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            required: [true, 'El usuario es obligatorio']
        },
        imageUrl: {
            type: String,
            trim: true
        },
        caption: {
            type: String,
            trim: true
        },
        likes: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'Usuario'
                }
            ],
            default: []
        },
        comments: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Comment'
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'posts'
    }
);

const Post = mongoose.model<IPostModel>('Post', PostSchema);

export default Post;  