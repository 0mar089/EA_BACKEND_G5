import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { matomoService } from '../services/matomo';

export const matomoMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Inicia el temporizador para luego calcular el tiempo
  const start = Date.now();

  res.on('finish', () => {
    const isIgnored =
      req.originalUrl.startsWith('/api') ||
      req.originalUrl === '/ping' ||
      req.originalUrl.includes('favicon.ico');

    if (isIgnored) {
      return;
    }
    //Calcula el tiempo que ha tardado en responder la petición
    const duration = Date.now() - start;
    matomoService.trackRequest(req, duration);
  });

  next();
};
