import mongoose from 'mongoose';
import Post, { IPostModel, IPost } from '../models/Post';
import Usuario from '../models/Usuario';
import Comment from '../models/Comment';

const createPost = async (data: Partial<IPost>): Promise<IPostModel> => {
    const post = new Post({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });

    const savedPost = await post.save();

    if (savedPost.usuario) {
        await Usuario.findByIdAndUpdate(
            savedPost.usuario,
            { $addToSet: { posts: savedPost._id } }
        );
    }

    return savedPost;
};

const getPost = async (postId: string): Promise<IPostModel | null> => {
    return await Post.findById(postId)
        .populate('usuario', 'nombre avatarUrl')
};

const getAllPosts = async (): Promise<IPostModel[]> => {
    return await Post.find()
        .populate('usuario', 'nombre avatarUrl')
};

const updatePost = async (postId: string, data: Partial<IPost>): Promise<IPostModel | null> => {
    return await Post.findByIdAndUpdate(postId, data, { new: true }).populate('usuario', 'nombre avatarUrl').populate('comments');
};

const deletePost = async (postId: string, userId: string, userRole: string): Promise<IPostModel | null> => {

    const post = await Post.findById(postId);

    if (!post) return null;

    // Validar que el usuario sea el dueño del post o un admin
    if (post.usuario.toString() !== userId && userRole !== 'admin') {
        throw new Error('Forbidden');
    }

    //  borrar comentarios del post
    await Comment.deleteMany({ post: postId });

    //  quitar post del usuario
    await Usuario.updateMany(
        { posts: postId },
        { $pull: { posts: postId } }
    );

    // eliminar post
    return await Post.findByIdAndDelete(postId);
};

const getAllPostsFromUser = async (userId: string): Promise<IPostModel[]> => {
    return await Post.find({ usuario: userId })
        .select('-usuario') // Excluir el campo 'usuario' para evitar redundancia
}

//--- PUEDE QUE LO MUEVA AL USUARIO ---//

const deleteAllPostsFromUser = async (userId: string): Promise<void> => {
    const posts = await Post.find({ usuario: userId });

    const postIds = posts.map(p => p._id);

    // borrar comentarios en batch
    await Comment.deleteMany({ post: { $in: postIds } });

    // borrar posts en batch
    await Post.deleteMany({ usuario: userId });

    // limpiar usuario
    await Usuario.updateOne(
        { _id: userId },
        { $set: { posts: [] } }
    );
}


const darleLike = async (postId: string, userId: string) => {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
        throw new Error('Invalid postId');
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid userId');
    }

    const post = await Post.findById(postId);
    if (!post) return null;

    const alreadyLiked = post.likes.some(
        (id) => id.toString() === userId
    );

    if (alreadyLiked) {
        post.likes = post.likes.filter(
            (id) => id.toString() !== userId
        );
    } else {
        post.likes.push(new mongoose.Types.ObjectId(userId));
    }

    await post.save();

    return Post.findById(postId)
        .populate('usuario', 'nombre avatarUrl');
};


export default { createPost, getPost, getAllPosts, updatePost, deletePost, getAllPostsFromUser, deleteAllPostsFromUser, darleLike };