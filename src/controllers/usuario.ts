import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import UsuarioService from '../services/usuario';
import AuditService from '../services/audit';
import Logging from '../library/Logging';
import mongoose from 'mongoose';

const createUsuario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const savedUsuario = await UsuarioService.createUsuario(req.body);

    Logging.info(`[201] [usuario] User Registered | userId=${savedUsuario._id}`);

    return res.status(201).json(savedUsuario);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      Logging.warning(`[422] [usuario] Validation Error | message=${error.message}`);
      return res.status(422).json({ message: error.message });
    }

    if (error.code === 11000) {
      Logging.warning(`[409] [usuario] Duplicate User | message=Usuario ya existe`);
      return res.status(409).json({ message: 'Usuario ya existe' });
    }

    Logging.error(`[500] [usuario] Create User Failed | error=${error}`);
    return res.status(500).json({ error });
  }
};

const readUsuario = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const usuarioId = req.params.usuarioId;

  try {
    const rol = req.user?.rol;
    let usuario;

    if (rol === 'admin') {
      usuario = await UsuarioService.getUsuario(usuarioId);
      Logging.info(`[200] [usuario] Admin Fetch User | userId=${usuarioId}`);
    } else {
      usuario = await UsuarioService.getUsuarioBasic(usuarioId);
      Logging.info(`[200] [usuario] Basic Fetch User | userId=${usuarioId}`);
    }

    if (!usuario) {
      Logging.warning(`[404] [usuario] User Not Found | userId=${usuarioId}`);
      return res.status(404).json({ message: 'not found' });
    }

    const requesterId = req.user?.id;

    const Follow = require('../models/Follow').default;
    const follow = await Follow.findOne({ follower: requesterId, following: usuarioId });

    const responseData = usuario.toObject();
    responseData.followStatus = follow ? follow.status : null;

    Logging.info(
      `[200] [usuario] User Profile Retrieved | userId=${usuarioId} requesterId=${requesterId}`,
    );

    return res.status(200).json(responseData);
  } catch (error) {
    Logging.error(`[500] [usuario] Read User Failed | userId=${usuarioId} error=${error}`);
    return res.status(500).json({ error });
  }
};

const readAll = async (req: AuthRequest, res: Response) => {
  try {
    const rol = req.user?.rol;

    const search = req.query.search as string | undefined;
    const universidades = req.query.universidades as string | undefined;
    const grados = req.query.grados as string | undefined;
    const asignaturas = req.query.asignaturas as string | undefined;

    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    let result;

    if (rol === 'admin') {
      result = await UsuarioService.getAllUsuariosAdmin(
        search,
        universidades,
        grados,
        asignaturas,
        page,
        limit,
      );

      Logging.info(`[200] [usuario] Admin List Users | page=${page} limit=${limit}`);
    } else {
      result = await UsuarioService.getAllUsuarios(
        search,
        universidades,
        grados,
        asignaturas,
        page,
        limit,
      );

      Logging.info(`[200] [usuario] List Users | page=${page} limit=${limit}`);
    }

    return res.status(200).json(result);
  } catch (error) {
    Logging.error(`[500] [usuario] Read All Users Failed | error=${error}`);
    return res.status(500).json({ error });
  }
};

const updateUsuario = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const usuarioId = req.params.usuarioId;
  const admin = req.user;

  try {
    const updatedUsuario = await UsuarioService.updateUsuario(usuarioId, req.body);

    if (updatedUsuario) {
      Logging.info(`[200] [usuario] User Updated | userId=${usuarioId}`);

      // Log Auditoría si es un admin cambiando datos de otro (ej: rol)
      if (admin && admin.rol === 'admin' && admin.id !== usuarioId) {
        let detalles = 'Usuario actualizado';
        if (req.body.rol) detalles = `Rol cambiado a: ${req.body.rol}`;

        await AuditService.recordLog({
          admin: new mongoose.Types.ObjectId(admin.id) as any,
          accion: req.body.rol
            ? AuditService.AdminAction.CHANGE_ROLE
            : AuditService.AdminAction.UPDATE_USER,
          tipoObjetivo: 'user',
          objetivoId: usuarioId,
          detalles: detalles,
          ip: req.ip,
        });
      }

      return res.status(200).json(updatedUsuario);
    }

    Logging.warning(`[404] [usuario] Update User Not Found | userId=${usuarioId}`);
    return res.status(404).json({ message: 'not found' });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      Logging.warning(`[422] [usuario] Update Validation Error | userId=${usuarioId}`);
      return res.status(422).json({ message: error.message });
    }

    Logging.error(`[500] [usuario] Update User Failed | userId=${usuarioId} error=${error}`);
    return res.status(500).json({ error });
  }
};

