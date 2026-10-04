'use client';

import React, { useState } from 'react';
import { Mesa, CrearMesaDTO, Ubicacion } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export interface MesaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CrearMesaDTO) => Promise<void>;
  mesaToEdit?: Mesa | null;
  ubicaciones: Ubicacion[];
}

interface MesaFormContentProps {
  onClose: () => void;
  onSave: (data: CrearMesaDTO) => Promise<void>;
  mesaToEdit?: Mesa | null;
  ubicaciones: Ubicacion[];
}

function MesaFormContent({
  onClose,
  onSave,
  mesaToEdit,
  ubicaciones,
}: MesaFormContentProps) {
  const isEditing = !!mesaToEdit;

  const [numero, setNumero] = useState(mesaToEdit?.numero || '');
  const [capacidad, setCapacidad] = useState<number>(mesaToEdit?.capacidad || 4);
  const [ubicacion, setUbicacion] = useState(
    mesaToEdit?.ubicacion || ubicaciones[0]?.nombre || 'Interior'
  );
  const initialUId =
    typeof mesaToEdit?.ubicacionId === 'object'
      ? mesaToEdit.ubicacionId?._id
      : mesaToEdit?.ubicacionId;
  const [ubicacionId, setUbicacionId] = useState<string>(
    initialUId || ubicaciones[0]?._id || ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleUbicacionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVal = e.target.value;
    const matched = ubicaciones.find(
      (u) =>
        u._id === selectedVal ||
        u.nombre.toLowerCase() === selectedVal.toLowerCase()
    );
    if (matched) {
      setUbicacionId(matched._id);
      setUbicacion(matched.nombre);
    } else {
      setUbicacion(selectedVal);
      setUbicacionId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanNumero = numero.trim();
    if (!cleanNumero) {
      setFormError('El número o nombre de la mesa es obligatorio.');
      return;
    }

    if (capacidad < 1) {
      setFormError('La capacidad mínima debe ser de al menos 1 comensal.');
      return;
    }

    if (!ubicacion.trim()) {
      setFormError('La ubicación de la mesa es obligatoria.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        numero: cleanNumero,
        capacidad: Number(capacidad),
        ubicacion: ubicacion.trim(),
        ubicacionId: ubicacionId || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Error al procesar la solicitud.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <Alert variant="error" title="Error en los datos">
          {formError}
        </Alert>
      )}

      {/* Nombre / Número */}
      <div>
        <Input
          id="mesa-numero"
          name="numero"
          label="Identificador / Número de Mesa"
          placeholder="Ej: Mesa 1 Interior, Mesa 2 Terraza"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          required
          helperText="Formato recomendado por backend: debe incluir 'Mesa' y una zona ('Interior', 'Patio' o 'Terraza')."
        />
      </div>

      {/* Capacidad */}
      <div>
        <Input
          id="mesa-capacidad"
          name="capacidad"
          type="number"
          min={1}
          max={50}
          label="Capacidad (Comensales)"
          value={capacidad}
          onChange={(e) => setCapacidad(parseInt(e.target.value, 10) || 1)}
          required
          helperText="Cantidad máxima de clientes que pueden acomodarse en la mesa."
        />
      </div>

      {/* Ubicación */}
      <div>
        <label
          htmlFor="mesa-ubicacion"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5"
        >
          Ubicación del Salón
        </label>
        {ubicaciones.length > 0 ? (
          <select
            id="mesa-ubicacion"
            value={ubicacionId || ubicacion}
            onChange={handleUbicacionChange}
            className="w-full py-2 px-3 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-150"
          >
            {ubicaciones.map((u) => (
              <option key={u._id} value={u._id}>
                {u.nombre} {u.descripcion ? `(${u.descripcion})` : ''}
              </option>
            ))}
          </select>
        ) : (
          <select
            id="mesa-ubicacion"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className="w-full py-2 px-3 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="Interior">Interior</option>
            <option value="Terraza">Terraza</option>
            <option value="Patio">Patio</option>
          </select>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
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
        >
          {isEditing ? 'Guardar Cambios' : 'Crear Mesa'}
        </Button>
      </div>
    </form>
  );
}

export function MesaFormModal({
  isOpen,
  onClose,
  onSave,
  mesaToEdit,
  ubicaciones,
}: MesaFormModalProps) {
  const isEditing = !!mesaToEdit;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Mesa' : 'Nueva Mesa de Salón'}
      description={
        isEditing
          ? 'Modifica los atributos físicos de la mesa. El estado operativo se gestiona directamente en el salón.'
          : 'Registra una nueva mesa en el salón gastronómico.'
      }
      maxWidth="md"
    >
      {isOpen && (
        <MesaFormContent
          key={mesaToEdit?._id || 'nueva-mesa'}
          onClose={onClose}
          onSave={onSave}
          mesaToEdit={mesaToEdit}
          ubicaciones={ubicaciones}
        />
      )}
    </Modal>
  );
}
