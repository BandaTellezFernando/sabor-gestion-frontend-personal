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
