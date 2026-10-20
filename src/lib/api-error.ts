//src/lib/api-error.ts
import { ApiErrorResponse } from '@/types';
type FaltanteApi = NonNullable<
  ApiErrorResponse['faltantes']
>[number];
/**
 * Clase de error estructurado para respuestas HTTP de la API REST.
 * Maneja códigos 400, 401, 403, 404, 409, 500 según el contrato del backend.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly mensaje: string;
  public readonly errores?: string[];
  public readonly faltantes?: FaltanteApi[];

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
    let faltantes: FaltanteApi[] | undefined;

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
    const detalles = this.faltantes.map((faltante): string => {
  if (typeof faltante === 'string') {
    return faltante;
  }

  // Faltante de stock: tiene ingrediente y cantidades.
  if (
    'ingrediente' in faltante &&
    'disponible' in faltante &&
    'requerido' in faltante &&
    'faltante' in faltante &&
    'unidad' in faltante
  ) {
    return (
      `${faltante.ingrediente}: faltan ${faltante.faltante} ` +
      `${faltante.unidad} (disponible: ${faltante.disponible} ` +
      `${faltante.unidad}; requerido: ${faltante.requerido} ` +
      `${faltante.unidad})`
    );
  }

  // Plato sin receta configurada.
  if ('plato' in faltante && 'mensaje' in faltante) {
    return `${faltante.plato}: ${faltante.mensaje}`;
  }

  // Ingrediente no disponible para un plato.
  if ('ingrediente' in faltante && 'plato' in faltante) {
    return `${faltante.ingrediente} (plato: ${faltante.plato})`;
  }


  return 'No se pudo identificar el insumo faltante.';
});

    return `${this.mensaje} Detalles: ${detalles.join('; ')}`;
  }

  if (this.errores && this.errores.length > 0) {
    return `${this.mensaje} (${this.errores.join(', ')})`;
  }

  return this.mensaje;
}
}
