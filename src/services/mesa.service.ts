//src/services/mesa.service.ts
import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-error';
import {
  Mesa,
  CrearMesaDTO,
  ActualizarMesaDTO,
  EstadoMesa,
  OcupacionTemporalDTO,
  RespuestaOcuparTemporal,
  RespuestaConsultarOcupacion,
} from '@/types';

const FORMAS_FUSION_STORAGE_KEY = 'sabor:mesas-forma-fusion';

type FormaFusion = 'Lineal' | 'Cuadrada';

function leerFormasFusion(): Record<string, FormaFusion> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(FORMAS_FUSION_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const result: Record<string, FormaFusion> = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value === 'Lineal' || value === 'Cuadrada') result[id] = value;
    }
    return result;
  } catch {
    return {};
  }
}

function guardarFormaFusion(mesaId: string, forma: FormaFusion): void {
  if (typeof window === 'undefined') return;
  try {
    const formas = leerFormasFusion();
    formas[mesaId] = forma;
    window.localStorage.setItem(FORMAS_FUSION_STORAGE_KEY, JSON.stringify(formas));
  } catch {
    // La forma es solo una preferencia visual; la fusión sigue persistida en el backend.
  }
}

function olvidarFormaFusion(mesaId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const formas = leerFormasFusion();
    delete formas[mesaId];
    window.localStorage.setItem(FORMAS_FUSION_STORAGE_KEY, JSON.stringify(formas));
  } catch {
    // Sin almacenamiento local se aplica la geometría predeterminada.
  }
}

function obtenerFormaFusion(mesaId: string): FormaFusion | undefined {
  return leerFormasFusion()[mesaId];
}

