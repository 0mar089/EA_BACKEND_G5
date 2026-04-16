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

const router = express();

/** Connect to Mongo */
mongoose
    .connect(config.mongo.url, { retryWrites: true, w: 'majority' })
    .then(() => {
        Logging.info('Mongo connected successfully.');
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


    /** Healthcheck */
    router.get('/ping', (req, res, next) => res.status(200).json({ hello: 'world' }));

    /** Error handling */
    router.use((req, res, next) => {
        const error = new Error('Not found');

        Logging.error(error);

        res.status(404).json({
            message: error.message
        });
    });

    http.createServer(router).listen(config.server.port, () => {
        Logging.info(`Server is running on port ${config.server.port}`);
        Logging.info(`Swagger is running on http://localhost:${config.server.port}/api`);
    });
    
};