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

/** DTO legado para eventos y pagos antiguos por pedido. */
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
  montoRecibido?: number;
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
  comprobantePdf?: ComprobantePdfDTO;
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

export interface ComprobantePdfDTO {
  nombreArchivo: string;
  tipoContenido: 'application/pdf';
  contenidoBase64: string;
}

export interface DatosQRCuentaResponse {
  codigoCuenta: string;
  urlPago: string;
  total: number;
}

export interface DatosTarjetaSimuladaDTO {
  titular: string;
  numero: string;
  vencimiento: string;
  cvv: string;
}

export interface ProcesarPagoCuentaRequestDTO {
  metodoPago: MetodoPago;
  montoPropina?: number;
  montoRecibido?: number;
  clienteNombre?: string;
  clienteCI?: string;
  clienteNIT?: string;
  tarjeta?: DatosTarjetaSimuladaDTO;
}

export interface ResultadoProcesarPagoCuentaDTO {
  cuentaId: string;
  codigoCuenta: string;
  pagoId: string;
  codigoPago: string;
  mesaId: string;
  pedidosIds: string[];
  subtotal: number;
  propina: number;
  totalPagado: number;
  montoRecibido?: number;
  cambio?: number;
  metodoPago: MetodoPago;
  estadoPago: 'Pagado';
  fechaPago: string | Date;
  comprobantePdf?: ComprobantePdfDTO;
}

export interface ProcesarPagoCuentaResponse {
  mensaje: string;
  pago: ResultadoProcesarPagoCuentaDTO;
  comprobantePdf: ComprobantePdfDTO;
}

export interface EstadoQRCuentaResponse {
  codigoCuenta: string;
  estado: string;
  yaPagada: boolean;
  subtotal: number;
  propina: number;
  propinaAnadida: boolean;
  total: number;
  metodoPago?: string;
  fechaPago?: string | Date | null;
  pedidos: Array<{
    codigo: string;
    fecha: string;
    estado: string;
    subtotal: number;
    detalles: Array<{
      nombre: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
      observacion: string;
    }>;
  }>;
}

export interface ConfirmarPagoQRCuentaResponse {
  exito?: boolean;
  yaPagada: boolean;
  mensaje: string;
  pago?: ResultadoProcesarPagoCuentaDTO;
  comprobantePdf?: ComprobantePdfDTO;
  codigoCuenta?: string;
  total?: number;
  metodoPago?: string;
  fechaPago?: string | Date | null;
}

export interface ComprobantePago {
  pedidoId: string;
  pedidosIds?: string[];
  cuentaId?: string;
  codigoCuenta?: string;
  codigoPago?: string;
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
  montoRecibido?: number;
  cambio?: number;
  comprobantePdf?: ComprobantePdfDTO;
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
