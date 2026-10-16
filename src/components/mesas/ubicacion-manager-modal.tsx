'use client';

import React, { useState } from 'react';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { Ubicacion } from '@/types';
import {
  ubicacionService,
  UbicacionPayload,
} from '@/services/ubicacion.service';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface UbicacionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  ubicaciones: Ubicacion[];
  onRefresh: () => Promise<void>;
}

export function UbicacionManagerModal({
  isOpen,
  onClose,
  ubicaciones,
  onRefresh,
}: UbicacionManagerModalProps) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ubicacionEditando, setUbicacionEditando] = useState<Ubicacion | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const resetForm = () => {
    setNombre('');
    setDescripcion('');
    setUbicacionEditando(null);
  };

  const handleClose = () => {
    if (isSaving || deletingId !== null) return;
    resetForm();
    setError(null);
    setNotice(null);
    onClose();
  };

  const handleEdit = (ubicacion: Ubicacion) => {
    setUbicacionEditando(ubicacion);
    setNombre(ubicacion.nombre);
    setDescripcion(ubicacion.descripcion || '');
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError('El nombre de la ubicación es obligatorio.');
      return;
    }

    const payload: UbicacionPayload = {
      nombre: nombreLimpio,
      descripcion: descripcion.trim() || undefined,
    };
    const estabaEditando = ubicacionEditando !== null;

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      if (ubicacionEditando) {
        await ubicacionService.actualizarUbicacion(ubicacionEditando._id, payload);
      } else {
        await ubicacionService.crearUbicacion(payload);
      }

      await onRefresh();
      resetForm();
      setNotice(
        estabaEditando
          ? 'La ubicación se actualizó correctamente.'
          : 'La ubicación se creó correctamente.'
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar la ubicación.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (ubicacion: Ubicacion) => {
    const confirmado = window.confirm(
      `¿Eliminar la ubicación "${ubicacion.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    setDeletingId(ubicacion._id);
    setError(null);
    setNotice(null);

    try {
      await ubicacionService.eliminarUbicacion(ubicacion._id);

      if (ubicacionEditando?._id === ubicacion._id) {
        resetForm();
      }

      await onRefresh();
      setNotice(`La ubicación "${ubicacion.nombre}" se eliminó correctamente.`);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo eliminar la ubicación.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Gestionar ubicaciones"
      description="Administra las zonas del restaurante. Solo el Administrador tiene acceso a estas operaciones."
      maxWidth="lg"
    >
      <div className="space-y-5">
        {error && (
          <Alert variant="error" title="No se pudo completar la operación">
            {error}
          </Alert>
        )}

        {notice && (
          <Alert variant="success" title="Operación completada">
            {notice}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 shrink-0 text-amber-600" />
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              {ubicacionEditando ? 'Editar ubicación' : 'Nueva ubicación'}
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              id="ubicacion-nombre"
              name="nombre"
              label="Nombre de la ubicación"
              placeholder="Ej. Terraza"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              required
              disabled={isSaving || deletingId !== null}
            />

            <Input
              id="ubicacion-descripcion"
              name="descripcion"
              label="Descripción (opcional)"
              placeholder="Ej. Zona exterior"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              disabled={isSaving || deletingId !== null}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {ubicacionEditando && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  resetForm();
                  setError(null);
                  setNotice(null);
                }}
                disabled={isSaving || deletingId !== null}
              >
                Cancelar edición
              </Button>
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              disabled={deletingId !== null}
              leftIcon={
                ubicacionEditando
                  ? <Pencil className="h-4 w-4" />
                  : <Plus className="h-4 w-4" />
              }
            >
              {ubicacionEditando ? 'Guardar cambios' : 'Crear ubicación'}
            </Button>
          </div>
        </form>

        <div className="border-t border-stone-200 pt-4 dark:border-stone-800">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              Ubicaciones registradas
            </h3>
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              {ubicaciones.length}
            </span>
          </div>

          {ubicaciones.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 p-5 text-center text-sm text-stone-500 dark:border-stone-700">
              Todavía no hay ubicaciones registradas. Crea la primera con el formulario.
            </p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {ubicaciones.map((ubicacion) => (
                <li
                  key={ubicacion._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 p-3 dark:border-stone-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {ubicacion.nombre}
                    </p>
                    {ubicacion.descripcion && (
                      <p className="mt-0.5 break-words text-xs text-stone-500 dark:text-stone-400">
                        {ubicacion.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ubicacion)}
                      disabled={isSaving || deletingId !== null}
                      leftIcon={<Pencil className="h-3.5 w-3.5" />}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => void handleDelete(ubicacion)}
                      isLoading={deletingId === ubicacion._id}
                      disabled={isSaving || (deletingId !== null && deletingId !== ubicacion._id)}
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    >
                      Eliminar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end border-t border-stone-200 pt-3 dark:border-stone-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isSaving || deletingId !== null}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
