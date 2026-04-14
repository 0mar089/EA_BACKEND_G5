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

    return savedComment;
};

const getComment = async (commentId: string): Promise<ICommentModel | null> => {
    return await Comment.findById(commentId).populate('usuario', 'nombre avatarUrl');
};

const getAllComments = async (): Promise<ICommentModel[]> => {
    return await Comment.find().populate('usuario', 'nombre avatarUrl');
};

const updateComment = async (commentId: string, data: Partial<IComment>): Promise<ICommentModel | null> => {
    return await Comment.findByIdAndUpdate(commentId, data, { new: true }).populate('usuario', 'nombre avatarUrl');
};

const deleteComment = async (commentId: string): Promise<ICommentModel | null> => {
    // 1. Desvincular a todos los usuarios de este comment
    await Usuario.updateMany({ comment: commentId }, { comment: null });
    
    // 2. Eliminar el comment
    return await Comment.findByIdAndDelete(commentId);
};

const getAllCommentsFromPost = async (postId: string): Promise<ICommentModel[]> => {
    return await Comment.find({ post: postId }).populate('usuario', 'nombre avatarUrl');
}

const deleteAllCommentsFromPost = async (postId: string): Promise<void> => {
    // 1. Encontrar todos los comments del usuario
    const comments = await Comment.find({ usuario: postId });
    
    // 2. Eliminar cada comment y desvincular a los usuarios
    for (const comment of comments) {
        await deleteComment(comment._id.toString());
    }
}


export default { createComment, getComment, getAllComments, updateComment, deleteComment, getAllCommentsFromPost, deleteAllCommentsFromPost };