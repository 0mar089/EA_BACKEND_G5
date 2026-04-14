export interface IJwtPayload {
    id: string;
    nombre: string;
    email: string;
    rol: 'user' | 'admin';
}
