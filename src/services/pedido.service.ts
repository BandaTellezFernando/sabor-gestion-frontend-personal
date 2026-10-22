//src/services/pedido.service.ts
import { apiClient } from '@/lib/api-client';
import { cuentaMesaService } from '@/services/cuenta-mesa.service';
import {
  Pedido,
  CrearPedidoDTO,
  ActualizarPedidoDTO,
  ActualizarEstadoPedidoDTO,
  PedidosQueryParams,
  RespuestaRecogerPedido,
  PayloadCajaDTO,
  CuentaMesaDTO,
} from '@/types';

export interface RespuestaEnviarPedidoCocina {
  mensaje: string
  pedido: Pedido
  yaEnviado: boolean
}

export const pedidoService = {
  /**
   * Obtiene un pedido específico por su ID (Administrador, Mesero, Cocinero, Cajero).
   */
  async getPedidoById(id: string): Promise<Pedido> {
    return apiClient.get<Pedido>(`/pedidos/${id}`);
  },

  /**
   * Obtiene la lista de pedidos según los parámetros de filtrado documentados.
   * Por defecto, puede consultarse con `hoy: true` para la vista operativa del día.
   */
  async getPedidos(params?: PedidosQueryParams): Promise<Pedido[]> {
    const query: Record<string, string> = {};
    if (params) {
      if (params.hoy !== undefined) query.hoy = String(params.hoy);
      if (params.fecha) query.fecha = params.fecha;
      if (params.mesa) query.mesa = params.mesa;
      if (params.activo !== undefined) query.activo = String(params.activo);
      if (params.cajero) query.cajero = params.cajero;
      if (params.mesero) query.mesero = params.mesero;
      if (params.reportesCierre !== undefined) query.reportesCierre = String(params.reportesCierre);
      if (params.recogido !== undefined) query.recogido = String(params.recogido);
      if (params.incluirRecogidos !== undefined) query.incluirRecogidos = String(params.incluirRecogidos);
    }

    const list = await apiClient.get<Pedido[]>('/pedidos', { params: query });
    return Array.isArray(list) ? list : [];
  },

  /**
   * Obtiene pedidos de mesas con cuenta solicitada pendientes de cobro en Caja.
   * Retorna array estructurado de PayloadCajaDTO según el backend y OpenAPI.
   */
  async getPedidosPendientesCobro(cajero?: string): Promise<PayloadCajaDTO[]> {
    const params = cajero ? { cajero } : undefined;
    const list = await apiClient.get<PayloadCajaDTO[]>('/pedidos/pendientes-cobro', { params });
    return Array.isArray(list) ? list : [];
  },

  /**
   * Obtiene la cola de pedidos activos para Cocina (Cocinero, Administrador).
   * Llama a GET /api/pedidos/cocina que omite datos financieros y retorna pedidos en flujo culinario.
   */
  async getPedidosCocina(): Promise<Pedido[]> {
    const list = await apiClient.get<Pedido[]>('/pedidos/cocina');
    return Array.isArray(list) ? list : [];
  },

  /**
   * Crea un nuevo pedido / comanda en salón (Mesero, Administrador).
   * El backend valida ingredientes, calcula subtotales y total, genera código y ocupa la mesa.
   */
  async crearPedido(data: CrearPedidoDTO): Promise<Pedido> {
    return apiClient.post<Pedido>('/pedidos', {
      mesa: data.mesa,
      detalles: data.detalles.map((d) => ({
        plato: d.plato,
        cantidad: d.cantidad,
        observacion: d.observacion?.trim() || '',
      })),
      montoDescuento: data.montoDescuento ?? 0,
      montoPropina: data.montoPropina ?? 0,
      clienteNombre: data.clienteNombre?.trim() || undefined,
      clienteCI: data.clienteCI?.trim() || undefined,
      clienteNIT: data.clienteNIT?.trim() || undefined,
    });
  },

    /**
   * Envía un pedido en borrador a cocina.
   * El backend valida ingredientes, descuenta el inventario
   * y cambia el estado a PENDIENTE.
   */
  async enviarPedidoCocina(
    id: string
  ): Promise<RespuestaEnviarPedidoCocina> {
    return apiClient.patch<RespuestaEnviarPedidoCocina>(
      `/pedidos/${id}/enviar-cocina`,
      {}
    )
  },

  /**
   * Actualiza los detalles o datos comerciales de un pedido existente (Mesero, Administrador).
   * No envía estado ni campos protegidos.
   */
  async actualizarPedido(id: string, data: ActualizarPedidoDTO): Promise<Pedido> {
    const payload: Record<string, unknown> = {};

    if (data.detalles !== undefined) {
      payload.detalles = data.detalles.map((d) => ({
        plato: d.plato,
        cantidad: d.cantidad,
        observacion: d.observacion?.trim() || '',
      }));
    }
    if (data.montoDescuento !== undefined) payload.montoDescuento = data.montoDescuento;
    if (data.montoPropina !== undefined) payload.montoPropina = data.montoPropina;
    if (data.clienteNombre !== undefined) payload.clienteNombre = data.clienteNombre.trim();
    if (data.clienteCI !== undefined) payload.clienteCI = data.clienteCI.trim();
    if (data.clienteNIT !== undefined) payload.clienteNIT = data.clienteNIT.trim();

    return apiClient.put<Pedido>(`/pedidos/${id}`, payload);
  },

  /**
   * Actualiza el estado culinario del pedido en cocina (Cocinero, Administrador).
   * Transiciones permitidas: ABIERTO -> EN_PREPARACION, EN_PREPARACION -> ENTREGADO.
   */
  async actualizarEstado(
    id: string,
    estado: 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO'
  ): Promise<{ mensaje: string; pedido: Pedido }> {
    const body: ActualizarEstadoPedidoDTO = { estado };
    return apiClient.patch<{ mensaje: string; pedido: Pedido }>(`/pedidos/${id}/estado`, body);
  },

  /**
   * Solicita formalmente la cuenta para el pedido (Mesero, Administrador).
   * La mesa pasa a 'Cuenta Solicitada' y se notifica a Caja.
   */
  async solicitarCuenta(id: string): Promise<{ mensaje: string; solicitud: CuentaMesaDTO }> {
    // El pedido es solo el punto de entrada; Caja cobra la cuenta agrupada de su mesa.
    const pedido = await this.getPedidoById(id);
    const mesaId = typeof pedido.mesa === 'string' ? pedido.mesa : pedido.mesa?._id;

    if (!mesaId) {
      throw new Error('No se pudo identificar la mesa asociada a la comanda.');
    }

    const respuesta = await cuentaMesaService.crearPorMesa(mesaId);
    return {
      mensaje: respuesta.mensaje,
      solicitud: respuesta.cuenta,
    };
  },

  /**
   * Cancela un pedido abierto o en preparación y libera la mesa a 'Libre' (Mesero, Administrador).
   */
  async cancelarPedido(id: string): Promise<{ mensaje: string; pedido: Pedido }> {
    return apiClient.patch<{ mensaje: string; pedido: Pedido }>(`/pedidos/${id}/cancel`, {});
  },

  /**
   * Marca el pedido como recogido por el mesero responsable o Administrador (Mesero, Administrador).
   * Requiere que el pedido esté en estado ENTREGADO. Persiste recogido: true sin cambiar el estado.
   */
  async marcarRecogido(id: string): Promise<RespuestaRecogerPedido> {
    return apiClient.patch<RespuestaRecogerPedido>(`/pedidos/${id}/recoger`, {});
  },
};


