import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../utils/jwt";
import { IJwtPayload } from "../models/JwtPayload";

export interface AuthRequest extends Request {
  user?: IJwtPayload;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"]; // Para leer el header de la petición
  const token = authHeader && authHeader.split(" ")[1]; // Separa el token del header ("Bearer TOKEN")

  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    const decoded = verifyAccessToken(token); // Verifica el access token
    req.user = decoded;
    next(); // Si todo está bien, pasa a la siguiente ruta
  } catch (err: any) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Access token expirado" });
    }
    return res.status(401).json({ message: "Token inválido" });
  }
};

export const checkRole = (allowedRoles: ('user' | 'admin')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ message: "No tienes permisos suficientes para realizar esta acción" });
    }

    next();
  };
};
