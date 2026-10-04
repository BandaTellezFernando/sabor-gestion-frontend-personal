import { apiClient } from '@/lib/api-client';
import { Ubicacion } from '@/types';

/**
 * Servicio para consultar las ubicaciones de salón configuradas en el restaurante.
 * Endpoint: GET /api/ubicaciones
 */
export const ubicacionService = {
  async getUbicaciones(): Promise<Ubicacion[]> {
    return apiClient.get<Ubicacion[]>('/ubicaciones');
  },
};
