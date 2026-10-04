'use client';

import React, { useState } from 'react';
import { Ingrediente, CrearIngredienteDTO } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export interface IngredienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CrearIngredienteDTO) => Promise<void>;
  ingredienteToEdit?: Ingrediente | null;
}

interface IngredienteFormContentProps {
  onClose: () => void;
  onSave: (data: CrearIngredienteDTO) => Promise<void>;
  ingredienteToEdit?: Ingrediente | null;
}

const COMMON_UNITS = ['kg', 'g', 'l', 'ml', 'unidad', 'porción', 'pieza', 'cucharada'];

function IngredienteFormContent({
  onClose,
  onSave,
  ingredienteToEdit,
}: IngredienteFormContentProps) {
  const isEditing = !!ingredienteToEdit;
  const [nombre, setNombre] = useState(ingredienteToEdit?.nombre || '');
  const [unidadMedida, setUnidadMedida] = useState(
    ingredienteToEdit?.unidadMedida || 'kg'
  );
  const [disponible, setDisponible] = useState<boolean>(
    ingredienteToEdit?.disponible !== undefined ? ingredienteToEdit.disponible : true
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanNombre = nombre.trim();
    if (!cleanNombre) {
      setFormError('El nombre del ingrediente es obligatorio.');
      return;
    }

    const cleanUnidad = unidadMedida.trim();
    if (!cleanUnidad) {
      setFormError('La unidad de medida es obligatoria.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        nombre: cleanNombre,
        unidadMedida: cleanUnidad,
        disponible,
      });
      onClose();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Error al procesar el ingrediente.'
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

      {/* Nombre */}
      <div>
        <Input
          id="ingrediente-nombre"
          name="nombre"
          label="Nombre del Ingrediente"
          placeholder="Ej: Carne de Res, Cebolla Roja, Arroz Grano de Oro, Sal"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          autoFocus
        />
      </div>

      {/* Unidad de Medida */}
      <div>
        <label
          htmlFor="ingrediente-unidad"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5"
        >
          Unidad de Medida *
        </label>
        <div className="space-y-2">
          <Input
            id="ingrediente-unidad"
            name="unidadMedida"
            placeholder="Ej: kg, g, l, ml, unidad, porción"
            value={unidadMedida}
            onChange={(e) => setUnidadMedida(e.target.value)}
            required
            list="unidades-sugeridas"
          />
          <datalist id="unidades-sugeridas">
            {COMMON_UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>

          {/* Chips de selección rápida */}
          <div className="flex flex-wrap gap-1.5">
            {COMMON_UNITS.map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => setUnidadMedida(unit)}
                className={`text-xs px-2 py-0.5 rounded-md border transition-colors ${
                  unidadMedida.toLowerCase() === unit.toLowerCase()
                    ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400'
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Disponibilidad */}
      <div className="flex items-center gap-3 pt-2">
        <input
          id="ingrediente-disponible"
          type="checkbox"
          checked={disponible}
          onChange={(e) => setDisponible(e.target.checked)}
          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer"
        />
        <label
          htmlFor="ingrediente-disponible"
          className="text-sm font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer select-none"
        >
          Ingrediente disponible en despensa / cocina
        </label>
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
          {isEditing ? 'Guardar Cambios' : 'Crear Ingrediente'}
        </Button>
      </div>
    </form>
  );
}

export function IngredienteModal({
  isOpen,
  onClose,
  onSave,
  ingredienteToEdit,
}: IngredienteModalProps) {
  const isEditing = !!ingredienteToEdit;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Ingrediente' : 'Nuevo Ingrediente de Cocina'}
      description={
        isEditing
          ? 'Modifica los datos del ingrediente o su unidad de medida para escandallos.'
          : 'Registra un insumo base para recetas y control de disponibilidad.'
      }
      maxWidth="md"
    >
      {isOpen && (
        <IngredienteFormContent
          key={ingredienteToEdit?._id || 'nuevo-ingrediente'}
          onClose={onClose}
          onSave={onSave}
          ingredienteToEdit={ingredienteToEdit}
        />
      )}
    </Modal>
  );
}
