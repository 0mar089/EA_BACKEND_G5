export interface IJwtPayload {
    id: string;
    nombre: string;
    email: string;
    universidad: string;
    rol: 'user' | 'admin';
}
