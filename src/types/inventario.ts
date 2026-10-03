import { Plato } from './plato';

export type UnidadMedida = 'kg' | 'g' | 'l' | 'ml' | 'unidades';

export interface Ingrediente {
  _id: string;
  nombre: string;
  unidadMedida: UnidadMedida;
  disponible: boolean;
  fechaRegistro: string | Date;
}

export interface RecetaIngrediente {
  ingrediente: string | Ingrediente;
  cantidadNecesaria: number;
}

export interface Receta {
  _id: string;
  plato: string | Plato;
  ingredientes: RecetaIngrediente[];
}