const softDeleteUsuario = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const usuarioId = req.params.usuarioId;
  const admin = req.user;

  if (!admin) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  // IDOR Protection: Only the user themselves or an admin can delete the account
  if (usuarioId !== admin.id && admin.rol !== 'admin') {
    Logging.warning(
      `[403] [usuario] Forbidden Soft Delete | requesterId=${admin.id} targetId=${usuarioId}`,
    );
    return res.status(403).json({ message: 'No tienes permiso para desactivar esta cuenta' });
  }

  try {
    const usuario = await UsuarioService.softDeleteUsuario(usuarioId);

    if (usuario) {
      Logging.info(`[200] [usuario] Soft Delete | userId=${usuarioId}`);

      // Log Auditoría si es un admin desactivando la cuenta
      if (admin && admin.rol === 'admin' && admin.id !== usuarioId) {
        await AuditService.recordLog({
          admin: new mongoose.Types.ObjectId(admin.id) as any,
          accion: AuditService.AdminAction.BAN_USER,
          tipoObjetivo: 'user',
          objetivoId: usuarioId,
          detalles: `Cuenta desactivada por moderación`,
          ip: req.ip,
        });
      }

      return res.status(200).json({ message: 'Cuenta desactivada correctamente', usuario });
    }

    Logging.warning(`[404] [usuario] Soft Delete Not Found | userId=${usuarioId}`);
    return res.status(404).json({ message: 'not found' });
  } catch (error) {
    Logging.error(`[500] [usuario] Soft Delete Failed | userId=${usuarioId} error=${error}`);
    return res.status(500).json({ error });
  }
};

const recoveryUsuario = async (req: Request, res: Response, next: NextFunction) => {
  const usuarioId = req.params.usuarioId;

  try {
    const usuario = await UsuarioService.recoveryUsuario(usuarioId);

    if (usuario) {
      Logging.info(`[200] [usuario] Account Recovery | userId=${usuarioId}`);
      return res.status(200).json({ message: 'Cuenta recuperada correctamente', usuario });
    }

    Logging.warning(`[404] [usuario] Recovery Not Found | userId=${usuarioId}`);
    return res.status(404).json({ message: 'not found' });
  } catch (error) {
    Logging.error(`[500] [usuario] Recovery Failed | userId=${usuarioId} error=${error}`);
    return res.status(500).json({ error });
  }
};

const hardDeleteUsuario = async (req: Request, res: Response, next: NextFunction) => {
  const usuarioId = req.params.usuarioId;

  try {
    const usuario = await UsuarioService.hardDeleteUsuario(usuarioId);

    if (usuario) {
      Logging.info(`[200] [usuario] Hard Delete | userId=${usuarioId}`);
      return res.status(200).json({ message: 'Usuario eliminado permanentemente', usuario });
    }

    Logging.warning(`[404] [usuario] Hard Delete Not Found | userId=${usuarioId}`);
    return res.status(404).json({ message: 'not found' });
  } catch (error) {
    Logging.error(`[500] [usuario] Hard Delete Failed | userId=${usuarioId} error=${error}`);
    return res.status(500).json({ error });
  }
};

