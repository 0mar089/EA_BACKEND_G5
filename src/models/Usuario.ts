import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import mongoosePaginate from 'mongoose-paginate-v2';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IUsuario {
    nombre: string;
    email: string;
    password: string;
    avatarUrl?: string;
    descripcion?: string;
    rol: 'admin' | 'user';
    universidad?: Types.ObjectId;
    activo: boolean;
    posts?: Types.ObjectId[];
    comments?: Types.ObjectId[];
    seguidores?: Types.ObjectId[];
    seguidos?: Types.ObjectId[];
    grado?: Types.ObjectId;
    asignaturas?: Types.ObjectId[];
    privado: boolean;
    hasAcceptedUnimatchTerms: boolean;
    fcmToken?: string | null;
    postsGuardados?: Types.ObjectId[];
}

// Extiende Document para que sea compatible con los helpers de Mongoose (save, populate, etc.)
export interface IUsuarioModel extends IUsuario, Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const UsuarioSchema: Schema<IUsuarioModel> = new Schema(
    {   
        nombre: {
            type: String,
            required: [true, 'El nombre es obligatorio'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'El email es obligatorio'],
            unique: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: (value: string): boolean =>
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
                message: (props: { value: string }) =>
                    `'${props.value}' no es un formato de email válido`
            }
        },
        password: {
            type: String,
            required: [true, 'La contraseña es obligatoria'],
            select: false
        },
        avatarUrl: {
            type: String,
            default: 'https://api.dicebear.com/7.x/avataaars/png?seed=default-avatar',
            trim: true
        },
        descripcion: {
            type: String,
            default: '',
            trim: true
        },
        rol: {
            type: String,
            enum: {
                values: ['admin', 'user'],
                message: 'El rol debe ser "admin" o "user"'
            },
            default: 'user'
        },
        universidad: {
            type: Schema.Types.ObjectId,
            ref: 'Universidad',
            default: null
        },
        activo: {
            type: Boolean,
            default: true
        },
        posts: {
            type: [Schema.Types.ObjectId],
            ref: 'Post',
            default: []
        },
        comments: {
            type: [Schema.Types.ObjectId],
            ref: 'Comment',
            default: []
        },
        seguidores: {
            type: [Schema.Types.ObjectId],
            ref: 'Usuario',
            default: []
        },
        seguidos: {
            type: [Schema.Types.ObjectId],
            ref: 'Usuario',
            default: []
        },
        grado: {
            type: Schema.Types.ObjectId,
            ref: 'Grado',
            default: null
        },
        asignaturas: {
            type: [Schema.Types.ObjectId],
            ref: 'Asignatura',
            default: []
        },
        privado: {
            type: Boolean,
            default: false
        },
        hasAcceptedUnimatchTerms: {
            type: Boolean,
            default: false
        },
        fcmToken: {
            type: String,
            default: null
        },
        postsGuardados: {
            type: [Schema.Types.ObjectId],
            ref: 'Post',
            default: []
        }
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            transform: (doc, ret) => {
                delete ret.password;
                return ret;
            }
        },
        toObject: {
            transform: (doc, ret) => {
                delete ret.password;
                return ret;
            }
        }
    }
);

// Middleware para encriptar la contraseña antes de guardar
UsuarioSchema.pre<IUsuarioModel>('save', async function (next) {
    const usuario = this;

    if (!usuario.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(usuario.password, salt);
        next();
    } catch (error: unknown) {
        next(error as Error);
    }
});

// Método para comparar contraseñas
UsuarioSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

// Plugins
UsuarioSchema.plugin(mongoosePaginate);

// ─── Model ────────────────────────────────────────────────────────────────────

const Usuario = mongoose.model<IUsuarioModel, mongoose.PaginateModel<IUsuarioModel>>('Usuario', UsuarioSchema);

export default Usuario;
