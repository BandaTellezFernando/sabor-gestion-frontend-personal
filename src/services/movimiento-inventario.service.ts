import { apiClient } from '@/lib/api-client';
import type {
  FiltrosMovimientosInventario,
  RespuestaMovimientosInventario,
} from '@/types/movimiento-inventario';

export const movimientoInventarioService = {
  async getMovimientos(
    filtros: FiltrosMovimientosInventario,
  ): Promise<RespuestaMovimientosInventario> {
    return apiClient.get<RespuestaMovimientosInventario>(
      '/inventario/movimientos',
      {
        params: {
          pagina: filtros.pagina,
          limite: filtros.limite,
          codigoPedido: filtros.codigoPedido,
          desde: filtros.desde,
          hasta: filtros.hasta,
        },
      },
    );
  },
};
