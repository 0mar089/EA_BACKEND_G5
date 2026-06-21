import { describe, it, expect } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt';
//cambio
describe('JWT Utilities', () => {
  const userId = '60c72b2f9b1d8e25b8b9b8b9';
  const nombre = 'Laura';
  const email = 'laura@example.com';
  const rol = 'user';

  it('should generate a valid access token and verify it', () => {
    const token = generateAccessToken(userId, nombre, email, rol);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyAccessToken(token);
    expect(decoded.id).toBe(userId);
    expect(decoded.nombre).toBe(nombre);
    expect(decoded.email).toBe(email);
    expect(decoded.rol).toBe(rol);
  });

  it('should generate a valid refresh token and verify it', () => {
    const token = generateRefreshToken(userId, nombre, email, rol);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyRefreshToken(token);
    expect(decoded.id).toBe(userId);
    expect(decoded.nombre).toBe(nombre);
    expect(decoded.email).toBe(email);
    expect(decoded.rol).toBe(rol);
  });

  it('should throw an error for an invalid token', () => {
    expect(() => verifyAccessToken('invalid-token')).toThrow();
  });
});
