import { apiClient } from '@/lib/api-client';
import {
  Mesa,
  CrearMesaDTO,
  ActualizarMesaDTO,
  EstadoMesa,
  OcupacionTemporalDTO,
  RespuestaOcuparTemporal,
  RespuestaConsultarOcupacion,
} from '@/types';

export interface MesaBackendRaw {
  _id?: string;
  id?: string;
  numero?: string;
  name?: string;
  capacidad?: number;
  capacity?: number;
  ubicacion?: string;
  location?: string;
  ubicacionId?: string | { _id?: string; nombre?: string; name?: string };
  locationId?: string | null;
  estado?: string;
  status?: string;
  tipo?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Normaliza los atributos devueltos por el backend para asegurar
 * compatibilidad tanto con documentos crudos de MongoDB como con DTOs.
 */
export function normalizeMesa(data: MesaBackendRaw): Mesa {
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
    _id: String(data._id || data.id || ''),
    numero: data.numero || data.name || '',
    capacidad: Number(data.capacidad ?? data.capacity ?? 0),
    ubicacion: data.ubicacion || data.location || '',
    ubicacionId:
      typeof data.ubicacionId === 'object' && data.ubicacionId !== null && '_id' in data.ubicacionId
        ? { _id: String(data.ubicacionId._id || ''), nombre: String(data.ubicacionId.nombre || data.ubicacionId.name || '') }
        : (data.ubicacionId as string | undefined) || (data.locationId ?? undefined),
    estado,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Datos mínimos de una mesa original necesarios para unirla con otra.
 * Se conservan para poder restaurar las mesas si la operación falla a medias.
 */
export interface MesaOrigenUnion {
  _id: string;
  numero: string;
  capacidad: number;
  ubicacion: string;
  ubicacionId?: string;
}

/**
 * Payload para fusionar dos o más mesas libres de la misma zona en una sola mesa.
 */
export interface UnirMesasDTO {
  mesas: MesaOrigenUnion[];
  numero: string;
  ubicacion: string;
  ubicacionId?: string;
}

export interface ResultadoUnirMesas {
  mesa: Mesa;
  mesasEliminadas: string[];
}

export function getUbicacionId(mesa: Mesa): string | undefined {
  if (typeof mesa.ubicacionId === 'object' && mesa.ubicacionId !== null) {
    return mesa.ubicacionId._id;
  }
  return mesa.ubicacionId;
}

/**
 * Datos de una mesa que se recreará al deshacer una fusión.
 */
export interface MesaSeparada {
  numero: string;
  capacidad: number;
  ubicacion: string;
  ubicacionId?: string;
}

export interface ResultadoDesunirMesa {
  mesasCreadas: Mesa[];
  mesaEliminada: string;
}

/**
 * El backend no guarda metadatos de la fusión, así que las mesas originales
 * se recuerdan en el navegador que hizo la unión. Si el registro no existe
 * (otro dispositivo, caché limpia), se reconstruyen desde el nombre "A + B".
 */
const FUSIONES_STORAGE_KEY = 'sabor:mesas-fusionadas';

function esMesaOrigenValida(valor: unknown): valor is MesaOrigenUnion {
  if (!valor || typeof valor !== 'object') return false;
  const origen = valor as Partial<MesaOrigenUnion>;
  return (
    typeof origen._id === 'string' &&
    typeof origen.numero === 'string' &&
    typeof origen.capacidad === 'number' &&
    typeof origen.ubicacion === 'string'
  );
}

function leerFusionesRegistradas(): Record<string, MesaOrigenUnion[]> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(FUSIONES_STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const fusiones: Record<string, MesaOrigenUnion[]> = {};
    for (const [mesaId, valor] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(valor) || valor.length < 2) continue;
      const mesas = valor.filter(esMesaOrigenValida);
      if (mesas.length >= 2) fusiones[mesaId] = mesas;
    }
    return fusiones;
  } catch {
    return {};
  }
}

