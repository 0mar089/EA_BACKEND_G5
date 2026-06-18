import { describe, it, expect, vi } from 'vitest';
import { authenticateToken, checkRole, AuthRequest } from './auth';
import { Response, NextFunction } from 'express';
import * as jwtUtils from '../utils/jwt';
import jwt from 'jsonwebtoken';

vi.mock('../utils/jwt', () => ({
  verifyAccessToken: vi.fn(),
}));

describe('Auth Middleware', () => {
  describe('authenticateToken', () => {
    it('should return 401 if token is not provided', () => {
      const req = { headers: {} } as unknown as AuthRequest;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token requerido' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next and set req.user on valid token', () => {
      const mockUser = { id: '1', nombre: 'Laura', email: 'laura@example.com', rol: 'user' as const };
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue(mockUser);

      const req = {
        headers: { authorization: 'Bearer valid-token' },
      } as unknown as AuthRequest;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(req.user).toBe(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      vi.mocked(jwtUtils.verifyAccessToken).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const req = {
        headers: { authorization: 'Bearer invalid-token' },
      } as unknown as AuthRequest;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is expired', () => {
      vi.mocked(jwtUtils.verifyAccessToken).mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date());
      });

      const req = {
        headers: { authorization: 'Bearer expired-token' },
      } as unknown as AuthRequest;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access token expirado' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('checkRole', () => {
    it('should return 401 if user is not on request', () => {
      const req = {} as unknown as AuthRequest;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      const middleware = checkRole(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'No autenticado' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is not allowed', () => {
      const req = {
        user: { id: '1', nombre: 'Laura', email: 'laura@example.com', rol: 'user' as const },
      } as unknown as AuthRequest;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      const middleware = checkRole(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No tienes permisos suficientes para realizar esta acción',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user role is allowed', () => {
      const req = {
        user: { id: '1', nombre: 'Laura', email: 'laura@example.com', rol: 'admin' as const },
      } as unknown as AuthRequest;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      const middleware = checkRole(['admin']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
