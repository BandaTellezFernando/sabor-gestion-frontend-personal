//src/services/pago.service.ts
import { apiClient } from '@/lib/api-client';
import {
  ConfirmarPagoQRCuentaResponse,
  DatosQRCuentaResponse,
  EstadoQRCuentaResponse,
  EnviarReciboCorreoRequest,
  ProcesarPagoCuentaRequestDTO,
  ProcesarPagoCuentaResponse,
  ProcesarPagoRequestDTO,
  ProcesarPagoResponse,
  GenerarPagoQRResponse,
  SimularPagoQRResponse,
} from '@/types';

export const pagoService = {
  /** Flujo legado por pedido. Se conserva para las pantallas que aún lo utilicen. */
  async procesarPago(pedidoId: string, data: ProcesarPagoRequestDTO): Promise<ProcesarPagoResponse> {
    return apiClient.post<ProcesarPagoResponse>(`/pagos/${pedidoId}/procesar`, data);
  },

  /** Ruta antigua; el backend la responde con 410 y ya no se usa desde Caja. */
  async generarQR(pedidoId: string): Promise<GenerarPagoQRResponse> {
    return apiClient.post<GenerarPagoQRResponse>(`/pagos/generar-qr/${pedidoId}`);
  },

  /** Ruta antigua; el backend la responde con 410 y ya no se usa desde Caja. */
  async simularPagoQR(pedidoId: string): Promise<SimularPagoQRResponse> {
    return apiClient.post<SimularPagoQRResponse>(`/pagos/notificar-qr/${pedidoId}`);
  },

  /** Procesa efectivo o tarjeta para toda la cuenta agrupada. */
  async procesarPagoCuenta(
    cuentaId: string,
    data: ProcesarPagoCuentaRequestDTO,
  ): Promise<ProcesarPagoCuentaResponse> {
    return apiClient.post<ProcesarPagoCuentaResponse>(`/pagos/cuentas/${encodeURIComponent(cuentaId)}/procesar`, data);
  },

  /** Devuelve el enlace público del cliente para crear el QR visual. */
  async generarQRCuenta(cuentaId: string): Promise<DatosQRCuentaResponse> {
    return apiClient.get<DatosQRCuentaResponse>(`/pagos/cuentas/${encodeURIComponent(cuentaId)}/qr`);
  },

  /** Consulta pública del estado y detalle de la cuenta mediante su token QR. */
  async consultarEstadoQRCuenta(token: string): Promise<EstadoQRCuentaResponse> {
    return apiClient.post<EstadoQRCuentaResponse>('/pagos/cuentas/qr/estado', { token });
  },

  /** Registra el pago QR simulado desde la página pública del cliente. */
  async confirmarPagoQRCuenta(
    token: string,
    cliente: { clienteNombre: string; clienteCI: string; clienteNIT?: string },
  ): Promise<ConfirmarPagoQRCuentaResponse> {
    return apiClient.post<ConfirmarPagoQRCuentaResponse>('/pagos/cuentas/qr/confirmar', {
      token,
      ...cliente,
    });
  },

  /** Envía por correo comprobantes de pagos individuales del flujo legado. */
  async enviarRecibo(pedidoId: string, data: EnviarReciboCorreoRequest): Promise<{ mensaje: string }> {
    return apiClient.post<{ mensaje: string }>(`/pagos/${pedidoId}/enviar-recibo`, data);
  },

  /** Envía el recibo consolidado de todas las comandas de una cuenta ya pagada. */
  async enviarReciboCuenta(cuentaId: string, data: Pick<EnviarReciboCorreoRequest, 'email'>): Promise<{ mensaje: string }> {
    return apiClient.post<{ mensaje: string }>(`/pagos/cuentas/${encodeURIComponent(cuentaId)}/enviar-recibo`, data);
  },

  /** Permite al cliente recibir por correo el recibo QR ya pagado usando el token del enlace. */
  async enviarReciboQR(token: string, data: Pick<EnviarReciboCorreoRequest, 'email'>): Promise<{ mensaje: string }> {
    return apiClient.post<{ mensaje: string }>('/pagos/cuentas/qr/enviar-recibo', {
      token,
      email: data.email,
    });
  },
};
