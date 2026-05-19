import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import UniMatchService from '../services/unimatch';
import UploadService from '../services/upload';
import Logging from '../library/Logging';

// ─── Discover ─────────────────────────────────────────────────────────────────

const discover = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const profiles = await UniMatchService.discoverProfiles(userId, limit);

    Logging.info(`[200] [unimatch/discover] Found ${profiles.length} profiles | userId=${userId}`);
    return res.status(200).json(profiles);
  } catch (error: any) {
    Logging.error(`[500] [unimatch/discover] ${error.message} | userId=${req.user?.id}`);
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
  } catch (error: any) {
    if (error.message === 'No puedes swipearte a ti mismo') {
      return res.status(400).json({ message: error.message });
    }
    Logging.error(`[500] [unimatch/swipe] ${error.message} | userId=${req.user?.id}`);
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
    const cloudResult: any = await UploadService.uploadImage(req.file.buffer);
    const photo = await UniMatchService.addPhoto(userId, cloudResult.secure_url);

    Logging.info(`[201] [unimatch/photos] Photo uploaded | userId=${userId} photoId=${photo._id}`);
    return res.status(201).json(photo);
  } catch (error: any) {
    Logging.error(`[500] [unimatch/photos] Upload failed | userId=${req.user?.id} error=${error}`);
    return res.status(500).json({ message: 'Error al subir la foto' });
  }
};

// ─── Get My Photos ────────────────────────────────────────────────────────────

const getMyPhotos = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const photos = await UniMatchService.getUserPhotos(userId);

    return res.status(200).json(photos);
  } catch (error: any) {
    Logging.error(`[500] [unimatch/photos] Get failed | userId=${req.user?.id} error=${error}`);
    return res.status(500).json({ message: 'Error al obtener las fotos' });
  }
};

// ─── Get User Photos ──────────────────────────────────────────────────────────

const getUserPhotos = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const photos = await UniMatchService.getUserPhotos(userId);

    return res.status(200).json(photos);
  } catch (error: any) {
    Logging.error(`[500] [unimatch/photos/:userId] Get failed | error=${error}`);
    return res.status(500).json({ message: 'Error al obtener las fotos' });
  }
};

// ─── Delete Photo ─────────────────────────────────────────────────────────────

const deletePhoto = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { photoId } = req.params;

    await UniMatchService.deletePhoto(photoId, userId);

    Logging.info(`[200] [unimatch/photos] Photo deleted | userId=${userId} photoId=${photoId}`);
    return res.status(200).json({ message: 'Foto eliminada' });
  } catch (error: any) {
    if (error.message === 'Foto no encontrada') {
      return res.status(404).json({ message: error.message });
    }
    Logging.error(`[500] [unimatch/photos] Delete failed | userId=${req.user?.id} error=${error}`);
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
  } catch (error: any) {
    Logging.error(`[500] [unimatch/photos/reorder] ${error.message} | userId=${req.user?.id}`);
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
  } catch (error: any) {
    Logging.error(`[500] [unimatch/accept-terms] ${error.message} | userId=${req.user?.id}`);
    return res.status(500).json({ message: 'Error al aceptar los términos' });
  }
};

// ─── Get Matches ──────────────────────────────────────────────────────────────

const getMatches = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const matches = await UniMatchService.getMatches(userId);

    return res.status(200).json(matches);
  } catch (error: any) {
    Logging.error(`[500] [unimatch/matches] ${error.message} | userId=${req.user?.id}`);
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
