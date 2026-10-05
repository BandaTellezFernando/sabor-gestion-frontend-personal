import { apiClient } from '@/lib/api-client';
import {
  Plato,
  CrearPlatoDTO,
  ActualizarPlatoDTO,
} from '@/types';

export interface RespuestaSubidaImagen {
  mensaje: string;
  url: string;
  publicId: string;
}

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

  /**
   * Sube un archivo de imagen al endpoint oficial del backend.
   */
  async subirImagen(
    archivo: File
  ): Promise<RespuestaSubidaImagen> {
    const formData = new FormData();

    formData.append('imagen', archivo);

    return apiClient.post<RespuestaSubidaImagen>(
      '/upload',
      formData
    );
  },

  /**
   * Crea un nuevo plato junto con su receta.
   *
   * El backend requiere que el plato tenga al menos un
   * ingrediente configurado.
   */
  async crearPlato(
    data: CrearPlatoDTO
  ): Promise<Plato> {
    return apiClient.post<Plato>('/platos', {
      nombre: data.nombre.trim(),
      descripcion: data.descripcion.trim(),
      precio: Number(data.precio),
      categoria: data.categoria,
      imagenUrl: data.imagenUrl || '',
      imagenPublicId: data.imagenPublicId || '',
      disponible:
        data.disponible !== undefined
          ? Boolean(data.disponible)
          : true,

      ingredientes: data.ingredientes.map(
        (ingrediente) => ({
          ingrediente: ingrediente.ingrediente,
          cantidadNecesaria: Number(
            ingrediente.cantidadNecesaria
          ),
        })
      ),
    });
  },

  /**
   * Actualiza los datos generales de un plato existente.
   *
   * La receta se manejará posteriormente mediante el
   * servicio de recetas, ya que el endpoint PUT /platos
   * actualiza los datos propios del plato.
   */
  async actualizarPlato(
    id: string,
    data: ActualizarPlatoDTO
  ): Promise<Plato> {
    const payload: Record<string, unknown> = {};

    if (data.nombre !== undefined) {
      payload.nombre = data.nombre.trim();
    }

    if (data.descripcion !== undefined) {
      payload.descripcion = data.descripcion.trim();
    }

    if (data.precio !== undefined) {
      payload.precio = Number(data.precio);
    }

    if (data.categoria !== undefined) {
      payload.categoria = data.categoria;
    }

    if (data.imagenUrl !== undefined) {
      payload.imagenUrl = data.imagenUrl;
    }

    if (data.imagenPublicId !== undefined) {
      payload.imagenPublicId = data.imagenPublicId;
    }

    if (data.disponible !== undefined) {
      payload.disponible = Boolean(data.disponible);
    }

    return apiClient.put<Plato>(
      `/platos/${id}`,
      payload
    );
  },

  /**
   * Conmuta la disponibilidad del plato.
   */
  async toggleDisponibilidad(
    id: string,
    disponible: boolean
  ): Promise<Plato> {
    return apiClient.put<Plato>(
      `/platos/${id}`,
      {
        disponible,
      }
    );
  },

  /**
   * Elimina un plato por su identificador.
   * El backend se encarga de eliminar la receta asociada
   * y la imagen correspondiente.
   */
  async eliminarPlato(
    id: string
  ): Promise<{ mensaje: string }> {
    return apiClient.delete<{ mensaje: string }>(
      `/platos/${id}`
    );
  },
};