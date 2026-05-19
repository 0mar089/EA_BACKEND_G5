import { NextFunction, Request, Response } from 'express';
import UniversidadService from '../services/universidad';
import Logging from '../library/Logging';

const createUniversidad = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const savedUniversidad = await UniversidadService.createUniversidad(req.body);

    Logging.info(`[201] [universidad] Universidad Created | universidadId=${savedUniversidad._id}`);

    return res.status(201).json(savedUniversidad);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      Logging.warning(`[422] [universidad] Validation Error | message=${error.message}`);

      return res.status(422).json({ message: error.message });
    }

    if (error.code === 11000) {
      Logging.warning(`[409] [universidad] Duplicate Universidad`);

      return res.status(409).json({ message: 'Universidad ya existe' });
    }

    Logging.error(`[500] [universidad] Create Failed | error=${error}`);

    return res.status(500).json({ error });
  }
};

const readUniversidad = async (req: Request, res: Response, next: NextFunction) => {
  const universidadId = req.params.universidadId;

  try {
    const universidad = await UniversidadService.getUniversidad(universidadId);

    if (!universidad) {
      Logging.warning(`[404] [universidad] Not Found | universidadId=${universidadId}`);

      return res.status(404).json({ message: 'not found' });
    }

    Logging.info(`[200] [universidad] Read Universidad | universidadId=${universidadId}`);

    return res.status(200).json(universidad);
  } catch (error) {
    Logging.error(`[500] [universidad] Read Failed | universidadId=${universidadId}`);

    return res.status(500).json({ error });
  }
};

const readAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pageRaw = req.query.page as string;
    const limitRaw = req.query.limit as string;

    const page = pageRaw ? parseInt(pageRaw) : 1;
    const limit = limitRaw ? parseInt(limitRaw) : 10;

    const search = (req.query.search as string) || '';

    if (page < 1 || limit < 1) {
      Logging.warning(`[400] [universidad] Invalid Pagination`);

      return res.status(400).json({
        message: 'page y limit deben ser mayores a 0',
      });
    }

    const universidades = await UniversidadService.getAllUniversidades(page, limit, search);

    Logging.info(
      `[200] [universidad] Read All Universidades | page=${page} limit=${limit} search=${search}`,
    );

    return res.status(200).json(universidades);
  } catch (error) {
    Logging.error(`[500] [universidad] Read All Failed`);

    return res.status(500).json({ error });
  }
};

const updateUniversidad = async (req: Request, res: Response, next: NextFunction) => {
  const universidadId = req.params.universidadId;

  try {
    const universidad = await UniversidadService.updateUniversidad(universidadId, req.body);

    if (!universidad) {
      Logging.warning(`[404] [universidad] Update Not Found | universidadId=${universidadId}`);

      return res.status(404).json({ message: 'not found' });
    }

    Logging.info(`[200] [universidad] Updated Universidad | universidadId=${universidadId}`);

    return res.status(200).json(universidad);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      Logging.warning(`[422] [universidad] Validation Error | universidadId=${universidadId}`);

      return res.status(422).json({ message: error.message });
    }

    if (error.code === 11000) {
      Logging.warning(`[409] [universidad] Duplicate Update | universidadId=${universidadId}`);

      return res.status(409).json({ message: 'Universidad ya existe' });
    }

    Logging.error(`[500] [universidad] Update Failed | universidadId=${universidadId}`);

    return res.status(500).json({ error });
  }
};

const deleteUniversidad = async (req: Request, res: Response, next: NextFunction) => {
  const universidadId = req.params.universidadId;

  try {
    const universidad = await UniversidadService.deleteUniversidad(universidadId);

    if (!universidad) {
      Logging.warning(`[404] [universidad] Delete Not Found | universidadId=${universidadId}`);

      return res.status(404).json({ message: 'not found' });
    }

    Logging.info(`[200] [universidad] Deleted Universidad | universidadId=${universidadId}`);

    return res.status(200).json({ message: 'deleted', universidad });
  } catch (error) {
    Logging.error(`[500] [universidad] Delete Failed | universidadId=${universidadId}`);

    return res.status(500).json({ error });
  }
};

export default {
  createUniversidad,
  readUniversidad,
  readAll,
  updateUniversidad,
  deleteUniversidad,
};
