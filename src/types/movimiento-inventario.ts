export interface UsuarioMovimientoResumen {
  _id: string;
  nombre?: string;
  apellido?: string;
}

export interface DetallePlatoMovimiento {
  plato: string;
  nombrePlato: string;
  cantidadPlatos: number;
  cantidadNecesariaPorPlato: number;
  unidadReceta: string;
  cantidadPorPlatoEnStock: number;
  unidadStock: string;
  consumoTotal: number;
  observacion?: string;
}

export interface ConsumoIngredienteMovimiento {
  ingrediente: string;
  nombreIngrediente: string;
  unidadStock: string;
  cantidadTotal: number;
  detallePlatos: DetallePlatoMovimiento[];
}

export interface MovimientoInventario {
  _id: string;
  pedido: string;
  codigoPedido: string;
  fechaHora: string;
  usuario: string | UsuarioMovimientoResumen | null;
  consumos: ConsumoIngredienteMovimiento[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginacionMovimientosInventario {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

export interface FiltrosMovimientosInventario {
  pagina: number;
  limite: number;
  codigoPedido?: string;
  desde?: string;
  hasta?: string;
}

export interface RespuestaMovimientosInventario {
  movimientos: MovimientoInventario[];
  paginacion: PaginacionMovimientosInventario;
}
