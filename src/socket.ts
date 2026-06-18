import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { verifyAccessToken } from './utils/jwt';
import { saveMessage, deleteMessages, reactToMessage, filterMessageForUser, saveGroupMessage } from './services/chat';
import GroupChat from './models/GroupChat';
import Usuario from './models/Usuario';
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
        socket.on('send_message', async ({ destinatarioId, contenido, postId, parentMessageId, isGroup }) => {
            Logging.info(`[Socket] Mensaje recibido de ${userId} para ${destinatarioId} | isGroup: ${isGroup} | postId: ${postId} | parent: ${parentMessageId}`);
            if (!destinatarioId || (!contenido?.trim() && !postId)) {
                Logging.warning(`[Socket] Mensaje rechazado: falta destinatario o contenido/postId`);
                return;
            }
            try {
                if (isGroup) {
                    const msg = await saveGroupMessage(userId, destinatarioId, contenido?.trim() || '', postId, parentMessageId);
                    
                    const group = await GroupChat.findById(destinatarioId);
                    if (group) {
                        for (const memberId of group.miembros) {
                            const memberIdStr = memberId.toString();
                            const filtered = filterMessageForUser(msg, memberIdStr);
                            io.to(`user_${memberIdStr}`).emit('receive_message', {
                                ...filtered,
                                grupo: destinatarioId
                            });
                        }
                    }
                } else {
                    const msg = await saveMessage(userId, destinatarioId, contenido?.trim() || '', postId, parentMessageId);
                    
                    // Filtrar para el destinatario
                    const filteredForDest = filterMessageForUser(msg, destinatarioId);
                    io.to(`user_${destinatarioId}`).emit('receive_message', filteredForDest);
                    
                    // Filtrar para el remitente
                    const filteredForSender = filterMessageForUser(msg, userId);
                    socket.emit('message_sent', filteredForSender);
                }
            } catch (err) {
                Logging.error(`[Socket] Error guardando mensaje: ${err}`);
                socket.emit('message_error', { message: 'Error enviando el mensaje' });
            }
        });

        // ── Typing indicators ───────────────────────────────────────────────
        socket.on('typing', async ({ destinatarioId, isGroup }) => {
            if (isGroup) {
                const group = await GroupChat.findById(destinatarioId);
                const sender = await Usuario.findById(userId).select('nombre');
                if (group && sender) {
                    for (const memberId of group.miembros) {
                        const memberIdStr = memberId.toString();
                        if (memberIdStr !== userId) {
                            io.to(`user_${memberIdStr}`).emit('user_typing', { userId, userName: sender.nombre, grupoId: destinatarioId });
                        }
                    }
                }
            } else {
                io.to(`user_${destinatarioId}`).emit('user_typing', { userId });
            }
        });

        socket.on('stop_typing', async ({ destinatarioId, isGroup }) => {
            if (isGroup) {
                const group = await GroupChat.findById(destinatarioId);
                if (group) {
                    for (const memberId of group.miembros) {
                        const memberIdStr = memberId.toString();
                        if (memberIdStr !== userId) {
                            io.to(`user_${memberIdStr}`).emit('user_stop_typing', { userId, grupoId: destinatarioId });
                        }
                    }
                }
            } else {
                io.to(`user_${destinatarioId}`).emit('user_stop_typing', { userId });
            }
        });

        // ── Reaccionar a mensaje ────────────────────────────────────────────
        socket.on('react_message', async ({ messageId, emoji, destinatarioId, isGroup }) => {
            try {
                const msg = await reactToMessage(userId, messageId, emoji);
                
                if (isGroup) {
                    const group = await GroupChat.findById(destinatarioId);
                    if (group) {
                        for (const memberId of group.miembros) {
                            const memberIdStr = memberId.toString();
                            const filtered = filterMessageForUser(msg, memberIdStr);
                            io.to(`user_${memberIdStr}`).emit('message_updated', {
                                ...filtered,
                                grupo: destinatarioId
                            });
                        }
                    }
                } else {
                    // Filtrar para el destinatario
                    const filteredForDest = filterMessageForUser(msg, destinatarioId);
                    io.to(`user_${destinatarioId}`).emit('message_updated', filteredForDest);
                    
                    // Filtrar para el remitente
                    const filteredForSender = filterMessageForUser(msg, userId);
                    socket.emit('message_updated', filteredForSender);
                }
            } catch (err) {
                Logging.error(`[Socket] Error en reacción: ${err}`);
            }
        });

        // ── Eliminar mensajes ───────────────────────────────────────────────
        socket.on('delete_messages', async ({ messageIds, type, destinatarioId, isGroup }) => {
            if (!messageIds || !Array.isArray(messageIds) || !type) return;
            try {
                await deleteMessages(userId, messageIds, type);
                if (isGroup) {
                    const group = await GroupChat.findById(destinatarioId);
                    if (group) {
                        for (const memberId of group.miembros) {
                            const memberIdStr = memberId.toString();
                            io.to(`user_${memberIdStr}`).emit('messages_deleted', { messageIds, type, grupoId: destinatarioId });
                        }
                    }
                } else {
                    // Confirmar al remitente
                    socket.emit('messages_deleted', { messageIds, type });
                    // Si es para todos, notificar al destinatario
                    if (type === 'everyone' && destinatarioId) {
                        io.to(`user_${destinatarioId}`).emit('messages_deleted', { messageIds, type: 'everyone' });
                    }
                }
            } catch (err) {
                Logging.error(`[Socket] Error eliminando mensajes: ${err}`);
            }
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
