import mongoose from 'mongoose';
import Usuario, { IUsuarioModel } from '../models/Usuario';
import Swipe, { SwipeType } from '../models/Swipe';
import UnimatchPhoto from '../models/UnimatchPhoto';
import Follow, { FollowStatus } from '../models/Follow';
import notificationService from './notification';
import { NotificationType } from '../models/Notification';
import Logging from '../library/Logging';

// ─── Discover Algorithm ───────────────────────────────────────────────────────

const discoverProfiles = async (userId: string, limit: number = 10) => {
  const currentUser = await Usuario.findById(userId).select('universidad grado asignaturas').lean();

  if (!currentUser) throw new Error('Usuario no encontrado');

  // Obtener IDs de usuarios ya swipeados hoy
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaySwipes = await Swipe.find({
    fromUser: userId,
    createdAt: { $gte: todayStart },
  })
    .select('toUser')
    .lean();

  const todaySwipedIds = todaySwipes.map((s) => s.toUser.toString());

  // Obtener TODOS los swipes del usuario (para el fallback de bucle)
  const allSwipes = await Swipe.find({ fromUser: userId }).select('toUser type').lean();
  const allSwipedIds = allSwipes.map((s) => s.toUser.toString());
  const dislikedIds = allSwipes.filter((s) => s.type === 'dislike').map((s) => s.toUser.toString());
  const likedIds = allSwipes.filter((s) => s.type === 'like').map((s) => s.toUser.toString());

  // Usuarios que tienen al menos una foto activa en UnimatchPhoto
  const usersWithPhotos = await UnimatchPhoto.distinct('userId', { activo: true });
  const usersWithPhotosIds = usersWithPhotos.map((id) => id.toString());

  // Base filter: activos, no yo, tienen fotos, aceptaron terms
  const excludeIds = [...todaySwipedIds, ...likedIds, userId].map(
    (id) => new mongoose.Types.ObjectId(id),
  );

  // Solo usuarios con fotos
  if (usersWithPhotosIds.length === 0) {
    return []; // No hay nadie con fotos
  }

  const baseFilter: mongoose.FilterQuery<IUsuarioModel> = {
    _id: {
      $in: usersWithPhotosIds.map((id) => new mongoose.Types.ObjectId(id)),
      $nin: excludeIds,
    },
    activo: true,
    hasAcceptedUnimatchTerms: true,
  };

  // ─── Prioridad 1: Similitud (misma universidad, grado o asignatura) ─────
  const similarityFilter: mongoose.FilterQuery<IUsuarioModel> = { ...baseFilter };
  const orConditions: mongoose.FilterQuery<IUsuarioModel>[] = [];

  if (currentUser.universidad) {
    orConditions.push({ universidad: currentUser.universidad });
  }
  if (currentUser.grado) {
    orConditions.push({ grado: currentUser.grado });
  }
  if (currentUser.asignaturas && currentUser.asignaturas.length > 0) {
    orConditions.push({ asignaturas: { $in: currentUser.asignaturas } });
  }

  let profiles: (Record<string, unknown> & { _id: mongoose.Types.ObjectId })[] = [];

  if (orConditions.length > 0) {
    similarityFilter.$or = orConditions;
    profiles = await Usuario.find(similarityFilter)
      .select('nombre avatarUrl descripcion universidad grado asignaturas')
      .populate('universidad', 'nombre')
      .populate('grado', 'nombre')
      .populate('asignaturas', 'nombre')
      .limit(limit)
      .lean();
  }

  // ─── Prioridad 2: Descubrimiento (0 cosas en común, no vistos) ──────────
  if (profiles.length < limit) {
    const alreadyFoundIds = profiles.map((p) => p._id.toString());
    const discoveryExclude = [...todaySwipedIds, ...alreadyFoundIds, userId];

    const discoveryFilter: mongoose.FilterQuery<IUsuarioModel> = {
      _id: {
        $in: usersWithPhotosIds.map((id) => new mongoose.Types.ObjectId(id)),
        $nin: discoveryExclude.map((id) => new mongoose.Types.ObjectId(id)),
      },
      activo: true,
      hasAcceptedUnimatchTerms: true,
    };

    // Excluir también los que ya fueron swipeados (no solo hoy)
    discoveryFilter._id.$nin = [...discoveryExclude, ...allSwipedIds].map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    const discoveryProfiles = await Usuario.find(discoveryFilter)
      .select('nombre avatarUrl descripcion universidad grado asignaturas')
      .populate('universidad', 'nombre')
      .populate('grado', 'nombre')
      .populate('asignaturas', 'nombre')
      .limit(limit - profiles.length)
      .lean();

    profiles = [...profiles, ...discoveryProfiles];
  }

  // ─── Prioridad 3: Bucle (usuarios con dislike previo, segunda oportunidad)
  if (profiles.length < limit && dislikedIds.length > 0) {
    const alreadyFoundIds = profiles.map((p) => p._id.toString());
    const loopExclude = [...todaySwipedIds, ...alreadyFoundIds, userId];

    const loopFilter: mongoose.FilterQuery<IUsuarioModel> = {
      _id: {
        $in: dislikedIds
          .filter((id) => !loopExclude.includes(id))
          .map((id) => new mongoose.Types.ObjectId(id)),
      },
      activo: true,
      hasAcceptedUnimatchTerms: true,
    };

    const loopProfiles = await Usuario.find(loopFilter)
      .select('nombre avatarUrl descripcion universidad grado asignaturas')
      .populate('universidad', 'nombre')
      .populate('grado', 'nombre')
      .populate('asignaturas', 'nombre')
      .limit(limit - profiles.length)
      .lean();

    profiles = [...profiles, ...loopProfiles];
  }

  // Adjuntar fotos a cada perfil
  const profileIds = profiles.map((p) => p._id);
  const photos = await UnimatchPhoto.find({ userId: { $in: profileIds }, activo: true })
    .sort({ order: 1 })
    .lean();

  const photoMap: Record<string, unknown[]> = {};
  for (const photo of photos) {
    const key = photo.userId.toString();
    if (!photoMap[key]) photoMap[key] = [];
    photoMap[key].push(photo);
  }

  return profiles.map((p) => ({
    ...p,
    unimatchPhotos: photoMap[p._id.toString()] || [],
  }));
};

