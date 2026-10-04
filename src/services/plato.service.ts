import { apiClient } from '@/lib/api-client';
import { Plato } from '@/types';

export const platoService = {
  /**
   * Obtiene la lista completa de platos del restaurante.
   * Permite filtrar opcionalmente por categoría.
   */
  async getPlatos(category?: string): Promise<Plato[]> {
    const list = await apiClient.get<Plato[]>('/platos', {
      params: category ? { category } : undefined,
    });
    return Array.isArray(list) ? list : [];
  },

  /**
   * Obtiene los datos de un plato específico por su ID.
   */
  async getPlatoById(id: string): Promise<Plato> {
    return apiClient.get<Plato>(`/platos/${id}`);
  },
};
