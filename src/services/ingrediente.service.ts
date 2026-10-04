import { apiClient } from '@/lib/api-client';
import { Ingrediente, CrearIngredienteDTO, ActualizarIngredienteDTO } from '@/types';

interface RespuestaIngrediente {
  mensaje: string;
  ingrediente: Ingrediente;
}

export const ingredienteService = {
  /**
   * Obtiene la lista completa de ingredientes y su disponibilidad (Cocinero, Administrador).
   */
  async getIngredientes(): Promise<Ingrediente[]> {
    const list = await apiClient.get<Ingrediente[]>('/inventario/ingredientes');
    return Array.isArray(list) ? list : [];
  },

  /**
   * Registra un nuevo ingrediente (solo Administrador).
   */
  async crearIngrediente(data: CrearIngredienteDTO): Promise<Ingrediente> {
    const res = await apiClient.post<RespuestaIngrediente>('/inventario/ingredientes', {
      nombre: data.nombre.trim(),
      unidadMedida: data.unidadMedida.trim(),
      disponible: data.disponible !== undefined ? Boolean(data.disponible) : true,
    });
    return res.ingrediente;
  },

  /**
   * Actualiza los datos de un ingrediente (solo Administrador).
   */
  async actualizarIngrediente(id: string, data: ActualizarIngredienteDTO): Promise<Ingrediente> {
    const payload: Record<string, unknown> = {};
    if (data.nombre !== undefined) payload.nombre = data.nombre.trim();
    if (data.unidadMedida !== undefined) payload.unidadMedida = data.unidadMedida.trim();
    if (data.disponible !== undefined) payload.disponible = Boolean(data.disponible);

    const res = await apiClient.put<RespuestaIngrediente>(`/inventario/ingredientes/${id}`, payload);
    return res.ingrediente;
  },

  /**
   * Conmuta la disponibilidad del ingrediente (disponible: true/false).
   */
  async toggleDisponibilidad(id: string, disponible: boolean): Promise<Ingrediente> {
    const res = await apiClient.put<RespuestaIngrediente>(`/inventario/ingredientes/${id}`, { disponible });
    return res.ingrediente;
  },

  /**
   * Elimina un ingrediente por su identificador (solo Administrador).
   */
  async eliminarIngrediente(id: string): Promise<{ mensaje: string }> {
    return apiClient.delete<{ mensaje: string }>(`/inventario/ingredientes/${id}`);
  },
};
