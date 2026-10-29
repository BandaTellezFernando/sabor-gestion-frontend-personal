//src/types/mesa.ts
export type EstadoMesa = 'Libre' | 'Ocupada' | 'Cuenta Solicitada';

export interface Ubicacion {
  _id: string;
  nombre: string;
  descripcion?: string;
}

export interface Mesa {
  _id: string;
  numero: string;
  capacidad: number;
  ubicacion: string;
  ubicacionId?: string | Ubicacion;
  estado: EstadoMesa;
  createdAt?: string;
  updatedAt?: string;
  estadoFusion?: EstadoFusionMesa;
  fusionadaEn?: string | null;
  mesasOrigen?: MesaOrigenFusion[];
  fusionDisueltaAt?: string | null;
  fusionCanceladaAt?: string | null;
  /** Preferencia visual local del mapa; no es un campo de negocio del backend. */
  formaFusion?: 'Lineal' | 'Cuadrada';
}

export type EstadoFusionMesa =
  | 'Individual'
  | 'Fusionada'
  | 'Integrada'
  | 'Disuelta'
  | 'Cancelada';

export interface MesaOrigenFusion {
  mesaId: string;
  numero: string;
  capacidad: number;
  ubicacion: string;
  ubicacionId?: string | null;
}

export interface CrearMesaDTO {
  numero: string;
  capacidad: number;
  ubicacion: string;
  ubicacionId?: string;
}

export interface ActualizarMesaDTO {
  numero?: string;
  capacidad?: number;
  ubicacion?: string;
}

export interface ActualizarEstadoMesaDTO {
  estado: EstadoMesa;
}

export interface OcupacionTemporalDTO {
  id?: string;
  mesaId: string;
  usuarioId?: string;
  creadaEn?: string | Date;
  expiraEn: string | Date;
  minutosRestantes?: number;
  segundosRestantes?: number;
}

export interface RespuestaOcuparTemporal {
  mensaje?: string;
  mesa: Mesa;
  ocupacion: OcupacionTemporalDTO;
}

export interface RespuestaConsultarOcupacion {
  activa: boolean;
  esPropietario?: boolean;
  mesaId?: string;
  usuarioId?: string;
  creadaEn?: string | Date;
  expiraEn?: string | Date;
  minutosRestantes?: number;
  segundosRestantes?: number;
  mesa?: Mesa;
  ocupacion?: OcupacionTemporalDTO;
}

/**
 * Representación de un item en el borrador local de comanda.
 * Los datos descriptivos (nombre, precio, imagenUrl) son solo para soporte visual en UI.
 * La autoridad financiera y de disponibilidad la mantiene siempre el backend.
 */
export interface ComandaDraftItem {
  platoId: string;
  nombre: string;
  precio: number;
  imagenUrl?: string;
  cantidad: number;
  observacion: string;
}

export interface ComandaDraft {
  mesaId: string;
  mesaNumero: string;
  ocupacionExpiraEn: string;
  items: ComandaDraftItem[];
  guardadoEn: number;
}
