import { apiClient } from '@/lib/api-client';
import { Ubicacion } from '@/types';

export interface UbicacionPayload {
  nombre: string;
  descripcion?: string;
}

interface UbicacionApiResponse {
  id?: string;
  _id?: string;
  nombre?: string;
  name?: string;
  descripcion?: string | null;
}

/**
 * El backend responde con "id"; el frontend usa "_id".
 * Normalizamos la respuesta en un único punto para que los formularios
 * de mesas y la administración de ubicaciones utilicen el mismo formato.
 */
function normalizarUbicacion(data: UbicacionApiResponse): Ubicacion {
  const id = data._id || data.id;
  if (!id) {
    throw new Error('La respuesta del servidor no contiene el identificador de la ubicación.');
  }

  return {
    _id: id,
    nombre: (data.nombre || data.name || '').trim(),
    descripcion: data.descripcion || undefined,
  };
}

export const ubicacionService = {
  async getUbicaciones(): Promise<Ubicacion[]> {
    const response = await apiClient.get<UbicacionApiResponse[]>('/ubicaciones');
    return Array.isArray(response) ? response.map(normalizarUbicacion) : [];
  },

  async crearUbicacion(data: UbicacionPayload): Promise<Ubicacion> {
    const response = await apiClient.post<UbicacionApiResponse>('/ubicaciones', data);
    return normalizarUbicacion(response);
  },

  async actualizarUbicacion(
    id: string,
    data: UbicacionPayload
  ): Promise<Ubicacion> {
    const response = await apiClient.put<UbicacionApiResponse>(
      `/ubicaciones/${encodeURIComponent(id)}`,
      data
    );
    return normalizarUbicacion(response);
  },

  async eliminarUbicacion(id: string): Promise<{ mensaje: string }> {
    return apiClient.delete<{ mensaje: string }>(
      `/ubicaciones/${encodeURIComponent(id)}`
    );
  },
};
