import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IUsuario {
    nombre: string;
    email: string;
    password: string;
    rol: 'admin' | 'user';
    universidad?: Types.ObjectId;
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
        }
    },
    {
        timestamps: true,
        versionKey: false
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
    } catch (error: any) {
        next(error);
    }
});

// Método para comparar contraseñas
UsuarioSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

// ─── Model ────────────────────────────────────────────────────────────────────

const Usuario = mongoose.model<IUsuarioModel>('Usuario', UsuarioSchema);

export default Usuario;
