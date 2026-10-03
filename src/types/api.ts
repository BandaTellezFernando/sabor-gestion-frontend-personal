/**
 * Tipos base para respuestas y errores de la API REST.
 * Basado estrictamente en docs/openapi.yaml y docs/frontend-reference.md
 * (Sin abstracciones ficticias de paginación).
 */

export interface ApiErrorResponse {
  mensaje: string;
  errores?: string[];
  faltantes?: string[];
}

export interface MensajeRespuestaResponse {
  mensaje: string;
}

export interface HealthResponse {
  status: string;
  message: string;
}