function registrarFusion(mesaId: string, origen: MesaOrigenUnion[]): void {
  if (typeof window === 'undefined') return;

  try {
    const fusiones = leerFusionesRegistradas();
    fusiones[mesaId] = origen;
    window.localStorage.setItem(FUSIONES_STORAGE_KEY, JSON.stringify(fusiones));
  } catch {
    // Almacenamiento no disponible: la separación usará el nombre "A + B".
  }
}

function olvidarFusion(mesaId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const fusiones = leerFusionesRegistradas();
    if (!(mesaId in fusiones)) return;
    delete fusiones[mesaId];
    window.localStorage.setItem(FUSIONES_STORAGE_KEY, JSON.stringify(fusiones));
  } catch {
    // Almacenamiento no disponible.
  }
}

/**
 * Calcula las mesas que se recrearán al desunir una mesa fusionada (soporta 2 o más).
 * Devuelve `null` si la mesa no proviene de una unión.
 */
export function calcularMesasSeparadas(
  mesa: Mesa
): MesaSeparada[] | null {
  const registrada = leerFusionesRegistradas()[mesa._id];
  if (registrada && registrada.length >= 2) {
    return registrada.map((item) => ({
      numero: item.numero.replace(/\[.*?\]/g, '').trim(),
      capacidad: item.capacidad,
      ubicacion: item.ubicacion,
      ubicacionId: item.ubicacionId,
    }));
  }

  const cleanNumero = mesa.numero.replace(/\[.*?\]/g, '').trim();
  const nombres = cleanNumero
    .split(/\+|\b(?:y|and)\b|&/i)
    .map((nombre) => nombre.trim())
    .filter((nombre) => nombre.length > 0);
  if (nombres.length < 2) return null;

  const totalCap = Math.max(nombres.length, Number(mesa.capacidad) || nombres.length * 2);
  const baseCap = Math.max(1, Math.floor(totalCap / nombres.length));
  let remainder = totalCap - baseCap * nombres.length;
  const ubicacionId = getUbicacionId(mesa);

  return nombres.map((nombre) => {
    const cap = baseCap + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    return {
      numero: nombre,
      capacidad: cap,
      ubicacion: mesa.ubicacion,
      ubicacionId,
    };
  });
}

