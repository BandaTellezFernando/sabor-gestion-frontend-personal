export interface Categoria {
  _id: string;
  id?: string;
  nombre: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrearCategoriaDTO {
  nombre: string;
}

export interface ActualizarCategoriaDTO {
  nombre: string;
}
