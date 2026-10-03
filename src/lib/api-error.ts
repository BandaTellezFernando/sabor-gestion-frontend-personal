import { ApiErrorResponse } from '@/types';

/**
 * Clase de error estructurado para respuestas HTTP de la API REST.
 * Maneja códigos 400, 401, 403, 404, 409, 500 según el contrato del backend.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly mensaje: string;
  public readonly errores?: string[];
  public readonly faltantes?: string[];

  constructor(statusCode: number, data?: Partial<ApiErrorResponse> | string) {
    const defaultMessages: Record<number, string> = {
      400: 'Solicitud inválida o datos incompletos.',
      401: 'Sesión no autorizada o credenciales incorrectas.',
      403: 'Acceso denegado. No tienes permisos para realizar esta acción.',
      404: 'El recurso solicitado no fue encontrado.',
      409: 'Existe un conflicto con los datos existentes.',
      500: 'Error interno del servidor. Inténtalo más tarde.',
    };

    let mensaje = defaultMessages[statusCode] || 'Ocurrió un error inesperado.';
    let errores: string[] | undefined;
    let faltantes: string[] | undefined;

    if (typeof data === 'string') {
      mensaje = data;
    } else if (data && typeof data === 'object') {
      if (data.mensaje) {
        mensaje = data.mensaje;
      }
      if (data.errores) {
        errores = data.errores;
      }
      if (data.faltantes) {
        faltantes = data.faltantes;
      }
    }

    super(mensaje);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.mensaje = mensaje;
    this.errores = errores;
    this.faltantes = faltantes;
  }

  /**
   * Genera un mensaje formateado y comprensible para presentar en la interfaz de usuario.
   */
  public getUserMessage(): string {
    if (this.faltantes && this.faltantes.length > 0) {
      return `${this.mensaje} Insumos no disponibles: ${this.faltantes.join(', ')}`;
    }
    if (this.errores && this.errores.length > 0) {
      return `${this.mensaje} (${this.errores.join(', ')})`;
    }
    return this.mensaje;
  }
}
