import { apiClient } from '@/lib/api-client';
import { Plato, CrearPlatoDTO, ActualizarPlatoDTO } from '@/types';

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
   * Sube un archivo de imagen al endpoint oficial del backend POST /api/upload.
   * El backend procesa la imagen y la almacena en Cloudinary.
   */
  async subirImagen(archivo: File): Promise<RespuestaSubidaImagen> {
    const formData = new FormData();
    formData.append('imagen', archivo);
    return apiClient.post<RespuestaSubidaImagen>('/upload', formData);
  },

  /**
   * Crea un nuevo plato (solo Administrador).
   * Requiere nombre, descripcion, precio, categoria, imagenUrl e imagenPublicId.
   */
  async crearPlato(data: CrearPlatoDTO): Promise<Plato> {
    return apiClient.post<Plato>('/platos', {
      nombre: data.nombre.trim(),
      descripcion: data.descripcion.trim(),
      precio: Number(data.precio),
      categoria: data.categoria,
      imagenUrl: data.imagenUrl || '',
      imagenPublicId: data.imagenPublicId || '',
      disponible: data.disponible !== undefined ? Boolean(data.disponible) : true,
    });
  },

  /**
   * Actualiza los datos de un plato existente (solo Administrador).
   */
  async actualizarPlato(id: string, data: ActualizarPlatoDTO): Promise<Plato> {
    const payload: Record<string, unknown> = {};
    if (data.nombre !== undefined) payload.nombre = data.nombre.trim();
    if (data.descripcion !== undefined) payload.descripcion = data.descripcion.trim();
    if (data.precio !== undefined) payload.precio = Number(data.precio);
    if (data.categoria !== undefined) payload.categoria = data.categoria;
    if (data.imagenUrl !== undefined) payload.imagenUrl = data.imagenUrl;
    if (data.imagenPublicId !== undefined) payload.imagenPublicId = data.imagenPublicId;
    if (data.disponible !== undefined) payload.disponible = Boolean(data.disponible);

    return apiClient.put<Plato>(`/platos/${id}`, payload);
  },

  /**
   * Conmuta la disponibilidad del plato (disponible: true/false).
   */
  async toggleDisponibilidad(id: string, disponible: boolean): Promise<Plato> {
    return apiClient.put<Plato>(`/platos/${id}`, { disponible });
  },

  /**
   * Elimina un plato por su identificador (solo Administrador).
   * El backend se encarga de eliminar la imagen asociada de Cloudinary.
   */
  async eliminarPlato(id: string): Promise<{ mensaje: string }> {
    return apiClient.delete<{ mensaje: string }>(`/platos/${id}`);
  },
};
