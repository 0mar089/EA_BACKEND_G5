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
    
    return savedPost.populate('usuario', 'nombre avatarUrl');
};

const getPost = async (postId: string): Promise<IPostModel | null> => {
    return await Post.findById(postId)
        .populate('usuario', 'nombre avatarUrl')
        .populate({
          path: 'comments',
          select: 'texto usuario',
          populate: {
            path: 'usuario',
            select: 'nombre avatarUrl'
          }
        });
};

const getAllPosts = async (): Promise<IPostModel[]> => {
    return await Post.find()
        .populate('usuario', 'nombre avatarUrl')
        .populate({
          path: 'comments',
          select: 'texto usuario',
          populate: {
            path: 'usuario',
            select: 'nombre avatarUrl'
          }
        });
};

const updatePost = async (postId: string, data: Partial<IPost>, userId: string, userRole: string): Promise<IPostModel | null> => {
    const post = await Post.findById(postId);
    if (!post) return null;

    // Validar que el usuario sea el dueño del post o un admin
    if (post.usuario.toString() !== userId && userRole !== 'admin') {
        throw new Error('Forbidden');
    }

    return await Post.findByIdAndUpdate(postId, data, { new: true }).populate('usuario', 'nombre avatarUrl').populate('comments');
};

const deletePost = async (postId: string, userId: string, userRole: string): Promise<IPostModel | null> => {

    const post = await Post.findById(postId);

    if (!post) return null;

    // LOG DE SEGURIDAD (Míralo en tu terminal)
    console.log(`[ACL] Intentando borrar post ${postId}`);
    console.log(`[ACL] Autor del post: ${post.usuario}`);
    console.log(`[ACL] Usuario solicita: ${userId} (Rol: ${userRole})`);

    // Validar que el usuario sea el dueño del post o un admin
    const isAdmin = userRole === 'admin';
    const isOwner = post.usuario.toString() === userId;

    if (!isAdmin && !isOwner) {
        throw new Error('Forbidden');
    }

    // 1. Encontrar todos los comentarios del post para limpiar referencias en usuarios
    const postComments = await Comment.find({ post: postId });
    const commentIds = postComments.map(c => c._id);

    if (commentIds.length > 0) {
        // 2. Quitar las referencias de estos comentarios de los perfiles de los usuarios
        await Usuario.updateMany(
            { comments: { $in: commentIds } },
            { $pull: { comments: { $in: commentIds } } }
        );
        // 3. Borrar comentarios del post físicamente
        await Comment.deleteMany({ post: postId });
        console.log(`[CLEANUP] Eliminados ${commentIds.length} comentarios del post ${postId} y sus referencias de usuarios.`);
    }

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

    if (postIds.length > 0) {
        // 1. Encontrar todos los comentarios vinculados a esos posts
        const comments = await Comment.find({ post: { $in: postIds } });
        const commentIds = comments.map(c => c._id);

        if (commentIds.length > 0) {
            // 2. Limpiar referencias de esos comentarios en todos los usuarios
            await Usuario.updateMany(
                { comments: { $in: commentIds } },
                { $pull: { comments: { $in: commentIds } } }
            );
            // 3. Borrar comentarios físicos
            await Comment.deleteMany({ post: { $in: postIds } });
        }

        // 4. Borrar posts físicos
        await Post.deleteMany({ usuario: userId });
    }

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