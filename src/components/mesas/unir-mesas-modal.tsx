'use client';

import React, { useMemo, useState } from 'react';
import { Mesa } from '@/types';
import {
  MesaOrigenUnion,
  UnirMesasDTO,
  getUbicacionId,
} from '@/services/mesa.service';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Check, MapPin, Merge, Users } from 'lucide-react';

export interface UnirMesasModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Lista completa de mesas del salón (se filtran las libres puertas adentro). */
  mesas: Mesa[];
  onConfirm: (data: UnirMesasDTO) => Promise<void>;
}

interface UnirMesasContentProps {
  mesas: Mesa[];
  onClose: () => void;
  onConfirm: (data: UnirMesasDTO) => Promise<void>;
}

interface ZonaDisponible {
  ubicacion: string;
  mesas: Mesa[];
}

const SIN_ZONA = 'Sin zona';

function toMesaOrigen(mesa: Mesa): MesaOrigenUnion {
  return {
    _id: mesa._id,
    numero: mesa.numero,
    capacidad: mesa.capacidad,
    ubicacion: mesa.ubicacion,
    ubicacionId: getUbicacionId(mesa),
  };
}

function UnirMesasContent({ mesas, onClose, onConfirm }: UnirMesasContentProps) {
  // Únicamente mesas libres, agrupadas por zona con al menos 2 candidatas.
  const zonas = useMemo<ZonaDisponible[]>(() => {
    const agrupadas = new Map<string, Mesa[]>();

    for (const mesa of mesas) {
      if (mesa.estado !== 'Libre') continue;
      const zona = mesa.ubicacion?.trim() || SIN_ZONA;
      const grupo = agrupadas.get(zona) ?? [];
      grupo.push(mesa);
      agrupadas.set(zona, grupo);
    }

    return Array.from(agrupadas.entries())
      .filter(([, mesasZona]) => mesasZona.length >= 2)
      .map(([ubicacion, mesasZona]) => ({
        ubicacion,
        mesas: [...mesasZona].sort((a, b) =>
          a.numero.localeCompare(b.numero, 'es', { numeric: true })
        ),
      }))
      .sort((a, b) => a.ubicacion.localeCompare(b.ubicacion, 'es'));
  }, [mesas]);

  const [ubicacion, setUbicacion] = useState<string>(zonas[0]?.ubicacion ?? '');
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const [numero, setNumero] = useState<string>('');
  const [nombreEditado, setNombreEditado] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const mesasZona = useMemo(
    () => zonas.find((zona) => zona.ubicacion === ubicacion)?.mesas ?? [],
    [zonas, ubicacion]
  );

  const mesasSeleccionadas = useMemo(
    () => mesasZona.filter((mesa) => seleccionadas.includes(mesa._id)),
    [mesasZona, seleccionadas]
  );

  const capacidadTotal = useMemo(
    () =>
      mesasSeleccionadas.reduce(
        (acc, mesa) => acc + (Number(mesa.capacidad) || 0),
        0
      ),
    [mesasSeleccionadas]
  );

  const puedeUnir = mesasSeleccionadas.length >= 2 && numero.trim().length > 0;

  const handleSelectZona = (nuevaZona: string) => {
    setUbicacion(nuevaZona);
    setSeleccionadas([]);
    setNumero('');
    setNombreEditado(false);
    setFormError(null);
  };

  const handleToggleMesa = (mesa: Mesa) => {
    if (mesa.estado !== 'Libre') return;

    setFormError(null);

    const yaSeleccionada = seleccionadas.includes(mesa._id);
    let siguiente: string[];

    if (yaSeleccionada) {
      siguiente = seleccionadas.filter((id) => id !== mesa._id);
    } else {
      siguiente = [...seleccionadas, mesa._id];
    }

    setSeleccionadas(siguiente);

    if (!nombreEditado) {
      const nombres = mesasZona
        .filter((candidata) => siguiente.includes(candidata._id))
        .map((candidata) => candidata.numero);
      setNumero(nombres.length >= 2 ? nombres.join(' + ') : '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (mesasSeleccionadas.length < 2) {
      setFormError('Selecciona al menos 2 mesas libres para unirlas.');
      return;
    }

    if (mesasSeleccionadas.some((m) => m.estado !== 'Libre')) {
      setFormError('Solo se pueden unir mesas en estado Libre.');
      return;
    }

    const zonaBase = mesasSeleccionadas[0].ubicacion.trim().toLowerCase();
    if (
      mesasSeleccionadas.some(
        (m) => m.ubicacion.trim().toLowerCase() !== zonaBase
      )
    ) {
      setFormError('Todas las mesas deben pertenecer a la misma ubicación.');
      return;
    }

    const nombreFinal = numero.trim();
    if (!nombreFinal) {
      setFormError('La nueva mesa necesita un nombre o número.');
      return;
    }

    if (!Number.isInteger(capacidadTotal) || capacidadTotal < 1) {
      setFormError('La capacidad resultante no es válida.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        mesas: mesasSeleccionadas.map(toMesaOrigen),
        numero: nombreFinal,
        ubicacion: mesasSeleccionadas[0].ubicacion.trim(),
        ubicacionId: getUbicacionId(mesasSeleccionadas[0]),
      });
      onClose();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'No se pudieron unir las mesas. Inténtalo nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (zonas.length === 0) {
    return (
      <div className="space-y-4">
        <Alert variant="warning" title="Sin mesas disponibles para unir">
          Necesitas al menos 2 mesas libres dentro de la misma ubicación para poder
          unirlas.
        </Alert>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <Alert variant="error" title="No se pudo unir las mesas">
          {formError}
        </Alert>
      )}

      {/* Paso 1: zona del salón */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          1. Ubicación
        </p>
        <div className="flex flex-wrap gap-2">
          {zonas.map((zona) => {
            const activa = zona.ubicacion === ubicacion;
            return (
              <button
                key={zona.ubicacion}
                type="button"
                onClick={() => handleSelectZona(zona.ubicacion)}
                aria-pressed={activa}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  activa
                    ? 'border-[#C84B26] bg-[#C84B26]/10 text-[#C84B26] dark:bg-[#C84B26]/20 dark:text-[#E05A36]'
                    : 'border-stone-300 text-stone-600 hover:border-stone-400 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {zona.ubicacion}
                <span className="rounded-full bg-stone-200/80 px-1.5 text-[10px] font-bold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                  {zona.mesas.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Paso 2: mesas libres de la zona */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            2. Selecciona las mesas a unir (mínimo 2)
          </p>
          <Badge variant={seleccionadas.length >= 2 ? 'success' : 'neutral'}>
            {seleccionadas.length} seleccionada{seleccionadas.length === 1 ? '' : 's'}
          </Badge>
        </div>

        {mesasZona.length < 2 ? (
          <Alert variant="warning" title="Zona sin mesas suficientes">
            Esta ubicación ya no tiene 2 mesas libres disponibles.
          </Alert>
        ) : (
          <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {mesasZona.map((mesa) => {
              const activa = seleccionadas.includes(mesa._id);

              return (
                <button
                  key={mesa._id}
                  type="button"
                  onClick={() => handleToggleMesa(mesa)}
                  aria-pressed={activa}
                  className={`flex items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all duration-200 ${
                    activa
                      ? 'border-[#C84B26] bg-[#C84B26]/5 dark:border-[#E05A36] dark:bg-[#C84B26]/15'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                      activa
                        ? 'border-[#C84B26] bg-[#C84B26] text-white'
                        : 'border-stone-300 text-transparent dark:border-stone-600'
                    }`}
                    aria-hidden="true"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>

                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800 dark:text-stone-100">
                    {mesa.numero}
                  </span>

                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
                    <Users className="h-3 w-3" aria-hidden="true" />
                    {mesa.capacidad}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Paso 3: resumen y nombre de la mesa fusionada */}
      <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/70 p-3 dark:border-stone-700 dark:bg-stone-800/40">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
          <Merge className="h-4 w-4 text-[#C84B26] dark:text-[#E05A36]" aria-hidden="true" />
          {mesasSeleccionadas.length >= 2 ? (
            <span className="flex flex-wrap items-center gap-1.5">
              {mesasSeleccionadas.map((m, idx) => (
                <React.Fragment key={m._id}>
                  {idx > 0 && <span aria-hidden="true">+</span>}
                  <span className="text-stone-900 dark:text-stone-100">
                    {m.numero}
                  </span>
                </React.Fragment>
              ))}
              <span className="text-stone-400">=</span>
              <span className="font-bold text-[#C84B26] dark:text-[#E05A36]">
                {capacidadTotal} personas
              </span>
            </span>
          ) : (
            <span>Selecciona al menos 2 mesas para ver la capacidad resultante.</span>
          )}
        </div>

        <Input
          id="union-mesa-numero"
          name="numero"
          label="Nombre de la nueva mesa"
          placeholder="Ej: Mesa 1 + Mesa 2 + Mesa 3"
          value={numero}
          onChange={(e) => {
            setNumero(e.target.value);
            setNombreEditado(true);
          }}
          maxLength={80}
          required
          helperText="Se genera automáticamente con los nombres de las mesas seleccionadas, pero puedes editarlo."
        />

        <Input
          id="union-mesa-capacidad"
          name="capacidad"
          label="Capacidad resultante"
          value={mesasSeleccionadas.length >= 2 ? String(capacidadTotal) : ''}
          placeholder="—"
          readOnly
          tabIndex={-1}
          aria-readonly="true"
          className="cursor-not-allowed bg-stone-100 font-bold dark:bg-stone-800"
          helperText="Suma automática de las sillas de las mesas seleccionadas."
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          disabled={!puedeUnir}
          leftIcon={<Merge className="h-4 w-4" />}
        >
          Unir mesas
        </Button>
      </div>
    </form>
  );
}

export function UnirMesasModal({
  isOpen,
  onClose,
  mesas,
  onConfirm,
}: UnirMesasModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Unir mesas"
      description="Fusiona dos o más mesas libres de la misma ubicación en una sola mesa con la capacidad sumada."
      maxWidth="xl"
    >
      {isOpen && (
        <UnirMesasContent mesas={mesas} onClose={onClose} onConfirm={onConfirm} />
      )}
    </Modal>
  );
}
