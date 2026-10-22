import { apiClient } from '@/lib/api-client';
import {
  CuentaMesaDTO,
  RespuestaCrearCuentaMesa,
  RespuestaListarCuentasMesa,
} from '@/types';

export const cuentaMesaService = {
  /** Devuelve las cuentas agrupadas que todavía esperan el pago. */
  async listarPendientes(): Promise<CuentaMesaDTO[]> {
    const respuesta = await apiClient.get<RespuestaListarCuentasMesa>('/cuentas-mesa');
    return Array.isArray(respuesta?.cuentas) ? respuesta.cuentas : [];
  },

  /** Crea o recupera la cuenta pendiente que agrupa las comandas de una mesa. */
  async crearPorMesa(mesaId: string): Promise<RespuestaCrearCuentaMesa> {
    if (!mesaId.trim()) {
      throw new Error('No se pudo identificar la mesa para solicitar la cuenta.');
    }
    return apiClient.post<RespuestaCrearCuentaMesa>(`/cuentas-mesa/mesas/${encodeURIComponent(mesaId)}`, {});
  },

  async obtenerPorId(cuentaId: string): Promise<{ cuenta: CuentaMesaDTO }> {
    return apiClient.get<{ cuenta: CuentaMesaDTO }>(`/cuentas-mesa/${encodeURIComponent(cuentaId)}`);
  },
};
