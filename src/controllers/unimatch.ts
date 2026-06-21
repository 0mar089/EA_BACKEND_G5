import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import UniMatchService from '../services/unimatch';
import UploadService from '../services/upload';
import Logging from '../library/Logging';
import AuditService from '../services/audit';
import mongoose from 'mongoose';

// ─── Discover ─────────────────────────────────────────────────────────────────

const discover = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const profiles = await UniMatchService.discoverProfiles(userId, limit);

    Logging.info(`[200] [unimatch/discover] Found ${profiles.length} profiles | userId=${userId}`);
    return res.status(200).json(profiles);
  } catch (error: unknown) {
    const message = error instanceof Error ? (error as Error).message : String(error);
    Logging.error(`[500] [unimatch/discover] ${message} | userId=${req.user?.id}`);
    return res.status(500).json({ message: 'Error al descubrir perfiles' });
  }
};

// ─── Swipe ────────────────────────────────────────────────────────────────────

const swipe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { toUserId, type } = req.body;

    if (!toUserId || !type) {
      return res.status(400).json({ message: 'toUserId y type son obligatorios' });
    }

    if (!['like', 'dislike'].includes(type)) {
      return res.status(400).json({ message: 'type debe ser "like" o "dislike"' });
    }

    const result = await UniMatchService.recordSwipe(userId, toUserId, type);

    Logging.info(
      `[200] [unimatch/swipe] ${type} | from=${userId} to=${toUserId} matched=${result.matched}`,
    );
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? (error as Error).message : String(error);
    if (message === 'No puedes swipearte a ti mismo') {
      return res.status(400).json({ message });
    }
    Logging.error(`[500] [unimatch/swipe] ${message} | userId=${req.user?.id}`);
    return res.status(500).json({ message: 'Error al registrar el swipe' });
  }
};

// ─── Upload Photo ─────────────────────────────────────────────────────────────

const uploadPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No se ha proporcionado ninguna imagen' });
    }

    // Reutilizar la subida a Cloudinary existente
    const cloudResult = (await UploadService.uploadImage(req.file.buffer)) as {
      secure_url: string;
      [key: string]: unknown;
    };
    const photo = await UniMatchService.addPhoto(userId, cloudResult.secure_url);

    Logging.info(`[201] [unimatch/photos] Photo uploaded | userId=${userId} photoId=${photo._id}`);
    return res.status(201).json(photo);
  } catch (error: unknown) {
    const message = error instanceof Error ? (error as Error).message : String(error);
    Logging.error(
      `[500] [unimatch/photos] Upload failed | userId=${req.user?.id} error=${message}`,
    );
    return res.status(500).json({ message: 'Error al subir la foto' });
  }
};

// ─── Get My Photos ────────────────────────────────────────────────────────────

const getMyPhotos = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const photos = await UniMatchService.getUserPhotos(userId);

    return res.status(200).json(photos);
  } catch (error: unknown) {
    const message = error instanceof Error ? (error as Error).message : String(error);
    Logging.error(`[500] [unimatch/photos] Get failed | userId=${req.user?.id} error=${message}`);
    return res.status(500).json({ message: 'Error al obtener las fotos' });
  }
};

// ─── Get User Photos ──────────────────────────────────────────────────────────

const getUserPhotos = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const photos = await UniMatchService.getUserPhotos(userId);

    return res.status(200).json(photos);
  } catch (error: unknown) {
    const message = error instanceof Error ? (error as Error).message : String(error);
    Logging.error(`[500] [unimatch/photos/:userId] Get failed | error=${message}`);
    return res.status(500).json({ message: 'Error al obtener las fotos' });
  }
};

// ─── Delete Photo ─────────────────────────────────────────────────────────────

const deletePhoto = async (req: AuthRequest, res: Response) => {
  try {
    const requesterId = req.user!.id;
    const requesterRole = req.user!.rol;
    const { photoId } = req.params;

    // Si es admin, borramos sin userId (cualquier foto). Si no, pasamos su userId.
    const photo = await UniMatchService.deletePhoto(photoId, requesterRole === 'admin' ? undefined : requesterId);

    // Si el que lo borra es admin, registrar en auditoría
    if (requesterRole === 'admin') {
      await AuditService.recordLog({
        admin: new mongoose.Types.ObjectId(requesterId) as any,
        accion: AuditService.AdminAction.DELETE_POST, // Reusamos DELETE_POST para eliminación de contenido general
        tipoObjetivo: 'user',
        objetivoId: photo.userId.toString(),
        detalles: `Eliminó foto de UniMatch (ID de Foto: ${photoId}) del usuario ${photo.userId}`,
        metadata: { photoId, targetUserId: photo.userId },
      });
      Logging.info(`[200] [unimatch/photos] Admin deleted photo | adminId=${requesterId} photoId=${photoId} ownerId=${photo.userId}`);
    } else {
      Logging.info(`[200] [unimatch/photos] User deleted photo | userId=${requesterId} photoId=${photoId}`);
    }

    return res.status(200).json({ message: 'Foto eliminada' });
  } catch (error: unknown) {
    const message = error instanceof Error ? (error as Error).message : String(error);
    if (message === 'Foto no encontrada') {
      return res.status(404).json({ message });
    }
    Logging.error(`[500] [unimatch/photos] Delete failed | userId=${req.user?.id} error=${message}`);
    return res.status(500).json({ message: 'Error al eliminar la foto' });
  }
};

// ─── Reorder Photos ───────────────────────────────────────────────────────────

const reorderPhotos = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { photoIds } = req.body;

    if (!photoIds || !Array.isArray(photoIds)) {
      return res.status(400).json({ message: 'photoIds debe ser un array' });
    }

    const photos = await UniMatchService.reorderPhotos(userId, photoIds);

    Logging.info(`[200] [unimatch/photos/reorder] Reordered | userId=${userId}`);
    return res.status(200).json(photos);
  } catch (error: unknown) {
    const message = error instanceof Error ? (error as Error).message : String(error);
    Logging.error(`[500] [unimatch/photos/reorder] ${message} | userId=${req.user?.id}`);
    return res.status(500).json({ message: 'Error al reordenar las fotos' });
  }
};

// ─── Accept Terms ─────────────────────────────────────────────────────────────

const acceptTerms = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await UniMatchService.acceptTerms(userId);

    Logging.info(`[200] [unimatch/accept-terms] Terms accepted | userId=${userId}`);
    return res.status(200).json(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? (error as Error).message : String(error);
    Logging.error(`[500] [unimatch/accept-terms] ${message} | userId=${req.user?.id}`);
    return res.status(500).json({ message: 'Error al aceptar los términos' });
  }
};

// ─── Get Matches ──────────────────────────────────────────────────────────────

const getMatches = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const matches = await UniMatchService.getMatches(userId);

    return res.status(200).json(matches);
  } catch (error: unknown) {
    const message = error instanceof Error ? (error as Error).message : String(error);
    Logging.error(`[500] [unimatch/matches] ${message} | userId=${req.user?.id}`);
    return res.status(500).json({ message: 'Error al obtener los matches' });
  }
};

export default {
  discover,
  swipe,
  uploadPhoto,
  getMyPhotos,
  getUserPhotos,
  deletePhoto,
  reorderPhotos,
  acceptTerms,
  getMatches,
};
