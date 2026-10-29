//src/components/mesas/desunir-mesa-modal.tsx
'use client';

import React, { useState } from 'react';
import { Mesa } from '@/types';
import { calcularMesasSeparadas } from '@/services/mesa.service';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { MapPin, Unlink2, Users } from 'lucide-react';

export interface DesunirMesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mesa: Mesa | null;
  onConfirm: (mesa: Mesa) => Promise<void>;
}

interface DesunirMesaContentProps {
  mesa: Mesa;
  onClose: () => void;
  onConfirm: (mesa: Mesa) => Promise<void>;
}

function DesunirMesaContent({ mesa, onClose, onConfirm }: DesunirMesaContentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const separadas = calcularMesasSeparadas(mesa);

  const handleConfirm = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(mesa);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo desunir la mesa. Inténtalo nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!separadas) {
    return (
      <div className="space-y-4">
        <Alert variant="warning" title="La mesa no se puede desunir">
          «{mesa.numero}» no contiene una unión de mesas válida.
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
    <div className="space-y-4">
      {error && (
        <Alert variant="error" title="No se pudo desunir la mesa">
          {error}
        </Alert>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
        <p className="flex items-start gap-2 font-medium">
          <Unlink2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Se restaurarán las mesas originales de <strong className="font-bold">{mesa.numero}</strong> en{' '}
            <strong className="font-bold">{mesa.ubicacion || 'su zona'}</strong>, conservando sus identificadores e historial.
          </span>
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Mesas originales que se restaurarán
        </p>

        <ul className="space-y-2">
          {separadas.map((separada) => (
            <li
              key={separada.mesaId}
              className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-900"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">
                  {separada.numero}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {separada.ubicacion || 'Sin zona'}
                  </span>
                </p>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-stone-200 bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200">
                <Users className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500" aria-hidden="true" />
                {separada.capacidad}{' '}
                {separada.capacidad === 1 ? 'silla' : 'sillas'}
              </span>
            </li>
          ))}
        </ul>
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
          type="button"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          onClick={() => void handleConfirm()}
          leftIcon={<Unlink2 className="h-4 w-4" />}
        >
          Sí, restaurar mesas
        </Button>
      </div>
    </div>
  );
}

export function DesunirMesaModal({
  isOpen,
  onClose,
  mesa,
  onConfirm,
}: DesunirMesaModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Desunir mesa"
      description="Restaura todas las mesas originales registradas por el backend."
      maxWidth="md"
    >
      {isOpen && mesa && (
        <DesunirMesaContent
          key={mesa._id}
          mesa={mesa}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      )}
    </Modal>
  );
}
