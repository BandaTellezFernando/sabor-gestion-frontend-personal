//src/types/receta.ts
import { Plato } from './plato';
import { Ingrediente, UnidadMedida } from './ingrediente';

export interface RecetaIngredienteDetalle {
  ingrediente: string | Ingrediente;
  cantidadNecesaria: number;
  unidadMedida: UnidadMedida;
}

export interface Receta {
  _id: string;
  id?: string;
  plato: string | Plato;
  ingredientes: RecetaIngredienteDetalle[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GuardarRecetaDTO {
  plato: string;
  ingredientes: {
    ingrediente: string;
    cantidadNecesaria: number;
  unidadMedida: UnidadMedida;
  }[];
}

export interface RespuestaGuardarReceta {
  mensaje: string;
  receta: Receta;
}
