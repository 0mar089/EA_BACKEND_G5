import mongoose from 'mongoose';
import Post, { IPostModel, IPost } from '../models/Post';
import Usuario from '../models/Usuario';
import Comment from '../models/Comment';
import NotificationService from './notification';
import { NotificationType } from '../models/Notification';
import Logging from '../library/Logging';

const getPostPopulate = (isAdmin: boolean = false) => [
  {
    path: 'usuario',
    select: 'nombre avatarUrl privado seguidores activo',
  },
  {
    path: 'comments',
    match: isAdmin ? {} : { activo: true },
    select: 'texto usuario createdAt likes activo',
    populate: [
      {
        path: 'usuario',
        select: 'nombre avatarUrl activo',
      },
      {
        path: 'likes',
        match: isAdmin ? {} : { activo: true },
        select: 'nombre avatarUrl',
      },
    ],
  },
  {
    path: 'likes',
    match: isAdmin ? {} : { activo: true },
    select: 'nombre avatarUrl',
  },
];

const createPost = async (data: Partial<IPost>): Promise<IPostModel | any> => {
  const post = new Post({
    _id: new mongoose.Types.ObjectId(),
    ...data,
  });

  const savedPost = await post.save();

  if (savedPost.usuario) {
    await Usuario.findByIdAndUpdate(savedPost.usuario, { $addToSet: { posts: savedPost._id } });
  }

  return await Post.findById(savedPost._id).populate(getPostPopulate(false));
};

const getPost = async (
  postId: string,
  requesterId?: string,
  isAdmin: boolean = false,
): Promise<any> => {
  const filter = isAdmin ? { _id: postId } : { _id: postId, activo: true };

  const post = await Post.findOne(filter).populate(getPostPopulate(isAdmin));

  if (!post) return null;

  // Verificar privacidad si no es admin y no es el dueño
  if (!isAdmin && post.usuario._id.toString() !== requesterId) {
    const author = post.usuario as any;

    if (author.privado) {
      const isFollowing = author.seguidores?.some((id: any) => id.toString() === requesterId);

      if (!isFollowing) {
        throw new Error('Esta cuenta es privada');
      }
    }
  }

  return post;
};

const getAllPosts = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  requesterId?: string,
  isAdmin: boolean = false,
): Promise<any> => {
  const filter: any = isAdmin ? {} : { activo: true };

  if (!isAdmin && requesterId) {
    const user = await Usuario.findById(requesterId);

    const following = user?.seguidos || [];

    const privateNotFollowed = await Usuario.find({
      privado: true,
      _id: { $nin: [...following, requesterId] },
    }).select('_id');

    const privateNotFollowedIds = privateNotFollowed.map((u) => u._id);

    filter.usuario = {
      $nin: privateNotFollowedIds,
    };
  }

  if (search) {
    filter.caption = {
      $regex: search,
      $options: 'i',
    };
  }

  const options = {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: getPostPopulate(isAdmin),
  };

  return await Post.paginate(filter, options);
};

const updatePost = async (
  postId: string,
  data: Partial<IPost>,
  userId: string,
  userRole: string,
): Promise<IPostModel | null> => {
  const post = await Post.findById(postId);

  if (!post) return null;

  // Validar que el usuario sea el dueño del post o un admin
  if (post.usuario.toString() !== userId && userRole !== 'admin') {
    throw new Error('Forbidden');
  }

  return await Post.findByIdAndUpdate(postId, data, { new: true }).populate(
    getPostPopulate(userRole === 'admin'),
  );
};

const deletePost = async (
  postId: string,
  userId: string,
  userRole: string,
): Promise<IPostModel | null> => {
  const post = await Post.findById(postId);

  if (!post) return null;

  // Validar que el usuario sea el dueño del post o un admin
  const isAdmin = userRole === 'admin';
  const isOwner = post.usuario.toString() === userId;

  if (!isAdmin && !isOwner) {
    throw new Error('Forbidden');
  }

  // 1. Encontrar todos los comentarios del post para limpiar referencias en usuarios
  const postComments = await Comment.find({ post: postId });
  const commentIds = postComments.map((c) => c._id);

  if (commentIds.length > 0) {
    // 2. Quitar las referencias de estos comentarios de los perfiles de los usuarios
    await Usuario.updateMany(
      { comments: { $in: commentIds } },
      { $pull: { comments: { $in: commentIds } } },
    );

    // 3. Borrar comentarios del post físicamente
    await Comment.deleteMany({ post: postId });
  }

  // quitar post del usuario
  await Usuario.updateMany({ posts: postId }, { $pull: { posts: postId } });

  // 5. Eliminar notificaciones relacionadas con el post
  await NotificationService.deleteNotificationsByPost(postId);

  // eliminar post
  return await Post.findByIdAndDelete(postId);
};

const getAllPostsFromUser = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  isAdmin: boolean = false,
): Promise<any> => {
  const filter: any = isAdmin ? { usuario: userId } : { usuario: userId, activo: true };

  const options = {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: getPostPopulate(isAdmin),
  };

  return await Post.paginate(filter, options);
};

//--- PUEDE QUE LO MUEVA AL USUARIO ---//

