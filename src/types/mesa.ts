export type EstadoMesa = 'Libre' | 'Ocupada' | 'Cuenta Solicitada';
export type TipoMesa = 'Standard' | 'VIP' | 'Terraza' | 'Barra';

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
  tipo?: TipoMesa;
  createdAt?: string;
  updatedAt?: string;
}
