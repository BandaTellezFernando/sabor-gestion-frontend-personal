export interface Categoria {
  _id: string;
  nombre: string;
}

export interface Plato {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl: string;
  imagenPublicId: string;
  disponible: boolean;
  categoria: string | Categoria;
}
