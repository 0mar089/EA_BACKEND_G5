import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL = process.env.MONGO_URI;
const SERVER_PORT = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 1337;

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '2h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!MONGO_URL) throw new Error('Missing MONGO_URI in .env file');
if (!JWT_ACCESS_SECRET) throw new Error('Missing JWT_ACCESS_SECRET in .env file');
if (!JWT_REFRESH_SECRET) throw new Error('Missing JWT_REFRESH_SECRET in .env file');

export const config = {
    mongo: {
        url: MONGO_URL
    },
    server: {
        port: SERVER_PORT
    },
    jwt: {
        accessSecret: JWT_ACCESS_SECRET,
        refreshSecret: JWT_REFRESH_SECRET,
        accessExpiresIn: JWT_ACCESS_EXPIRES_IN,
        refreshExpiresIn: JWT_REFRESH_EXPIRES_IN
    },
    cookies: {
        refreshName: 'refreshToken',
        options: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
        }
    }
};
