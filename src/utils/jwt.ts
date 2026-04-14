import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { config } from "../config/config";
import { IJwtPayload } from "../models/JwtPayload";

// Genera el Access Token
export const generateAccessToken = (
    userId: string,
    nombre: string,
    email: string,
    rol: 'user' | 'admin'
) => {
    const payload: IJwtPayload = {
        id: userId,
        nombre,
        email,
        rol
    };
    return jwt.sign(payload, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn']
    });
};

// Genera el Refresh Token
export const generateRefreshToken = (
    userId: string,
    nombre: string,
    email: string,
    rol: 'user' | 'admin'
) => {
    const payload: IJwtPayload = {
        id: userId,
        nombre,
        email,
        rol
    };
    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn']
    });
};

// Verifica el Access Token
export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, config.jwt.accessSecret) as IJwtPayload;
};

// Verifica el Refresh Token
export const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, config.jwt.refreshSecret) as IJwtPayload;
};
