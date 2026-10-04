export interface Ingrediente {
  _id: string;
  id?: string;
  nombre: string;
  unidadMedida: string;
  disponible: boolean;
  fechaRegistro?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrearIngredienteDTO {
  nombre: string;
  unidadMedida: string;
  disponible?: boolean;
}

export interface ActualizarIngredienteDTO {
  nombre?: string;
  unidadMedida?: string;
  disponible?: boolean;
}
