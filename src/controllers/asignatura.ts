import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import AsignaturaService from '../services/asignatura';
import Logging from '../library/Logging';

const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

const createAsignatura = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const savedAsignatura = await AsignaturaService.createAsignatura(req.body);

    Logging.info(`[201] [asignatura] Created | asignaturaId=${savedAsignatura._id}`);

    return res.status(201).json(savedAsignatura);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      Logging.warning(`[422] [asignatura] Validation Error | message=${error.message}`);
      return res.status(422).json({ message: error.message });
    }

    if (error.code === 11000) {
      Logging.warning(`[409] [asignatura] Duplicate Entry | name=${req.body?.nombre}`);
      return res.status(409).json({ message: 'La asignatura ya existe' });
    }

    Logging.error(`[500] [asignatura] Create Failed | error=${error}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const readAsignatura = async (req: Request, res: Response, next: NextFunction) => {
  const asignaturaId = req.params.asignaturaId;

  if (!isValidObjectId(asignaturaId)) {
    Logging.warning(`[400] [asignatura] Invalid ID | asignaturaId=${asignaturaId}`);
    return res.status(400).json({ message: 'ID de asignatura inválido' });
  }

  try {
    const asignatura = await AsignaturaService.getAsignatura(asignaturaId);

    if (!asignatura) {
      Logging.warning(`[404] [asignatura] Not Found | asignaturaId=${asignaturaId}`);
      return res.status(404).json({ message: 'not found' });
    }

    Logging.info(`[200] [asignatura] Retrieved | asignaturaId=${asignaturaId}`);

    return res.status(200).json(asignatura);
  } catch (error) {
    Logging.error(`[500] [asignatura] Read Failed | asignaturaId=${asignaturaId}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const readAllAsignaturas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asignaturas = await AsignaturaService.getAllAsignaturas();

    Logging.info(`[200] [asignatura] List All`);

    return res.status(200).json(asignaturas);
  } catch (error) {
    Logging.error(`[500] [asignatura] Read All Failed`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const readAsignaturasByGrado = async (req: Request, res: Response, next: NextFunction) => {
  const gradoId = req.params.gradoId;

  if (!isValidObjectId(gradoId)) {
    Logging.warning(`[400] [asignatura] Invalid Grado ID | gradoId=${gradoId}`);
    return res.status(400).json({ message: 'ID de grado inválido' });
  }

  try {
    const asignaturas = await AsignaturaService.getAsignaturasByGrado(gradoId);

    Logging.info(`[200] [asignatura] By Grado | gradoId=${gradoId}`);

    return res.status(200).json(asignaturas);
  } catch (error) {
    Logging.error(`[500] [asignatura] By Grado Failed | gradoId=${gradoId}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateAsignatura = async (req: Request, res: Response, next: NextFunction) => {
  const asignaturaId = req.params.asignaturaId;

  if (!isValidObjectId(asignaturaId)) {
    Logging.warning(`[400] [asignatura] Invalid Update ID | asignaturaId=${asignaturaId}`);
    return res.status(400).json({ message: 'ID de asignatura inválido' });
  }

  try {
    const asignatura = await AsignaturaService.updateAsignatura(asignaturaId, req.body);

    if (!asignatura) {
      Logging.warning(`[404] [asignatura] Update Not Found | asignaturaId=${asignaturaId}`);
      return res.status(404).json({ message: 'not found' });
    }

    Logging.info(`[200] [asignatura] Updated | asignaturaId=${asignaturaId}`);

    return res.status(200).json(asignatura);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      Logging.warning(`[422] [asignatura] Update Validation Error | asignaturaId=${asignaturaId}`);
      return res.status(422).json({ message: error.message });
    }

    if (error.code === 11000) {
      Logging.warning(`[409] [asignatura] Duplicate Update | asignaturaId=${asignaturaId}`);
      return res.status(409).json({ message: 'La asignatura ya existe' });
    }

    Logging.error(`[500] [asignatura] Update Failed | asignaturaId=${asignaturaId}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteAsignatura = async (req: Request, res: Response, next: NextFunction) => {
  const asignaturaId = req.params.asignaturaId;

  if (!isValidObjectId(asignaturaId)) {
    Logging.warning(`[400] [asignatura] Invalid Delete ID | asignaturaId=${asignaturaId}`);
    return res.status(400).json({ message: 'ID de asignatura inválido' });
  }

  try {
    const asignatura = await AsignaturaService.deleteAsignatura(asignaturaId);

    if (!asignatura) {
      Logging.warning(`[404] [asignatura] Delete Not Found | asignaturaId=${asignaturaId}`);
      return res.status(404).json({ message: 'not found' });
    }

    Logging.info(`[200] [asignatura] Deleted | asignaturaId=${asignaturaId}`);

    return res.status(200).json({ message: 'deleted' });
  } catch (error) {
    Logging.error(`[500] [asignatura] Delete Failed | asignaturaId=${asignaturaId}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createAsignatura,
  readAsignatura,
  readAsignaturasByGrado,
  updateAsignatura,
  deleteAsignatura,
  readAllAsignaturas,
};
