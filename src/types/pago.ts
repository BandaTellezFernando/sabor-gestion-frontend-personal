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
  metodoPago: MetodoPago;
  cajeroAsignado?: string | null;
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
