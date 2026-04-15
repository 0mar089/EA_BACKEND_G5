import mongoose from 'mongoose';
import Comment, { ICommentModel, IComment } from '../models/Comment';
import Usuario from '../models/Usuario';
import Post from '../models/Post';

const createComment = async (data: Partial<IComment>): Promise<ICommentModel> => {
    const comment = new Comment({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });

    const savedComment = await comment.save();

    // Vincular comentario al usuario
    if (savedComment.usuario) {
        await Usuario.findByIdAndUpdate(
            savedComment.usuario,
            { $addToSet: { comments: savedComment._id } }
        );
    }

    // Vincular comentario al post
    if (savedComment.post) {
        await Post.findByIdAndUpdate(
            savedComment.post,
            { $addToSet: { comments: savedComment._id } }
        );
    }

    return (await savedComment.populate('usuario', 'nombre avatarUrl'));
};

const getComment = async (commentId: string): Promise<ICommentModel | null> => {
    return await Comment.findById(commentId).populate('usuario', 'nombre avatarUrl');
};

const getAllComments = async (): Promise<ICommentModel[]> => {
    return await Comment.find().populate('usuario', 'nombre avatarUrl');
};

const updateComment = async (commentId: string, data: Partial<IComment>, userId: string, userRole: string): Promise<ICommentModel | null> => {
    const comment = await Comment.findById(commentId);
    if (!comment) return null;

    // Validar que el usuario sea el dueño del comentario o un admin
    if (comment.usuario.toString() !== userId && userRole !== 'admin') {
        throw new Error('Forbidden');
    }

    return await Comment.findByIdAndUpdate(commentId, data, { new: true }).populate('usuario', 'nombre avatarUrl');
};

const deleteComment = async (commentId: string, userId?: string, userRole?: string): Promise<ICommentModel | null> => {
    const comment = await Comment.findById(commentId);
    if (!comment) return null;

    // Validar permisos si se proporcionan userId y userRole (petición desde controlador)
    if (userId && userRole) {
        if (comment.usuario.toString() !== userId && userRole !== 'admin') {
            throw new Error('Forbidden');
        }
    }

    // 1. Desvincular del Usuario
    if (comment.usuario) {
        await Usuario.findByIdAndUpdate(comment.usuario, { $pull: { comments: commentId } });
    }

    // 2. Desvincular del Post
    if (comment.post) {
        await Post.findByIdAndUpdate(comment.post, { $pull: { comments: commentId } });
    }

    // 3. Eliminar el comentario
    return await Comment.findByIdAndDelete(commentId);
};

const getAllCommentsFromPost = async (postId: string): Promise<ICommentModel[]> => {
    return await Comment.find({ post: postId }).populate('usuario', 'nombre avatarUrl');
};

const deleteAllCommentsFromPost = async (postId: string): Promise<void> => {
    // 1. Encontrar todos los comments del post
    const comments = await Comment.find({ post: postId });

    // 2. Eliminar cada comment y desvincular (sin pasar userId para saltar el check de permisos)
    for (const comment of comments) {
        await deleteComment(comment._id.toString());
    }
};


export default { createComment, getComment, getAllComments, updateComment, deleteComment, getAllCommentsFromPost, deleteAllCommentsFromPost };