const toggleFollow = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const targetId = req.params.targetId;

  if (!userId) {
    Logging.warning(`[401] [follow] Unauthorized Toggle Follow`);
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!targetId) {
    Logging.warning(`[400] [follow] Missing TargetId | userId=${userId}`);
    return res.status(400).json({ message: 'targetId requerido' });
  }

  try {
    const result = await UsuarioService.toggleFollow(userId, targetId);

    Logging.info(`[200] [follow] Toggle Follow | userId=${userId} targetId=${targetId}`);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Forbidden') {
      Logging.warning(`[403] [follow] Forbidden Toggle Follow | userId=${userId}`);
      return res.status(403).json({ message: error.message });
    }

    Logging.error(`[400] [follow] Toggle Follow Failed | userId=${userId} error=${error.message}`);
    return res.status(400).json({ message: error.message || 'Error' });
  }
};

const acceptFollowRequest = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const followerId = req.params.followerId;

  if (!userId) {
    Logging.warning(`[401] [follow] Unauthorized Accept Request`);
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await UsuarioService.acceptFollowRequest(userId, followerId);

    Logging.info(`[200] [follow] Accept Request | userId=${userId} followerId=${followerId}`);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Forbidden') {
      Logging.warning(`[403] [follow] Forbidden Accept Request | userId=${userId}`);
      return res.status(403).json({ message: error.message });
    }

    Logging.error(`[400] [follow] Accept Request Failed | userId=${userId}`);
    return res.status(400).json({ message: error.message || 'Error' });
  }
};

const rejectFollowRequest = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const followerId = req.params.followerId;

  if (!userId) {
    Logging.warning(`[401] [follow] Unauthorized Reject Request`);
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await UsuarioService.rejectFollowRequest(userId, followerId);

    Logging.info(`[200] [follow] Reject Request | userId=${userId} followerId=${followerId}`);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Forbidden') {
      Logging.warning(`[403] [follow] Forbidden Reject Request | userId=${userId}`);
      return res.status(403).json({ message: error.message });
    }

    Logging.error(`[400] [follow] Reject Request Failed | userId=${userId}`);
    return res.status(400).json({ message: error.message || 'Error' });
  }
};

const getFollowers = async (req: AuthRequest, res: Response) => {
  const usuarioId = req.params.usuarioId;
  const isAdmin = req.user?.rol === 'admin';

  try {
    const result = await UsuarioService.getFollowers(usuarioId, isAdmin);

    Logging.info(`[200] [usuario] Get Followers | userId=${usuarioId}`);

    return result
      ? res.status(200).json(result)
      : res.status(404).json({ message: 'User not found' });
  } catch (error) {
    Logging.error(`[500] [usuario] Get Followers Failed | userId=${usuarioId}`);
    return res.status(500).json({ error });
  }
};

const getFollowing = async (req: AuthRequest, res: Response) => {
  const usuarioId = req.params.usuarioId;
  const isAdmin = req.user?.rol === 'admin';

  try {
    const result = await UsuarioService.getFollowing(usuarioId, isAdmin);

    Logging.info(`[200] [usuario] Get Following | userId=${usuarioId}`);

    return result
      ? res.status(200).json(result)
      : res.status(404).json({ message: 'User not found' });
  } catch (error) {
    Logging.error(`[500] [usuario] Get Following Failed | userId=${usuarioId}`);
    return res.status(500).json({ error });
  }
};

const removeFollower = async (req: AuthRequest, res: Response) => {
  const userId = req.params.usuarioId;
  const followerId = req.params.followerId;
  const requesterId = req.user?.id;
  const requesterRole = req.user?.rol;

  if (!requesterId || !requesterRole) {
    Logging.warning(`[401] [follow] Unauthorized Remove Follower`);
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await UsuarioService.removeFollower(
      userId,
      followerId,
      requesterId,
      requesterRole,
    );

    Logging.info(`[200] [follow] Remove Follower | userId=${userId} followerId=${followerId}`);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Forbidden') {
      Logging.warning(`[403] [follow] Forbidden Remove Follower`);
      return res.status(403).json({ message: 'Forbidden' });
    }

    Logging.error(`[400] [follow] Remove Follower Failed`);
    return res.status(400).json({ message: error.message });
  }
};

