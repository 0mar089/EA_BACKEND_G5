import { Request, Response, NextFunction } from 'express';
import AssistantService from '../services/assistant';
import Logging from '../library/Logging';

const ask = async (req: Request, res: Response, next: NextFunction) => {
    const { pregunta } = req.body;

    if (!pregunta || typeof pregunta !== 'string' || pregunta.trim() === '') {
        Logging.warning('[400] [assistant] Missing or invalid "pregunta" in request body');
        return res.status(400).json({
            message: 'La propiedad "pregunta" es obligatoria y debe ser un texto válido.'
        });
    }

    try {
        const respuesta = await AssistantService.askToni(pregunta.trim());
        return res.status(200).json({ respuesta });
    } catch (error) {
        Logging.error(`[500] [assistant] Failed to generate response | error=${error}`);
        return res.status(500).json({
            message: 'Error interno del servidor al procesar la solicitud con el asistente virtual.'
        });
    }
};

export default { ask };
