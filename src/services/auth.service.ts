import { apiClient } from '@/lib/api-client';
import { LoginRequest, LoginResponse } from '@/types';

/**
 * Servicio de autenticación.
 * Consume exclusivamente POST /api/usuarios/login.
 * No asume endpoints ficticios como /me o /refresh.
 */
export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/usuarios/login', credentials);
  },
};
