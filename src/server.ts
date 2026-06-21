import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/config';
import Logging from './library/Logging';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import usuarioRoutes from './routes/Usuario';
import universidadRoutes from './routes/Universidad';
import authRoutes from './routes/auth';
import postRoutes from './routes/Post';
import commentRoutes from './routes/Comment';
import statsRoutes from './routes/Stats';
import reportRoutes from './routes/Report';
import gradoRoutes from './routes/Grado';
import asignaturaRoutes from './routes/Asignatura';
import chatRoutes from './routes/Chat';
import notificationRoutes from './routes/Notification';
import uploadRoutes from './routes/Upload';
import bugRoutes from './routes/BugReport';
import unimatchRoutes from './routes/UniMatch';
import auditRoutes from './routes/Audit';
import eventoRoutes from './routes/Evento';
import assistantRoutes from './routes/Assistant';
import { getWeaviateClient } from './config/weaviate';
import { initSocket } from './socket';
import { matomoMiddleware } from './middleware/matomo';

const router = express();

/** Connect to Mongo */
mongoose.set('strictQuery', false);
mongoose
    .connect(config.mongo.url, { retryWrites: true, w: 'majority' })
    .then(async () => {
        Logging.info('Mongo connected successfully.');
        Logging.info('Cloudinary service initialized successfully.');
        
        try {
            await getWeaviateClient();
            Logging.info('Weaviate connected successfully.');
        } catch (error) {
            Logging.error(`Weaviate connection failed on startup: ${error}`);
        }

        StartServer();
    })
    .catch((error) => Logging.error(error));

/** Only Start Server if Mongoose Connects */
const StartServer = () => {
    /** Log the request */
    router.use((req, res, next) => {
        Logging.info(
            `Incomming - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`
        );

        res.on('finish', () => {
            Logging.info(
                `Result - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}] - STATUS: [${res.statusCode}]`
            );
        });

        next();
    });

    router.use(matomoMiddleware);

    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

    /** Rules of our API */
    router.use(cookieParser());
    router.use(cors());

    /** Swagger */
    router.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    /** Routes */
    router.use('/usuarios', usuarioRoutes);
    router.use('/universidades', universidadRoutes);
    router.use('/auth', authRoutes);
    router.use('/posts', postRoutes);
    router.use('/comments', commentRoutes);
    router.use('/stats', statsRoutes);
    router.use('/reports', reportRoutes);
    router.use('/grados', gradoRoutes);
    router.use('/asignaturas', asignaturaRoutes);
    router.use('/chat', chatRoutes);
    router.use('/notifications', notificationRoutes);
    router.use('/upload', uploadRoutes);
    router.use('/bugs', bugRoutes);
    router.use('/unimatch', unimatchRoutes);
    router.use('/audit', auditRoutes);
    router.use('/eventos', eventoRoutes);
    router.use('/assistant', assistantRoutes);


    /** Healthcheck */
    router.get('/ping', (req, res, next) => res.status(200).json({ hello: 'world' }));

    /** Error handling */
    router.use((req, res, next) => {
        const error = new Error('Not found');

        Logging.error(error);

        res.status(404).json({
            message: (error as Error).message
        });
    });

    const httpServer = http.createServer(router);

    // Inicializar Socket.io sobre el mismo servidor HTTP
    initSocket(httpServer);

    httpServer.listen(config.server.port, () => {
        Logging.info(`Server is running on ${config.server.baseUrl}`);
        Logging.info(`Accessible from emulator at http://10.0.2.2:${config.server.port}`);
        Logging.info(`Swagger is running on ${config.server.baseUrl}/api`);
    });

};