export interface MesaBackendRaw {
  _id?: string;
  id?: string;
  numero?: string;
  name?: string;
  capacidad?: number;
  capacity?: number;
  ubicacion?: string;
  location?: string;
  ubicacionId?: string | { _id?: string; nombre?: string; name?: string } | null;
  locationId?: string | null;
  estado?: string;
  status?: string;
  tipo?: string;
  type?: string;
  estadoFusion?: Mesa['estadoFusion'];
  fusionadaEn?: string | null;
  mesasOrigen?: Array<{
    mesaId: string;
    numero: string;
    capacidad: number;
    ubicacion: string;
    ubicacionId?: string | null;
  }>;
  fusionDisueltaAt?: string | null;
  fusionCanceladaAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Normaliza los atributos devueltos por el backend para asegurar
 * compatibilidad tanto con documentos crudos de MongoDB como con DTOs.
 */
export function normalizeMesa(data: MesaBackendRaw): Mesa {
  const mesaId = String(data._id || data.id || '');
  const rawEstado = data.estado || data.status;
  let estado: EstadoMesa = 'Libre';
  if (rawEstado === 'Ocupada') {
    estado = 'Ocupada';
  } else if (rawEstado === 'Cuenta Solicitada' || rawEstado === 'Esperando pago') {
    estado = 'Cuenta Solicitada';
  } else {
    estado = 'Libre';
  }

  return {
    _id: mesaId,
    numero: data.numero || data.name || '',
    capacidad: Number(data.capacidad ?? data.capacity ?? 0),
    ubicacion: data.ubicacion || data.location || '',
    ubicacionId:
      typeof data.ubicacionId === 'object' && data.ubicacionId !== null && '_id' in data.ubicacionId
        ? {
            _id: String(data.ubicacionId._id || ''),
            nombre: String(data.ubicacionId.nombre || data.ubicacionId.name || ''),
          }
        : (data.ubicacionId as string | undefined) || (data.locationId ?? undefined),
    estado,
    estadoFusion: data.estadoFusion,
    fusionadaEn: data.fusionadaEn ?? null,
    mesasOrigen: Array.isArray(data.mesasOrigen)
      ? data.mesasOrigen.map((origen) => ({
          mesaId: String(origen.mesaId),
          numero: origen.numero,
          capacidad: Number(origen.capacidad) || 0,
          ubicacion: origen.ubicacion,
          ubicacionId: origen.ubicacionId ?? null,
        }))
      : [],
    fusionDisueltaAt: data.fusionDisueltaAt ?? null,
    fusionCanceladaAt: data.fusionCanceladaAt ?? null,
    formaFusion: obtenerFormaFusion(mesaId),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/** Datos de las mesas seleccionadas para validación visual; los IDs son la carga útil real del API. */
export interface MesaOrigenUnion {
  _id: string;
  numero: string;
  capacidad: number;
  ubicacion: string;
  ubicacionId?: string;
  estadoFusion?: Mesa['estadoFusion'];
  cantidadOrigenes?: number;
}

/** Datos seleccionados en la interfaz. El servidor recibe únicamente sus IDs. */
export interface UnirMesasDTO {
  mesas: MesaOrigenUnion[];
  numero: string;
  ubicacion: string;
  ubicacionId?: string;
  forma?: FormaFusion;
}

export interface ResultadoUnirMesas {
  mensaje?: string;
  accion: 'fusionada' | 'ampliada';
  mesa: Mesa;
  mesasAfectadasIds: string[];
}

export function getUbicacionId(mesa: Mesa): string | undefined {
  if (typeof mesa.ubicacionId === 'object' && mesa.ubicacionId !== null) {
    return mesa.ubicacionId._id;
  }
  return mesa.ubicacionId;
}

export interface MesaSeparada {
  mesaId: string;
  numero: string;
  capacidad: number;
  ubicacion: string;
  ubicacionId?: string | null;
}

export interface ResultadoDesunirMesa {
  mesasRestauradas: Mesa[];
  mesaFusionadaId: string;
  mensaje?: string;
}

/** Las mesas originales se obtienen exclusivamente de los metadatos persistidos por el backend. */
export function calcularMesasSeparadas(mesa: Mesa): MesaSeparada[] | null {
  if (mesa.estadoFusion !== 'Fusionada' || !Array.isArray(mesa.mesasOrigen) || mesa.mesasOrigen.length < 2) {
    return null;
  }

  return mesa.mesasOrigen.map((origen) => ({
    mesaId: origen.mesaId,
    numero: origen.numero,
    capacidad: origen.capacidad,
    ubicacion: origen.ubicacion,
    ubicacionId: origen.ubicacionId ?? undefined,
  }));
}

/** Solo una fusión activa con metadatos completos puede restaurarse desde esta interfaz. */
export function esMesaFusionada(mesa: Mesa): boolean {
  return mesa.estadoFusion === 'Fusionada' && Array.isArray(mesa.mesasOrigen) && mesa.mesasOrigen.length >= 2;
}

/**
 * Servicio cliente para el módulo de Mesas.
 * Consume los endpoints oficiales de /api/mesas.
 */
export const mesaService = {
  async getMesas(location?: string): Promise<Mesa[]> {
    const list = await apiClient.get<MesaBackendRaw[]>('/mesas', {
      params: location ? { location } : undefined,
    });
    return Array.isArray(list) ? list.map(normalizeMesa) : [];
  },

  async getMesaById(id: string): Promise<Mesa> {
    const res = await apiClient.get<MesaBackendRaw>(`/mesas/${id}`);
    return normalizeMesa(res);
  },

  async crearMesa(data: CrearMesaDTO): Promise<Mesa> {
    const res = await apiClient.post<MesaBackendRaw>('/mesas', {
      numero: data.numero,
      capacidad: data.capacidad,
      ubicacion: data.ubicacion,
      ubicacionId: data.ubicacionId,
    });
    return normalizeMesa(res);
  },

  async actualizarMesa(id: string, data: ActualizarMesaDTO): Promise<Mesa> {
    const res = await apiClient.put<MesaBackendRaw>(`/mesas/${id}`, {
      numero: data.numero,
      capacidad: data.capacidad,
      ubicacion: data.ubicacion,
    });
    return normalizeMesa(res);
  },

  async actualizarEstado(id: string, estado: EstadoMesa): Promise<Mesa> {
    const res = await apiClient.patch<MesaBackendRaw>(`/mesas/${id}/estado`, { estado });
    return normalizeMesa(res);
  },

  async eliminarMesa(id: string): Promise<{ mensaje: string; mesa?: Mesa }> {
    const res = await apiClient.delete<{ mensaje: string; mesa?: MesaBackendRaw }>(`/mesas/${id}`);
    return {
      mensaje: res?.mensaje || 'Mesa eliminada correctamente',
      mesa: res?.mesa ? normalizeMesa(res.mesa) : undefined,
    };
  },

  /**
   * Adquiere un bloqueo atómico temporal de 10 minutos sobre una mesa en estado 'Libre'.
   * Seguridad: Mesero o Administrador.
   * Si responde 201: retorna la ocupación creada y la mesa en 'Ocupada'.
   * Si responde 409: lanza ApiError con statusCode 409 (conflicto de concurrencia).
   */
  async ocuparTemporal(id: string): Promise<RespuestaOcuparTemporal> {
    const res = await apiClient.post<{
      mensaje?: string;
      mesa: MesaBackendRaw;
      ocupacion: OcupacionTemporalDTO;
    }>(`/mesas/${id}/ocupar-temporal`);

    return {
      mensaje: res.mensaje,
      mesa: normalizeMesa(res.mesa),
      ocupacion: res.ocupacion,
    };
  },

  /**
   * Consulta el estado del bloqueo temporal, tiempo restante y propiedad para la mesa.
   */
  async consultarOcupacionTemporal(id: string): Promise<RespuestaConsultarOcupacion> {
    const res = await apiClient.get<{
      activa: boolean;
      esPropietario?: boolean;
      mesaId?: string;
      usuarioId?: string;
      creadaEn?: string | Date;
      expiraEn?: string | Date;
      minutosRestantes?: number;
      segundosRestantes?: number;
      mesa?: MesaBackendRaw;
      ocupacion?: OcupacionTemporalDTO;
    }>(`/mesas/${id}/ocupar-temporal`);

    return {
      activa: Boolean(res.activa),
      esPropietario: res.esPropietario,
      mesaId: res.mesaId || res.ocupacion?.mesaId,
      usuarioId: res.usuarioId || res.ocupacion?.usuarioId,
      creadaEn: res.creadaEn || res.ocupacion?.creadaEn,
      expiraEn: res.expiraEn || res.ocupacion?.expiraEn,
      minutosRestantes: res.minutosRestantes ?? res.ocupacion?.minutosRestantes,
      segundosRestantes: res.segundosRestantes ?? res.ocupacion?.segundosRestantes,
      mesa: res.mesa ? normalizeMesa(res.mesa) : undefined,
      ocupacion: res.ocupacion,
    };
  },

  /**
   * Crea o amplía una fusión mediante la operación transaccional del backend.
   * Las mesas originales se mantienen en la base de datos con estado Integrada.
   */
  async unirMesas(data: UnirMesasDTO): Promise<ResultadoUnirMesas> {
    if (data.mesas.length < 2) {
      throw new Error('Debes seleccionar al menos 2 mesas para unirlas.');
    }

    const mesaIds = data.mesas.map((mesa) => mesa._id);
    if (new Set(mesaIds).size !== mesaIds.length) {
      throw new Error('No puedes unir mesas duplicadas.');
    }

    const response = await apiClient.post<{
      mensaje?: string;
      accion?: string;
      mesa: MesaBackendRaw;
      mesas?: MesaBackendRaw[];
    }>('/mesas/unir', { mesaIds });

    if (!response?.mesa) {
      throw new Error('El servidor no devolvió la mesa fusionada. Actualiza la pantalla e inténtalo de nuevo.');
    }

    const mesaFusionada = normalizeMesa(response.mesa);
    const forma = data.forma ?? 'Lineal';
    guardarFormaFusion(mesaFusionada._id, forma);

    return {
      mensaje: response.mensaje,
      accion: response.accion === 'ampliada' ? 'ampliada' : 'fusionada',
      mesa: { ...mesaFusionada, formaFusion: forma },
      mesasAfectadasIds: mesaIds,
    };
  },

  /**
   * Restaura las mesas de origen conservando sus IDs.
   * El backend determina si corresponde cancelar una fusión sin pedidos o separar
   * una fusión que ya tiene historial.
   */
  async desunirMesa(mesa: Mesa): Promise<ResultadoDesunirMesa> {
    if (mesa.estado !== 'Libre') {
      throw new Error('Solo se puede restaurar una fusión cuando está libre.');
    }

    const separadas = calcularMesasSeparadas(mesa);
    if (!separadas) {
      throw new Error('El backend no proporcionó los metadatos de origen de esta fusión. Actualiza las mesas antes de continuar.');
    }

    let respuesta: { mensaje?: string; mesas?: MesaBackendRaw[] } | undefined;
    try {
      respuesta = await apiClient.post<{ mensaje?: string; mesas?: MesaBackendRaw[] }>(
        `/mesas/${encodeURIComponent(mesa._id)}/cancelar-fusion`,
        {}
      );
    } catch (error: unknown) {
      // Una fusión con pedidos históricos debe separarse, no cancelarse.
      if (!(error instanceof ApiError) || error.statusCode !== 409 || !/ya tuvo pedidos/i.test(error.message)) {
        throw error;
      }
      respuesta = await apiClient.post<{ mensaje?: string; mesas?: MesaBackendRaw[] }>(
        `/mesas/${encodeURIComponent(mesa._id)}/separar`,
        {}
      );
    }

    const origenIds = new Set(separadas.map((origen) => origen.mesaId));
    let mesasRestauradas: Mesa[] = [];

    // Preferimos el catálogo actual del servidor, ya que devuelve el estado persistido.
    try {
      const catalogo = await mesaService.getMesas();
      mesasRestauradas = catalogo.filter(
        (item) => origenIds.has(item._id) && item.estadoFusion !== 'Integrada'
      );
    } catch {
      // Si falla la consulta posterior, usamos los documentos de la respuesta del endpoint.
      mesasRestauradas = (respuesta?.mesas ?? [])
        .map(normalizeMesa)
        .filter((item) => origenIds.has(item._id) && item.estadoFusion !== 'Integrada');
    }

    if (mesasRestauradas.length === 0) {
      throw new Error('La operación se completó, pero no se pudieron recuperar las mesas restauradas. Actualiza la pantalla para sincronizar el catálogo.');
    }

    olvidarFormaFusion(mesa._id);
    return {
      mesasRestauradas,
      mesaFusionadaId: mesa._id,
      mensaje: respuesta?.mensaje,
    };
  },
  /**
   * Cancela la ocupación temporal de una mesa, devolviéndola voluntariamente a 'Libre'.
   * Solo el mesero propietario o un Administrador pueden cancelarla.
   */
  async cancelarOcupacionTemporal(id: string): Promise<{ mensaje: string; mesa?: Mesa }> {
    const res = await apiClient.delete<{ mensaje: string; mesa?: MesaBackendRaw }>(
      `/mesas/${id}/ocupar-temporal`
    );
    return {
      mensaje: res?.mensaje || 'Ocupación temporal cancelada exitosamente',
      mesa: res?.mesa ? normalizeMesa(res.mesa) : undefined,
    };
  },
};
