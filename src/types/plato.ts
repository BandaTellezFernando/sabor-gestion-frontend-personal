import { Categoria } from './categoria';

export type { Categoria };

export interface Plato {
  _id: string;
  id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl: string;
  imagenPublicId: string;
  disponible: boolean;
  categoria: string | Categoria;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrearPlatoDTO {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagenUrl?: string;
  imagenPublicId?: string;
  disponible?: boolean;
}

export interface ActualizarPlatoDTO {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  categoria?: string;
  imagenUrl?: string;
  imagenPublicId?: string;
  disponible?: boolean;
}