// ─── Swipe Logic ──────────────────────────────────────────────────────────────

const recordSwipe = async (fromUserId: string, toUserId: string, type: SwipeType) => {
  if (fromUserId === toUserId) throw new Error('No puedes swipearte a ti mismo');

  // Upsert: si ya existía un swipe previo (del bucle de dislike), lo actualizamos
  await Swipe.findOneAndUpdate(
    { fromUser: fromUserId, toUser: toUserId },
    { fromUser: fromUserId, toUser: toUserId, type, createdAt: new Date() },
    { upsert: true, new: true },
  );

  // Si es like, comprobar match
  if (type === 'like') {
    const reciprocalLike = await Swipe.findOne({
      fromUser: toUserId,
      toUser: fromUserId,
      type: 'like',
    });

    if (reciprocalLike) {
      // ¡MATCH! Ejecutar auto-follow mutuo y notificar
      await handleMatch(fromUserId, toUserId);
      return { matched: true };
    }
  }

  return { matched: false };
};

// ─── Match Handler ────────────────────────────────────────────────────────────

const handleMatch = async (userAId: string, userBId: string) => {
  Logging.info(`[UniMatch] ¡Match entre ${userAId} y ${userBId}!`);

  // Auto-follow mutuo: A sigue a B
  await performAutoFollow(userAId, userBId);
  // Auto-follow mutuo: B sigue a A
  await performAutoFollow(userBId, userAId);

  // Notificar a ambos
  await notificationService.createNotification({
    recipient: userAId,
    sender: userBId,
    type: NotificationType.MATCH,
  });

  await notificationService.createNotification({
    recipient: userBId,
    sender: userAId,
    type: NotificationType.MATCH,
  });

  // Emitir evento de match por socket
  try {
    const { getIO } = require('../socket');
    const io = getIO();

    const userA = await Usuario.findById(userAId).select('nombre avatarUrl').lean();
    const userB = await Usuario.findById(userBId).select('nombre avatarUrl').lean();

    const userAPhotos = await UnimatchPhoto.find({ userId: userAId, activo: true })
      .sort({ order: 1 })
      .limit(1)
      .lean();
    const userBPhotos = await UnimatchPhoto.find({ userId: userBId, activo: true })
      .sort({ order: 1 })
      .limit(1)
      .lean();

    io.to(`user_${userAId}`).emit('unimatch_match', {
      matchedUser: {
        ...userB,
        unimatchPhoto: userBPhotos[0]?.imageUrl || userB?.avatarUrl,
      },
    });

    io.to(`user_${userBId}`).emit('unimatch_match', {
      matchedUser: {
        ...userA,
        unimatchPhoto: userAPhotos[0]?.imageUrl || userA?.avatarUrl,
      },
    });
  } catch (err) {
    Logging.warning(`[UniMatch] Error emitiendo socket de match: ${err}`);
  }
};

