/**
 * Tipos para la entidad de Usuario y sus roles oficiales.
 * Roles estrictos según backend: Administrador, Mesero, Cocinero, Cajero.
 */

export type RolUsuario = 'Administrador' | 'Mesero' | 'Cocinero' | 'Cajero';

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  ci: string;
  email: string;
  rol: RolUsuario;
  estado: boolean;
  verificado: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReporteCierreCajaDTO {
  totalDia: number;
  efectivo: number;
  tarjeta: number;
  qr: number;
  descuentos: number;
  propinas: number;
  pagosProcesados: number;
}
