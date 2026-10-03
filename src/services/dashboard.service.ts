import { apiClient } from '@/lib/api-client';
import { ResumenDashboardDTO } from '@/types';

/**
 * Servicio del dashboard gerencial.
 * Exclusivo para rol Administrador según docs/frontend-reference.md
 */
export const dashboardService = {
  async getResumen(): Promise<ResumenDashboardDTO> {
    return apiClient.get<ResumenDashboardDTO>('/dashboard/resumen');
  },
};
