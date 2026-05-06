import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { verifyAccessToken } from './utils/jwt';
import { saveMessage } from './services/chat';
import Logging from './library/Logging';

let io: SocketServer;

export const initSocket = (httpServer: HttpServer) => {
    io = new SocketServer(httpServer, {
        cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    // ── Middleware de autenticación ─────────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('No autorizado'));
        try {
            const decoded = verifyAccessToken(token);
            (socket as any).userId = decoded.id;
            next();
        } catch {
            next(new Error('Token inválido'));
        }
    });

    // ── Conexión ────────────────────────────────────────────────────────────
    io.on('connection', (socket) => {
        const userId: string = (socket as any).userId;
        Logging.info(`[Socket] Conectado: ${userId}`);

        // Sala personal para recibir mensajes
        socket.join(`user_${userId}`);

        // ── Enviar mensaje ──────────────────────────────────────────────────
        socket.on('send_message', async ({ destinatarioId, contenido }) => {
            if (!destinatarioId || !contenido?.trim()) return;
            try {
                const msg = await saveMessage(userId, destinatarioId, contenido.trim());
                // Emitir al destinatario
                io.to(`user_${destinatarioId}`).emit('receive_message', msg);
                // Confirmar al remitente (para reflejar en su UI)
                socket.emit('message_sent', msg);
            } catch (err) {
                Logging.error(`[Socket] Error guardando mensaje: ${err}`);
                socket.emit('message_error', { message: 'Error enviando el mensaje' });
            }
        });

        // ── Typing indicators ───────────────────────────────────────────────
        socket.on('typing', ({ destinatarioId }) => {
            io.to(`user_${destinatarioId}`).emit('user_typing', { userId });
        });
        socket.on('stop_typing', ({ destinatarioId }) => {
            io.to(`user_${destinatarioId}`).emit('user_stop_typing', { userId });
        });

        socket.on('disconnect', () => {
            Logging.info(`[Socket] Desconectado: ${userId}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io no ha sido inicializado');
    }
    return io;
};
