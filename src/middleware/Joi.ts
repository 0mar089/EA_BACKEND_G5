import Joi, { ObjectSchema } from 'joi';
import { NextFunction, Request, Response } from 'express';
import { IUniversidad } from '../models/Universidad';
import { IUsuario } from '../models/Usuario';
import Logging from '../library/Logging';

export const ValidateJoi = (schema: ObjectSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.validateAsync(req.body);

            next();
        } catch (error) {
            Logging.error(error);

            return res.status(422).json({ error });
        }
    };
};

export const Schemas = {
    universidad: {
        create: Joi.object<IUniversidad>({
            nombre: Joi.string().required(),
            ubicacion: Joi.string().required(),
            usuarios: Joi.array()
                .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
                .default([])
        }),
        update: Joi.object<IUniversidad>({
            nombre: Joi.string(),
            ubicacion: Joi.string(),
            usuarios: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        })
    },
    usuario: {
        create: Joi.object<IUsuario>({
            nombre: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required(),
            rol: Joi.string().valid('admin', 'user').default('user'),
            universidad: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .allow('', null)
        }),
        update: Joi.object<IUsuario>({
            nombre: Joi.string(),
            email: Joi.string().email(),
            password: Joi.string().min(6),
            rol: Joi.string().valid('admin', 'user'),
            universidad: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .allow('', null)
        })
    }
};
