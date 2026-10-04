import { apiClient } from '@/lib/api-client';
import {
  ProcesarPagoRequestDTO,
  ProcesarPagoResponse,
  GenerarPagoQRResponse,
  SimularPagoQRResponse,
  EnviarReciboCorreoRequest,
} from '@/types';

export const pagoService = {
  /**
   * Procesa el pago final de un pedido (Efectivo, Tarjeta o QR).
   * Cierra el pedido (CERRADO), libera la mesa (Libre) y emite comprobante.
   */
  async procesarPago(pedidoId: string, data: ProcesarPagoRequestDTO): Promise<ProcesarPagoResponse> {
    return apiClient.post<ProcesarPagoResponse>(`/pagos/${pedidoId}/procesar`, data);
  },

  /**
   * Genera el código QR para el pago de un pedido con su monto total.
   */
  async generarQR(pedidoId: string): Promise<GenerarPagoQRResponse> {
    return apiClient.post<GenerarPagoQRResponse>(`/pagos/generar-qr/${pedidoId}`);
  },

  /**
   * Simula la notificación de pago desde un dispositivo móvil (QR Dinámico).
   * Notifica a la caja mediante el evento WebSocket 'caja:pago_confirmado'.
   */
  async simularPagoQR(pedidoId: string): Promise<SimularPagoQRResponse> {
    return apiClient.post<SimularPagoQRResponse>(`/pagos/notificar-qr/${pedidoId}`);
  },

  /**
   * Envía el recibo detallado de pago por correo electrónico al cliente.
   */
  async enviarRecibo(pedidoId: string, data: EnviarReciboCorreoRequest): Promise<{ mensaje: string }> {
    return apiClient.post<{ mensaje: string }>(`/pagos/${pedidoId}/enviar-recibo`, data);
  },
};
