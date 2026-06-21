import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import GradoService from '../services/grado';
import Logging from '../library/Logging';

const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

const createGrado = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const savedGrado = await GradoService.createGrado(req.body);

    Logging.info(`[201] [grado] Created | gradoId=${savedGrado._id}`);

    return res.status(201).json(savedGrado);
  } catch (error: unknown) {
    if ((error as Error).name === 'ValidationError') {
      Logging.warning(`[422] [grado] Validation Error | message=${(error as Error).message}`);
      return res.status(422).json({
        message: (error as Error).message,
      });
    }

    if ((error as { code?: number }).code === 11000) {
      Logging.warning(`[409] [grado] Duplicate | message=El grado ya existe`);
      return res.status(409).json({
        message: 'El grado ya existe',
      });
    }

    Logging.error(`[500] [grado] Create Failed | error=${error}`);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

const readGrado = async (req: Request, res: Response, next: NextFunction) => {
  const gradoId = req.params.gradoId;

  if (!isValidObjectId(gradoId)) {
    Logging.warning(`[400] [grado] Invalid ID | gradoId=${gradoId}`);
    return res.status(400).json({
      message: 'ID de grado inválido',
    });
  }

  try {
    const grado = await GradoService.getGrado(gradoId);

    if (!grado) {
      Logging.warning(`[404] [grado] Not Found | gradoId=${gradoId}`);
      return res.status(404).json({
        message: 'not found',
      });
    }

    Logging.info(`[200] [grado] Retrieved | gradoId=${gradoId}`);

    return res.status(200).json(grado);
  } catch (error) {
    Logging.error(`[500] [grado] Read Failed | gradoId=${gradoId}`);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

const readAllGrados = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const grados = await GradoService.getAllGrados();

    Logging.info(`[200] [grado] List All`);

    return res.status(200).json(grados);
  } catch (error) {
    Logging.error(`[500] [grado] List Failed`);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

const readGradosByUniversidad = async (req: Request, res: Response, next: NextFunction) => {
  const universidadId = req.params.universidadId;

  if (!isValidObjectId(universidadId)) {
    Logging.warning(`[400] [grado] Invalid Universidad ID | universidadId=${universidadId}`);
    return res.status(400).json({
      message: 'ID de universidad inválido',
    });
  }

  try {
    const grados = await GradoService.getGradosByUniversidad(universidadId);

    Logging.info(`[200] [grado] By Universidad | universidadId=${universidadId}`);

    return res.status(200).json(grados);
  } catch (error) {
    Logging.error(`[500] [grado] By Universidad Failed | universidadId=${universidadId}`);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

const updateGrado = async (req: Request, res: Response, next: NextFunction) => {
  const gradoId = req.params.gradoId;

  if (!isValidObjectId(gradoId)) {
    Logging.warning(`[400] [grado] Invalid Update ID | gradoId=${gradoId}`);
    return res.status(400).json({
      message: 'ID de grado inválido',
    });
  }

  try {
    const grado = await GradoService.updateGrado(gradoId, req.body);

    if (!grado) {
      Logging.warning(`[404] [grado] Update Not Found | gradoId=${gradoId}`);
      return res.status(404).json({
        message: 'not found',
      });
    }

    Logging.info(`[200] [grado] Updated | gradoId=${gradoId}`);

    return res.status(200).json(grado);
  } catch (error: unknown) {
    if ((error as Error).name === 'ValidationError') {
      Logging.warning(`[422] [grado] Validation Error | gradoId=${gradoId}`);
      return res.status(422).json({
        message: (error as Error).message,
      });
    }

    if ((error as { code?: number }).code === 11000) {
      Logging.warning(`[409] [grado] Duplicate Update | gradoId=${gradoId}`);
      return res.status(409).json({
        message: 'El grado ya existe',
      });
    }

    Logging.error(`[500] [grado] Update Failed | gradoId=${gradoId}`);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

const deleteGrado = async (req: Request, res: Response, next: NextFunction) => {
  const gradoId = req.params.gradoId;

  if (!isValidObjectId(gradoId)) {
    Logging.warning(`[400] [grado] Invalid Delete ID | gradoId=${gradoId}`);
    return res.status(400).json({
      message: 'ID de grado inválido',
    });
  }

  try {
    const grado = await GradoService.deleteGrado(gradoId);

    if (!grado) {
      Logging.warning(`[404] [grado] Delete Not Found | gradoId=${gradoId}`);
      return res.status(404).json({
        message: 'not found',
      });
    }

    Logging.info(`[200] [grado] Deleted | gradoId=${gradoId}`);

    return res.status(200).json({
      message: 'deleted',
    });
  } catch (error) {
    Logging.error(`[500] [grado] Delete Failed | gradoId=${gradoId}`);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

const readAsignaturasByGrado = async (req: Request, res: Response, next: NextFunction) => {
  const gradoId = req.params.gradoId;

  if (!isValidObjectId(gradoId)) {
    Logging.warning(`[400] [grado] Invalid Asignaturas ID | gradoId=${gradoId}`);
    return res.status(400).json({
      message: 'ID de grado inválido',
    });
  }

  try {
    const asignaturas = await GradoService.getAsignaturasByGrado(gradoId);

    Logging.info(`[200] [grado] Asignaturas By Grado | gradoId=${gradoId}`);

    return res.status(200).json(asignaturas);
  } catch (error) {
    Logging.error(`[500] [grado] Asignaturas Failed | gradoId=${gradoId}`);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export default {
  createGrado,
  readGrado,
  readGradosByUniversidad,
  updateGrado,
  deleteGrado,
  readAsignaturasByGrado,
  readAllGrados,
};
