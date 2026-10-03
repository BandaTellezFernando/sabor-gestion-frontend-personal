import { Usuario, RolUsuario } from './usuario';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  mensaje: string;
  token: string;
  usuario: Usuario;
}

export interface UsuarioTokenPayload {
  id: string;
  rol: RolUsuario;
  iat: number;
  exp: number;
}
