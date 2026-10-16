import { Categoria } from './categoria';
import { UnidadMedida } from './ingrediente';

export type { Categoria };

export interface IngredienteRecetaDTO {
  ingrediente: string;
  cantidadNecesaria: number;
  unidadMedida: UnidadMedida;
}

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
  ingredientes: IngredienteRecetaDTO[];
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