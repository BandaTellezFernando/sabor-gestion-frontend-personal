import { Mesa } from './mesa';
import { Pedido } from './pedido';
import { Usuario } from './usuario';

export type EstadoCuentaMesa = 'PENDIENTE_PAGO' | 'PAGADA' | 'ANULADA';

/** Cuenta consolidada de todas las comandas elegibles de una mesa. */
export interface CuentaMesaDTO {
  _id: string;
  codigoCuenta: string;
  mesa: string | Mesa;
  pedidos: Pedido[];
  estado: EstadoCuentaMesa;
  subtotal: number;
  montoPropina: number;
  total: number;
  clienteNombre?: string;
  clienteCI?: string;
  clienteNIT?: string;
  metodoPago?: 'Efectivo' | 'Tarjeta' | 'QR' | string;
  cajero?: string | Usuario;
  creadoPor?: string | Usuario;
  pago?: string;
  fechaSolicitud: string | Date;
  fechaPago?: string | Date | null;
}

export interface RespuestaCrearCuentaMesa {
  mensaje: string;
  cuenta: CuentaMesaDTO;
}

export interface RespuestaListarCuentasMesa {
  cuentas: CuentaMesaDTO[];
}