/** Indica si la mesa es el resultado de una unión y puede desunirse. */
export function esMesaFusionada(mesa: Mesa): boolean {
  return calcularMesasSeparadas(mesa) !== null;
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
    olvidarFusion(id);
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
   * Fusiona dos mesas libres de la misma ubicación en una sola:
   * crea la mesa nueva con la capacidad sumada y elimina las dos originales.
   *
   * NOTA: se compone con los endpoints existentes (POST /mesas y DELETE /mesas/:id)
   * porque el backend aún no expone una operación atómica. Si más adelante se agrega
   * un endpoint dedicado (por ejemplo POST /mesas/unir), basta con reemplazar el
   * cuerpo de esta función por esa única llamada.
   */
  async unirMesas(data: UnirMesasDTO): Promise<ResultadoUnirMesas> {
    if (data.mesas.length < 2) {
      throw new Error('Debes seleccionar al menos 2 mesas para unirlas.');
    }

    const numero = data.numero.trim();
    if (!numero) {
      throw new Error('La nueva mesa necesita un nombre o número.');
    }

    const ids = new Set(data.mesas.map((m) => m._id));
    if (ids.size !== data.mesas.length) {
      throw new Error('No puedes unir mesas duplicadas.');
    }

    const zonas = new Set(
      data.mesas.map((m) => m.ubicacion.trim().toLowerCase())
    );
    if (zonas.size !== 1) {
      throw new Error('Solo se pueden unir mesas que pertenecen a la misma ubicación.');
    }

    // La capacidad siempre se recalcula sumando las sillas de todas las mesas seleccionadas.
    const capacidad = data.mesas.reduce(
      (acc, mesa) => acc + (Number(mesa.capacidad) || 0),
      0
    );
    if (!Number.isInteger(capacidad) || capacidad < 1) {
      throw new Error('La capacidad resultante de la unión no es válida.');
    }

    const mesaFusionada = await mesaService.crearMesa({
      numero,
      capacidad,
      ubicacion: data.ubicacion,
      ubicacionId: data.ubicacionId,
    });

    const mesasEliminadas: string[] = [];

    try {
      for (const mesa of data.mesas) {
        await mesaService.eliminarMesa(mesa._id);
        mesasEliminadas.push(mesa._id);
      }
    } catch (err: unknown) {
      // Compensación: si no se pudieron borrar las dos mesas originales,
      // se deshace la fusión para no dejar mesas duplicadas en el salón.
      await mesaService.eliminarMesa(mesaFusionada._id).catch(() => undefined);

      for (const mesa of data.mesas) {
        if (!mesasEliminadas.includes(mesa._id)) continue;
        await mesaService
          .crearMesa({
            numero: mesa.numero,
            capacidad: mesa.capacidad,
            ubicacion: mesa.ubicacion,
            ubicacionId: mesa.ubicacionId,
          })
          .catch(() => undefined);
      }

      throw new Error(
        `No se pudieron eliminar las mesas originales: ${
          err instanceof Error ? err.message : 'error del servidor'
        }. La unión fue cancelada.`
      );
    }

    registrarFusion(mesaFusionada._id, data.mesas);

    return { mesa: mesaFusionada, mesasEliminadas };
  },

  /**
   * Deshace una fusión: elimina la mesa unida primero para liberar índices en MongoDB,
   * y luego recrea las dos mesas originales con su zona y capacidad.
   * Solo se permite mientras la mesa esté 'Libre'.
   */
  async desunirMesa(mesa: Mesa): Promise<ResultadoDesunirMesa> {
    if (mesa.estado !== 'Libre') {
      throw new Error('Solo se puede desunir una mesa en estado Libre.');
    }

    let separadas: MesaSeparada[] | null = calcularMesasSeparadas(mesa);
    if (!separadas) {
      const cleanNumero = mesa.numero.replace(/\[.*?\]/g, '').trim();
      const nombres = cleanNumero
        .split(/\+|\b(?:y|and)\b|&/i)
        .map((nombre) => nombre.trim())
        .filter((nombre) => nombre.length > 0);

      if (nombres.length < 2) {
        throw new Error('Esta mesa no proviene de una unión de mesas.');
      }

      const totalCap = Math.max(nombres.length, Number(mesa.capacidad) || nombres.length * 2);
      const baseCap = Math.max(1, Math.floor(totalCap / nombres.length));
      let remainder = totalCap - baseCap * nombres.length;
      const ubicacionId = getUbicacionId(mesa);

      separadas = nombres.map((nombre) => {
        const cap = baseCap + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        return {
          numero: nombre,
          capacidad: cap,
          ubicacion: mesa.ubicacion,
          ubicacionId,
        };
      });
    }

    // 1. Eliminar primero la mesa madre agrupada de MongoDB para liberar claves únicas
    await mesaService.eliminarMesa(mesa._id);

    const mesasCreadas: Mesa[] = [];

    try {
      // 2. Recrear las mesas individuales con nombres sanitizados y limpios
      for (const separada of separadas) {
        const nombreLimpio = separada.numero.replace(/\[.*?\]/g, '').trim();
        mesasCreadas.push(
          await mesaService.crearMesa({
            numero: nombreLimpio,
            capacidad: separada.capacidad,
            ubicacion: separada.ubicacion,
            ubicacionId: separada.ubicacionId,
          })
        );
      }
    } catch (err: unknown) {
      // Compensación: Si falló crear alguna hija, limpiar las creadas y restaurar la mesa madre
      for (const creada of mesasCreadas) {
        await mesaService.eliminarMesa(creada._id).catch(() => undefined);
      }

      await mesaService
        .crearMesa({
          numero: mesa.numero,
          capacidad: mesa.capacidad,
          ubicacion: mesa.ubicacion,
          ubicacionId: getUbicacionId(mesa),
        })
        .catch(() => undefined);

      throw new Error(
        `No se pudieron recrear las mesas originales: ${
          err instanceof Error ? err.message : 'error del servidor'
        }.`
      );
    }

    return { mesasCreadas, mesaEliminada: mesa._id };
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
