import { apiClient } from '@/lib/api-client';
import { Usuario, CrearUsuarioDTO, ActualizarUsuarioDTO } from '@/types';

export const usuarioService = {
  /**
   * Obtiene la lista completa de usuarios (solo Administrador).
   */
  async getUsuarios(): Promise<Usuario[]> {
    const list = await apiClient.get<Usuario[]>('/usuarios');
    return Array.isArray(list) ? list : [];
  },

  /**
   * Crea un nuevo usuario (solo Administrador).
   */
  async crearUsuario(data: CrearUsuarioDTO): Promise<Usuario> {
    const response = await apiClient.post<{ usuario: Usuario }>('/usuarios', data);
    return response.usuario;
  },

  /**
   * Actualiza los datos de un usuario existente (solo Administrador).
   */
  async actualizarUsuario(id: string, data: ActualizarUsuarioDTO): Promise<Usuario> {
    const response = await apiClient.put<{ usuario: Usuario }>(`/usuarios/${id}`, data);
    return response.usuario;
  },

  /**
   * Cambia el estado (activo/inactivo) de un usuario.
   */
  async cambiarEstadoUsuario(id: string, estado: boolean): Promise<Usuario> {
    const response = await apiClient.patch<{ usuario: Usuario }>(`/usuarios/${id}/estado`, { estado });
    return response.usuario;
  },

  /**
   * Elimina un usuario por su identificador (solo Administrador).
   */
  async eliminarUsuario(id: string): Promise<{ mensaje: string }> {
    return apiClient.delete<{ mensaje: string }>(`/usuarios/${id}`);
  },
};
