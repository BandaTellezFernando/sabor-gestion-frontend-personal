import type { Mesa } from '@/types';

/**
 * Formatea un importe monetario con el estilo del sistema (Bs. 0.00).
 */
export function formatBs(value: number | string | null | undefined): string {
  const monto = Number(value ?? 0);
  return `Bs. ${(Number.isFinite(monto) ? monto : 0).toFixed(2)}`;
}

/**
 * Devuelve la hora local boliviana de una fecha, o un guion si no es válida.
 */
export function formatHora(fecha: string | Date | null | undefined): string {
  if (!fecha) return '—';
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Fecha larga de la jornada actual, tal como se muestra en los encabezados.
 */
export function formatFechaLarga(fecha: Date = new Date()): string {
  return fecha.toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Nombre legible de la mesa de un pedido, tolerando que el backend
 * envíe el documento poblado o solo su identificador.
 */
export function getMesaNombre(mesa: string | Mesa | null | undefined): string {
  if (!mesa) return 'Mesa sin asignar';
  if (typeof mesa === 'object') return `Mesa ${mesa.numero}`;
  if (/^[0-9a-fA-F]{24}$/.test(mesa)) return `Mesa (${mesa.slice(-4)})`;
  return mesa.toLowerCase().startsWith('mesa') ? mesa : `Mesa ${mesa}`;
}
