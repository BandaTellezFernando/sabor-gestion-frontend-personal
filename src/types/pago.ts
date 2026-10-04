import { Pedido, MetodoPago } from './pedido';
import { Mesa } from './mesa';
import { Usuario } from './usuario';

export interface Pago {
  _id: string;
  codigoPago: string;
  codigoPedido: string;
  pedido: string | Pedido;
  mesa: string | Mesa;
  mesero: string | Usuario;
  cajero?: string | Usuario;
  nombreCliente: string;
  ci?: string;
  nit?: string;
  subtotal: number;
  descuento: number;
  propina: number;
  totalFinal: number;
  metodoPago: MetodoPago;
  estadoPago: 'Pendiente' | 'Procesado' | 'Pagado' | 'Anulado';
  fechaEnvioCajaBolivia?: string;
  fechaEnvioCaja: string | Date;
  fechaPagoBolivia?: string;
  fechaPago?: string | Date;
  observaciones?: string;
}

export interface ItemPayloadCaja {
  platoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  observacion?: string;
}

export interface PayloadCajaDTO {
  pedidoId: string;
  codigo: string;
  mesaId?: string;
  mesaNombre?: string;
  mesa?: string;
  meseroNombre?: string;
  mesero?: string;
  estado?: string;
  subtotal: number;
  itemsSubtotal?: number;
  subtotalCierre?: number;
  descuento?: number;
  montoDescuento?: number;
  propina?: number;
  montoPropina?: number;
  total: number;
  clienteNombre?: string;
  clienteCI?: string;
  clienteNIT?: string;
  tiempoEsperaMinutos?: number;
  items: ItemPayloadCaja[];
  fechaHoraBolivia?: string;
}

export interface ProcesarPagoRequestDTO {
  metodoPago: MetodoPago;
  porcentajeDescuento?: number;
  porcentajePropina?: number;
  montoDescuento?: number;
  montoPropina?: number;
  clienteNombre?: string;
  clienteCI?: string;
  clienteNIT?: string;
}

export interface GenerarPagoQRResponse {
  qrUrl: string;
  total: number;
}

export interface ProcesarPagoResponse {
  mensaje: string;
  comprobante: ComprobantePago;
}

export interface SimularPagoQRResponse {
  exito: boolean;
  mensaje: string;
}

export interface EnviarReciboCorreoRequest {
  email: string;
  clienteNombre?: string;
  clienteCI?: string;
}

export interface ComprobantePago {
  pedidoId: string;
  meseroNombre: string;
  subtotal: number;
  montoDescuento: number;
  montoPropina: number;
  descuentoAplicado: number;
  propinaAplicada: number;
  total: number;
  totalPagado: number;
  metodoPago: MetodoPago | string;
  cajeroAsignado?: string | null;
  clienteNombre?: string;
  clienteCI?: string;
  clienteNIT?: string;
  fechaBolivia: string;
  fecha: string | Date;
}

export interface CierreCaja {
  _id: string;
  cajeroId: string;
  cajeroNombre: string;
  totalDia: number;
  efectivo: number;
  tarjeta: number;
  qr: number;
  descuentos: number;
  propinas: number;
  pagosProcesados: number;
  fechaCierreBolivia?: string;
  fechaCierre: string | Date;
}
