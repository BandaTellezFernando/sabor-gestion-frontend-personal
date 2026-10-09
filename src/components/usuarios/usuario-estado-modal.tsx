'use client';

import React, { useState } from 'react';
import { Usuario } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Power } from 'lucide-react';

export interface UsuarioEstadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  usuario: Usuario | null;
}

export function UsuarioEstadoModal({
  isOpen,
  onClose,
  onConfirm,
  usuario,
}: UsuarioEstadoModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!usuario) return null;

  const handleConfirm = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado del usuario.');
    } finally {
      setIsUpdating(false);
    }
  };

  const nuevoEstado = !usuario.estado;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={nuevoEstado ? 'Activar Usuario' : 'Desactivar Usuario'}
      description="Confirmación requerida para cambiar el estado de acceso del usuario."
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className={`p-3 border rounded-xl flex items-start gap-3 ${nuevoEstado ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900/50' : 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/50'}`}>
          <Power className={`w-5 h-5 shrink-0 mt-0.5 ${nuevoEstado ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`} />
          <div className={`text-xs space-y-1 ${nuevoEstado ? 'text-green-800 dark:text-green-300' : 'text-orange-800 dark:text-orange-300'}`}>
            <p className="font-semibold">{nuevoEstado ? 'El usuario tendrá acceso al sistema.' : 'El usuario perderá el acceso al sistema.'}</p>
            <p>
              ¿Estás seguro que deseas {nuevoEstado ? 'activar' : 'desactivar'} al usuario <strong className="font-bold underline">{usuario.nombre} {usuario.apellido}</strong>?
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
            disabled={isUpdating}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={nuevoEstado ? 'primary' : 'danger'}
            size="md"
            isLoading={isUpdating}
            onClick={handleConfirm}
          >
            Sí, {nuevoEstado ? 'Activar' : 'Desactivar'} Usuario
          </Button>
        </div>
      </div>
    </Modal>
  );
}
