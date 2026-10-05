
//src/types/pedido.ts
import { Plato } from './plato';
import { Mesa } from './mesa';
import { Usuario } from './usuario';

export type EstadoPedido = 'ABIERTO' | 'EN_PREPARACION' | 'ENTREGADO' | 'CANCELADO' | 'CERRADO';
export type MetodoPago = 'Efectivo' | 'Tarjeta' | 'QR';

export interface DetallePedido {
  plato: string | Plato;
  nombrePlato?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  observacion: string;
}

export interface Pedido {
  _id: string;
  codigo: string;
  fechaDiaBolivia?: string;
  fechaHoraBolivia?: string;
  fechaHora: string | Date;
  estado: EstadoPedido;
  total: number;
  mesa?: string | Mesa;
  usuario: string | Usuario;
  detalles: DetallePedido[];
  qrUrl?: string;
  metodoPago?: MetodoPago;
  montoDescuento?: number;
  montoPropina?: number;
  subtotalCierre?: number;
  clienteNombre?: string;
  clienteCI?: string;
  clienteNIT?: string;
  cajeroAsignado?: string | Usuario;
  recogido?: boolean;
  recogidoPor?: string | Usuario;
  fechaRecogida?: string | Date;
  fechaRecogidaBolivia?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DetallePedidoItemDTO {
  plato: string;
  cantidad: number;
  observacion?: string;
}

export interface CrearPedidoDTO {
  mesa: string;
  detalles: DetallePedidoItemDTO[];
  montoDescuento?: number;
  montoPropina?: number;
  clienteNombre?: string;
  clienteCI?: string;
  clienteNIT?: string;
}

export interface ActualizarPedidoDTO {
  detalles?: DetallePedidoItemDTO[];
  montoDescuento?: number;
  montoPropina?: number;
  clienteNombre?: string;
  clienteCI?: string;
  clienteNIT?: string;
}

export interface ActualizarEstadoPedidoDTO {
  estado: 'EN_PREPARACION' | 'ENTREGADO';
}

export interface PedidosQueryParams {
  hoy?: boolean | string;
  fecha?: string;
  mesa?: string;
  activo?: boolean | string;
  cajero?: string;
  mesero?: string;
  reportesCierre?: boolean | string;
  recogido?: boolean | string;
  incluirRecogidos?: boolean | string;
}

export interface RespuestaRecogerPedido {
  mensaje: string;
  recogido: boolean;
  recogidoPor: string;
  fechaRecogida: string | Date;
  fechaRecogidaBolivia?: string;
  pedido: Pedido;
}

export interface CocinaPedidoRecogidoPayload {
  pedidoId: string;
  codigo?: string;
  mesaId?: string;
  mesaNombre?: string;
  recogido: boolean;
  recogidoPor?: string;
  fechaRecogida?: string | Date;
}

export interface MesasAlertaListoPayload {
  pedidoId: string;
  mesaId?: string;
  mesaNombre?: string;
}
