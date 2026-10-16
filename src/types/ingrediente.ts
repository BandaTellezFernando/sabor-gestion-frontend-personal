export type UnidadMedida = 'kg' | 'g' | 'mg' | 'L' | 'ml' | 'unidad';

export const UNIDADES_MEDIDA: UnidadMedida[] = [
  'kg',
  'g',
  'mg',
  'L',
  'ml',
  'unidad',
];

export interface Ingrediente {
  _id: string;
  id?: string;
  nombre: string;
  unidadMedida: UnidadMedida;
  disponible: boolean;
  stockActual: number;
  fechaRegistro?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrearIngredienteDTO {
  nombre: string;
  unidadMedida: UnidadMedida;
  stockActual: number;
  disponible?: boolean;
}

export interface ActualizarIngredienteDTO {
  nombre?: string;
  stockActual?: number;
  disponible?: boolean;
}