// ─── Auto Follow (reutiliza lógica existente) ─────────────────────────────────

const performAutoFollow = async (followerId: string, followingId: string) => {
  try {
    // Verificar si ya existe la relación
    const existing = await Follow.findOne({ follower: followerId, following: followingId });
    if (existing) {
      // Si está pendiente, aceptarla
      if (existing.status === FollowStatus.PENDING) {
        existing.status = FollowStatus.ACCEPTED;
        await existing.save();
        await Usuario.findByIdAndUpdate(followerId, { $addToSet: { seguidos: followingId } });
        await Usuario.findByIdAndUpdate(followingId, { $addToSet: { seguidores: followerId } });
      }
      return; // Ya se siguen
    }

    // Crear nueva relación aceptada directamente (bypass privacidad para match)
    const newFollow = new Follow({
      follower: followerId,
      following: followingId,
      status: FollowStatus.ACCEPTED,
    });
    await newFollow.save();

    await Usuario.findByIdAndUpdate(followerId, { $addToSet: { seguidos: followingId } });
    await Usuario.findByIdAndUpdate(followingId, { $addToSet: { seguidores: followerId } });
  } catch (err) {
    Logging.warning(`[UniMatch] Error en auto-follow ${followerId} -> ${followingId}: ${err}`);
  }
};

// ─── Photo Management ─────────────────────────────────────────────────────────

const addPhoto = async (userId: string, imageUrl: string) => {
  // Obtener el mayor order actual
  const lastPhoto = await UnimatchPhoto.findOne({ userId, activo: true })
    .sort({ order: -1 })
    .lean();

  const order = lastPhoto ? lastPhoto.order + 1 : 0;

  const photo = new UnimatchPhoto({
    userId,
    imageUrl,
    order,
  });

  return await photo.save();
};

const getUserPhotos = async (userId: string) => {
  return await UnimatchPhoto.find({ userId, activo: true }).sort({ order: 1 }).lean();
};

const deletePhoto = async (photoId: string, userId: string) => {
  const photo = await UnimatchPhoto.findOneAndDelete({ _id: photoId, userId });
  if (!photo) throw new Error('Foto no encontrada');
  return photo;
};

const reorderPhotos = async (userId: string, photoIds: string[]) => {
  const ops = photoIds.map((id, index) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(id), userId: new mongoose.Types.ObjectId(userId) },
      update: { $set: { order: index } },
    },
  }));

  await UnimatchPhoto.bulkWrite(ops);
  return await getUserPhotos(userId);
};

// ─── Accept Terms ─────────────────────────────────────────────────────────────

const acceptTerms = async (userId: string) => {
  return await Usuario.findByIdAndUpdate(userId, { hasAcceptedUnimatchTerms: true }, { new: true });
};

// ─── Get Matches ──────────────────────────────────────────────────────────────

const getMatches = async (userId: string) => {
  // Mis likes
  const myLikes = await Swipe.find({ fromUser: userId, type: 'like' }).select('toUser').lean();
  const myLikeIds = myLikes.map((s) => s.toUser.toString());

  if (myLikeIds.length === 0) return [];

  // Quién de ellos también me dio like
  const mutualLikes = await Swipe.find({
    fromUser: { $in: myLikeIds.map((id) => new mongoose.Types.ObjectId(id)) },
    toUser: userId,
    type: 'like',
  })
    .select('fromUser')
    .lean();

  const matchedUserIds = mutualLikes.map((s) => s.fromUser.toString());

  if (matchedUserIds.length === 0) return [];

  const users = await Usuario.find({
    _id: { $in: matchedUserIds.map((id) => new mongoose.Types.ObjectId(id)) },
    activo: true,
  })
    .select('nombre avatarUrl descripcion')
    .lean();

  const photos = await UnimatchPhoto.find({
    userId: { $in: matchedUserIds.map((id) => new mongoose.Types.ObjectId(id)) },
    activo: true,
  })
    .sort({ order: 1 })
    .lean();

  const photoMap: Record<string, string> = {};
  for (const photo of photos) {
    const key = photo.userId.toString();
    if (!photoMap[key]) photoMap[key] = photo.imageUrl;
  }

  return users.map(
    (u: { _id: mongoose.Types.ObjectId; avatarUrl?: string; [key: string]: unknown }) => ({
      ...u,
      unimatchPhoto: photoMap[u._id.toString()] || u.avatarUrl,
    }),
  );
};

export default {
  discoverProfiles,
  recordSwipe,
  addPhoto,
  getUserPhotos,
  deletePhoto,
  reorderPhotos,
  acceptTerms,
  getMatches,
};
