'use client';

import React, { useState } from 'react';
import { Categoria } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export interface CategoriaDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  categoria: Categoria | null;
}

export function CategoriaDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  categoria,
}: CategoriaDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!categoria) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la categoría.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar Categoría"
      description="Confirmación requerida para remover la categoría del catálogo."
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs text-red-800 dark:text-red-300 space-y-1">
            <p className="font-semibold">Esta acción es irreversible.</p>
            <p>
              La categoría <strong className="font-bold underline">{categoria.nombre}</strong> será eliminada de forma permanente del sistema.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            isLoading={isDeleting}
            onClick={handleConfirm}
          >
            Sí, Eliminar Categoría
          </Button>
        </div>
      </div>
    </Modal>
  );
}
