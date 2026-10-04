import { apiClient } from '@/lib/api-client';
import { Categoria, CrearCategoriaDTO, ActualizarCategoriaDTO } from '@/types';

export const categoriaService = {
  /**
   * Obtiene la lista completa de categorías del menú.
   */
  async getCategorias(): Promise<Categoria[]> {
    const list = await apiClient.get<Categoria[]>('/categorias');
    return Array.isArray(list) ? list : [];
  },

  /**
   * Crea una nueva categoría (solo Administrador).
   */
  async crearCategoria(data: CrearCategoriaDTO): Promise<Categoria> {
    return apiClient.post<Categoria>('/categorias', {
      nombre: data.nombre.trim(),
    });
  },

  /**
   * Actualiza el nombre de una categoría existente (solo Administrador).
   */
  async actualizarCategoria(id: string, data: ActualizarCategoriaDTO): Promise<Categoria> {
    return apiClient.put<Categoria>(`/categorias/${id}`, {
      nombre: data.nombre.trim(),
    });
  },

  /**
   * Elimina una categoría por su identificador (solo Administrador).
   */
  async eliminarCategoria(id: string): Promise<{ mensaje: string }> {
    return apiClient.delete<{ mensaje: string }>(`/categorias/${id}`);
  },
};