const unfollowUser = async (req: AuthRequest, res: Response) => {
  const userId = req.params.usuarioId;
  const targetId = req.params.targetId;
  const requesterId = req.user?.id;
  const requesterRole = req.user?.rol;

  if (!requesterId || !requesterRole) {
    Logging.warning(`[401] [follow] Unauthorized Unfollow`);
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await UsuarioService.unfollowUser(userId, targetId, requesterId, requesterRole);

    Logging.info(`[200] [follow] Unfollow User | userId=${userId} targetId=${targetId}`);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Forbidden') {
      Logging.warning(`[403] [follow] Forbidden Unfollow`);
      return res.status(403).json({ message: 'Forbidden' });
    }

    Logging.error(`[400] [follow] Unfollow Failed`);
    return res.status(400).json({ message: error.message });
  }
};

const assignGrado = async (req: AuthRequest, res: Response) => {
  const { usuarioId } = req.params;
  const { id: requesterId, rol: requesterRole } = req.user || {};

  // IDOR Protection: Only the user themselves or an admin can change this
  if (usuarioId !== requesterId && requesterRole !== 'admin') {
    Logging.warning(
      `[403] [usuario] Forbidden Assign Grado | requesterId=${requesterId} targetId=${usuarioId}`,
    );
    return res.status(403).json({ message: 'No tienes permiso para modificar este perfil' });
  }

  try {
    const usuario = await UsuarioService.assignGrado(usuarioId, req.body.gradoId);

    if (usuario) {
      Logging.info(`[200] [usuario] Assign Grado | userId=${req.params.usuarioId}`);
      return res.status(200).json(usuario);
    }

    Logging.warning(`[404] [usuario] Assign Grado Not Found`);
    return res.status(404).json({ message: 'not found' });
  } catch (error) {
    Logging.error(`[500] [usuario] Assign Grado Failed`);
    return res.status(500).json({ error });
  }
};

const setAsignaturas = async (req: AuthRequest, res: Response) => {
  const { usuarioId } = req.params;
  const { id: requesterId, rol: requesterRole } = req.user || {};

  // IDOR Protection: Only the user themselves or an admin can change this
  if (usuarioId !== requesterId && requesterRole !== 'admin') {
    Logging.warning(
      `[403] [usuario] Forbidden Set Asignaturas | requesterId=${requesterId} targetId=${usuarioId}`,
    );
    return res.status(403).json({ message: 'No tienes permiso para modificar este perfil' });
  }

  try {
    const usuario = await UsuarioService.setAsignaturas(usuarioId, req.body.asignaturas);

    if (usuario) {
      Logging.info(`[200] [usuario] Set Asignaturas | userId=${req.params.usuarioId}`);
      return res.status(200).json(usuario);
    }

    Logging.warning(`[404] [usuario] Set Asignaturas Not Found`);
    return res.status(404).json({ message: 'not found' });
  } catch (error) {
    Logging.error(`[500] [usuario] Set Asignaturas Failed`);
    return res.status(500).json({ error });
  }
};

const updateFcmToken = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { fcmToken } = req.body;

  if (!userId) {
    Logging.warning(`[401] [usuario] Unauthorized updateFcmToken`);
    return res.status(401).json({ message: 'No autenticado' });
  }

  try {
    const usuario = await UsuarioService.updateUsuario(userId, { fcmToken });
    if (!usuario) {
      Logging.warning(`[404] [usuario] updateFcmToken User Not Found | userId=${userId}`);
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    Logging.info(`[200] [usuario] FCM Token Updated | userId=${userId}`);
    return res.status(200).json(usuario);
  } catch (error) {
    Logging.error(`[500] [usuario] updateFcmToken Failed | userId=${userId} error=${error}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createUsuario,
  readUsuario,
  readAll,
  updateUsuario,
  softDeleteUsuario,
  hardDeleteUsuario,
  recoveryUsuario,
  toggleFollow,
  getFollowers,
  getFollowing,
  removeFollower,
  unfollowUser,
  assignGrado,
  setAsignaturas,
  acceptFollowRequest,
  rejectFollowRequest,
  updateFcmToken,
};
