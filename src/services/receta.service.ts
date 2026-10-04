import { apiClient } from '@/lib/api-client';
import { Receta, GuardarRecetaDTO, RespuestaGuardarReceta } from '@/types';

export const recetaService = {
  /**
   * Obtiene la lista completa de recetas con sus platos e ingredientes (Cocinero, Administrador).
   */
  async getRecetas(): Promise<Receta[]> {
    const list = await apiClient.get<Receta[]>('/inventario/recetas');
    return Array.isArray(list) ? list : [];
  },

  /**
   * Guarda o actualiza la receta de un plato con sus ingredientes (solo Administrador).
   */
  async guardarReceta(data: GuardarRecetaDTO): Promise<Receta> {
    const res = await apiClient.post<RespuestaGuardarReceta>('/inventario/recetas', {
      plato: data.plato,
      ingredientes: data.ingredientes.map((i) => ({
        ingrediente: i.ingrediente,
        cantidadNecesaria: Number(i.cantidadNecesaria),
      })),
    });
    return res.receta;
  },

  /**
   * Elimina una receta por su identificador (solo Administrador).
   */
  async eliminarReceta(id: string): Promise<{ mensaje: string }> {
    return apiClient.delete<{ mensaje: string }>(`/inventario/recetas/${id}`);
  },
};
