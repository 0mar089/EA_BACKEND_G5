import Joi, { ObjectSchema } from 'joi';
import { Request, Response, NextFunction } from 'express';
import { IUniversidad } from '../models/Universidad';
import { IUsuario } from '../models/Usuario';
import { IPost } from '../models/Post';
import { IComment } from '../models/Comment';
import { IGrado } from '../models/Grado';
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
            usuarios: Joi.array()
                .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        })
    },

    usuario: {
        register: Joi.object<IUsuario>({
            nombre: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required(),
            avatarUrl: Joi.string().uri().allow('', null),
            universidad: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .allow('', null)
        }),
        create: Joi.object<IUsuario>({
            nombre: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required(),
            rol: Joi.string().valid('admin', 'user').default('user'),
            avatarUrl: Joi.string().uri().allow('', null),
            descripcion: Joi.string().max(500).allow('', null),
            universidad: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .allow('', null),
            seguidores: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).default([]),
            seguidos: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).default([])
        }),

        update: Joi.object<IUsuario>({
            nombre: Joi.string(),
            email: Joi.string().email(),
            password: Joi.string().min(6),
            rol: Joi.string().valid('admin', 'user'),
            avatarUrl: Joi.string().uri().allow('', null),
            descripcion: Joi.string().max(50).allow('', null),
            universidad: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .allow('', null),
            seguidores: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
            seguidos: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        }),
        updateSelf: Joi.object<IUsuario>({
            nombre: Joi.string(),
            email: Joi.string().email(),
            password: Joi.string().min(6),
            avatarUrl: Joi.string().uri().allow('', null),
            descripcion: Joi.string().max(500).allow('', null),
            universidad: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .allow('', null)
        }),
        follow: Joi.object({
            targetId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        })
    },

    auth: {
        login: Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required()
        })
    },

    post: {
        create: Joi.object<IPost>({
            usuario: Joi.string().regex(/^[0-9a-fA-F]{24}$/), // Opcional, solo para admin
            imageUrl: Joi.string().uri().allow('', null),
            caption: Joi.string().max(500).allow('', null),
            comments: Joi.array()
                .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
                .default([])
        }),

        like: Joi.object({
            postId: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .required()
        }),

        update: Joi.object<IPost>({
            usuario: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
            imageUrl: Joi.string().uri().allow('', null),
            caption: Joi.string().max(500).allow('', null),
            comments: Joi.array()
                .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        }),
    },

    comment: {
        create: Joi.object<IComment>({
            usuario: Joi.string().regex(/^[0-9a-fA-F]{24}$/), // Opcional, solo para admin
            post: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .required(),
            texto: Joi.string().max(300).required()
        }),

        update: Joi.object<IComment>({
            texto: Joi.string().max(300)
        })

    },
    grado: {
        create: Joi.object<IGrado>({
            nombre: Joi.string().required(),
            asignaturas: Joi.array().items(Joi.string()).default([]),
            universidad: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        }),
        update: Joi.object<IGrado>({
            nombre: Joi.string(),
            asignaturas: Joi.array().items(Joi.string()),
            universidad: Joi.string().regex(/^[0-9a-fA-F]{24}$/)
        })
    }
};