'use client';

import React, { useState } from 'react';
import { Pedido, Mesa } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export interface PedidoCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
  mesas?: Mesa[];
  onConfirmCancel: (pedido: Pedido) => Promise<void>;
}

export function PedidoCancelModal({
  isOpen,
  onClose,
  pedido,
  mesas,
  onConfirmCancel,
}: PedidoCancelModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!pedido) return null;

  const getMesaNombre = (mesa: string | Mesa | undefined): string => {
    if (!mesa) return 'Mesa no asignada';
    if (typeof mesa === 'object' && 'numero' in mesa) {
      return mesa.numero;
    }
    if (typeof mesa === 'string' && mesas && mesas.length > 0) {
      const encontrada = mesas.find((m) => m._id === mesa || m.numero === mesa);
      if (encontrada) return encontrada.numero;
    }
    if (typeof mesa === 'string' && /^[0-9a-fA-F]{24}$/.test(mesa)) {
      return `Mesa (${mesa.slice(-4)})`;
    }
    return `Mesa ${mesa}`;
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmCancel(pedido);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="¿Confirmas la anulación del pedido?"
      description="Esta acción cambiará el estado de la comanda a CANCELADO y liberará automáticamente la mesa asociada."
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Atención: Operación irreversible</p>
            <p>
              Estás a punto de anular la comanda{' '}
              <span className="font-mono font-bold">{pedido.codigo}</span> vinculada a{' '}
              <span className="font-semibold">{getMesaNombre(pedido.mesa)}</span> por un total de{' '}
              <span className="font-bold">Bs. {Number(pedido.total || 0).toFixed(2)}</span>.
            </p>
            {pedido.mesa && (
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                La mesa pasará inmediatamente al estado Disponible (Libre) para otros comensales.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-[40px] px-4 font-medium"
          >
            No, mantener comanda
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={handleConfirm}
            isLoading={isSubmitting}
            className="min-h-[40px] px-4 font-semibold"
          >
            Sí, anular pedido
          </Button>
        </div>
      </div>
    </Modal>
  );
}
