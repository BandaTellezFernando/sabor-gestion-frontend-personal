export interface Ingrediente {
  _id: string;
  id?: string;
  nombre: string;
  unidadMedida: string;
  disponible: boolean;
  stockActual: number;
  fechaRegistro?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrearIngredienteDTO {
  nombre: string;
  unidadMedida: string;
  stockActual: number;
  disponible?: boolean;
}

export interface ActualizarIngredienteDTO {
  nombre?: string;
  stockActual?: number;
  disponible?: boolean;
}