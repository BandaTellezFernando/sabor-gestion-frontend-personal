import { apiClient } from '@/lib/api-client';
import {
  Ingrediente,
  CrearIngredienteDTO,
  ActualizarIngredienteDTO,
} from '@/types';

interface RespuestaIngrediente {
  mensaje: string;
  ingrediente: Ingrediente;
}

export const ingredienteService = {
  /**
   * Obtiene la lista completa de ingredientes.
   */
  async getIngredientes(): Promise<Ingrediente[]> {
    const list = await apiClient.get<Ingrediente[]>(
      '/inventario/ingredientes'
    );

    return Array.isArray(list) ? list : [];
  },

  /**
   * Registra un nuevo ingrediente.
   *
   * La unidad de medida se fija al momento de creación.
   * El stock inicial es numérico.
   */
  async crearIngrediente(
    data: CrearIngredienteDTO
  ): Promise<Ingrediente> {
    const res = await apiClient.post<RespuestaIngrediente>(
      '/inventario/ingredientes',
      {
        nombre: data.nombre.trim(),
        unidadMedida: data.unidadMedida.trim(),
        stockActual: Number(data.stockActual),
        disponible:
          data.disponible !== undefined
            ? Boolean(data.disponible)
            : true,
      }
    );

    return res.ingrediente;
  },

  /**
   * Actualiza un ingrediente existente.
   *
   * La unidad de medida NO se envía porque el backend
   * la considera inmutable después de la creación.
   */
  async actualizarIngrediente(
    id: string,
    data: ActualizarIngredienteDTO
  ): Promise<Ingrediente> {
    const payload: Record<string, unknown> = {};

    if (data.nombre !== undefined) {
      payload.nombre = data.nombre.trim();
    }

    if (data.stockActual !== undefined) {
      payload.stockActual = Number(data.stockActual);
    }

    if (data.disponible !== undefined) {
      payload.disponible = Boolean(data.disponible);
    }

    const res = await apiClient.put<RespuestaIngrediente>(
      `/inventario/ingredientes/${id}`,
      payload
    );

    return res.ingrediente;
  },

  /**
   * Conmuta únicamente la disponibilidad manual del ingrediente.
   */
  async toggleDisponibilidad(
    id: string,
    disponible: boolean
  ): Promise<Ingrediente> {
    const res = await apiClient.put<RespuestaIngrediente>(
      `/inventario/ingredientes/${id}`,
      {
        disponible,
      }
    );

    return res.ingrediente;
  },

  /**
   * Elimina un ingrediente por su identificador.
   */
  async eliminarIngrediente(
    id: string
  ): Promise<{ mensaje: string }> {
    return apiClient.delete<{ mensaje: string }>(
      `/inventario/ingredientes/${id}`
    );
  },
};