const deleteAllPostsFromUser = async (userId: string): Promise<void> => {
  const posts = await Post.find({ usuario: userId });

  const postIds = posts.map((p) => p._id);

  if (postIds.length > 0) {
    // 1. Encontrar todos los comentarios vinculados a esos posts
    const comments = await Comment.find({
      post: { $in: postIds },
    });

    const commentIds = comments.map((c) => c._id);

    if (commentIds.length > 0) {
      // 2. Limpiar referencias de esos comentarios en todos los usuarios
      await Usuario.updateMany(
        { comments: { $in: commentIds } },
        { $pull: { comments: { $in: commentIds } } },
      );

      // 3. Borrar comentarios físicos
      await Comment.deleteMany({
        post: { $in: postIds },
      });
    }

    // 4. Borrar posts físicos
    await Post.deleteMany({
      usuario: userId,
    });

    // 5. Borrar notificaciones relacionadas con esos posts
    await Promise.all(
      postIds.map((id) => NotificationService.deleteNotificationsByPost(id.toString())),
    );
  }

  // limpiar usuario
  await Usuario.updateOne({ _id: userId }, { $set: { posts: [] } });
};

const darleLike = async (postId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new Error('Invalid postId');
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid userId');
  }

  const post = await Post.findById(postId);

  if (!post) return null;

  const alreadyLiked = post.likes.some((id) => id.toString() === userId);

  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => id.toString() !== userId);

    // Eliminar notificación de like
    await NotificationService.deleteNotificationByCriteria({
      sender: userId,
      recipient: post.usuario.toString(),
      type: NotificationType.LIKE,
      post: post._id.toString(),
    });
  } else {
    post.likes.push(new mongoose.Types.ObjectId(userId));

    // Crear notificación de like
    Logging.info(
      `[Notification] Creating like notification: sender=${userId}, recipient=${post.usuario.toString()}, post=${post._id}`,
    );
    await NotificationService.createNotification({
      sender: userId,
      recipient: post.usuario.toString(),
      type: NotificationType.LIKE,
      post: post._id.toString(),
    });
  }

  await post.save();

  return await Post.findById(postId).populate(getPostPopulate(false));
};

const getFollowingPosts = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
): Promise<any> => {
  const usuario = await Usuario.findById(userId);

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  const seguidos = usuario.seguidos || [];

  const savedSet = new Set((usuario.postsGuardados || []).map((id: any) => id.toString()));

  // Incluir al propio usuario en su feed
  const authors = [...seguidos, userId];

  const filter = {
    usuario: { $in: authors },
    activo: true,
  };

  const options = {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: getPostPopulate(false),
    lean: true,
  };

  const result = await Post.paginate(filter, options);

  result.docs = result.docs.map((post: any) => ({
    ...post,
    isSaved: savedSet.has(post._id.toString()),
  }));

  return result;
};

const getDiscoveryPosts = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
): Promise<any> => {
  const usuario = await Usuario.findById(userId);

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  const savedSet = new Set((usuario.postsGuardados || []).map((id: any) => id.toString()));

  const seguidos = usuario.seguidos || [];

  const authorsToExclude = [...seguidos, userId];

  // Filtrar privados que no sigo
  const privateNotFollowed = await Usuario.find({
    privado: true,
    _id: { $nin: authorsToExclude },
  }).select('_id');

  const privateNotFollowedIds = privateNotFollowed.map((u) => u._id);

  const filter = {
    usuario: {
      $nin: [...authorsToExclude, ...privateNotFollowedIds],
    },
    activo: true,
  };

  const options = {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: getPostPopulate(false),
    lean: true,
  };

  const result = await Post.paginate(filter, options);

  result.docs = result.docs.map((post: any) => ({
    ...post,
    isSaved: savedSet.has(post._id.toString()),
  }));

  return result;
};

const toggleSavePost = async (userId: string, postId: string) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new Error('ID de post inválido');
  }

  const usuario = await Usuario.findById(userId);

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw new Error('Post no encontrado');
  }

  if (!post.activo) {
    throw new Error('Post no activo');
  }

  const postObjectId = new mongoose.Types.ObjectId(postId);

  if (!usuario.postsGuardados) {
    usuario.postsGuardados = [];
  }

  const index = usuario.postsGuardados.findIndex((id) => id.equals(postObjectId));

  let saved: boolean;

  if (index !== -1) {
    usuario.postsGuardados.splice(index, 1);
    saved = false;
  } else {
    usuario.postsGuardados.push(postObjectId);
    saved = true;
  }

  await usuario.save();

  return { saved };
};

const getSavedPosts = async (userId: string, page = 1, limit = 10) => {
  const usuario = await Usuario.findById(userId);

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  const savedSet = new Set((usuario.postsGuardados || []).map((id) => id.toString()));

  const result = await Post.paginate(
    {
      _id: { $in: usuario.postsGuardados || [] },
      activo: true,
    },
    {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: getPostPopulate(false),
      lean: true,
    },
  );

  result.docs = result.docs.map((post: any) => ({
    ...post,
    isSaved: savedSet.has(post._id.toString()),
  }));

  return result;
};

export default {
  createPost,
  getPost,
  getAllPosts,
  updatePost,
  deletePost,
  getAllPostsFromUser,
  deleteAllPostsFromUser,
  darleLike,
  getFollowingPosts,
  getDiscoveryPosts,
  toggleSavePost,
  getSavedPosts,
};
