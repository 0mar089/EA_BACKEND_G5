import Usuario, { IUsuarioModel } from '../models/Usuario';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

// Valida las credenciales de un usuario.
export const validateUserCredentials = async (email: string, password: string): Promise<IUsuarioModel | null> => {
    const usuario = await Usuario.findOne({ email }).select('+password');
    if (!usuario) return null;

    const isMatch = await usuario.comparePassword(password);
    if (!isMatch) return null;

    return usuario;
};

// Genera el par de tokens (access y refresh) para un usuario.
export const getTokens = (usuario: IUsuarioModel) => {
    const accessToken = generateAccessToken(
        String(usuario._id),
        usuario.nombre,
        usuario.email,
        usuario.rol
    );
    const refreshToken = generateRefreshToken(
        String(usuario._id),
        usuario.nombre,
        usuario.email,
        usuario.rol
    );

    return { accessToken, refreshToken };
};

// Refresca la sesión del usuario utilizando un Refresh Token.
export const refreshUserSession = async (incomingRefreshToken: string) => {
    try {
        const payload = verifyRefreshToken(incomingRefreshToken);
        
        if (!payload || !payload.id) {
            throw new Error('Refresh token incompleto');
        }

        const usuario = await Usuario.findById(payload.id);

        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        return getTokens(usuario);
    } catch (error) {
        throw new Error('Refresh token inválido o expirado');
    }
};

export default {
    validateUserCredentials,
    getTokens,
    refreshUserSession
};
