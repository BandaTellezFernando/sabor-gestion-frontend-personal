import type { UnidadMedida } from '@/types/ingrediente';

const UNIDADES_MASA: UnidadMedida[] = ['kg', 'g', 'mg'];
const UNIDADES_VOLUMEN: UnidadMedida[] = ['L', 'ml'];
const UNIDADES_CONTEO: UnidadMedida[] = ['unidad'];

export function obtenerUnidadesCompatibles(unidadStock: string): UnidadMedida[] {
  if (UNIDADES_MASA.includes(unidadStock as UnidadMedida)) {
    return [...UNIDADES_MASA];
  }

  if (UNIDADES_VOLUMEN.includes(unidadStock as UnidadMedida)) {
    return [...UNIDADES_VOLUMEN];
  }

  if (UNIDADES_CONTEO.includes(unidadStock as UnidadMedida)) {
    return [...UNIDADES_CONTEO];
  }

  return [];
}
