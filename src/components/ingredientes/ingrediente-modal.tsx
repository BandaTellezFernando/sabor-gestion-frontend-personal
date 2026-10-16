'use client';

import React, { useState } from 'react';
import {
  Ingrediente,
  CrearIngredienteDTO,
  ActualizarIngredienteDTO,
} from '@/types';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export interface IngredienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: CrearIngredienteDTO | ActualizarIngredienteDTO
  ) => Promise<void>;
  ingredienteToEdit?: Ingrediente | null;
}

interface IngredienteFormContentProps {
  onClose: () => void;
  onSave: (
    data: CrearIngredienteDTO | ActualizarIngredienteDTO
  ) => Promise<void>;
  ingredienteToEdit?: Ingrediente | null;
}

const COMMON_UNITS = [
  'kg',
  'g',
  'mg',
  'L',
  'ml',
  'unidad',
] as const;

function IngredienteFormContent({
  onClose,
  onSave,
  ingredienteToEdit,
}: IngredienteFormContentProps) {
  const isEditing = !!ingredienteToEdit;

  const [nombre, setNombre] = useState(
    ingredienteToEdit?.nombre || ''
  );

  const [unidadMedida, setUnidadMedida] = useState<Ingrediente['unidadMedida']>(
    ingredienteToEdit?.unidadMedida || 'kg'
  );

  const [stockActual, setStockActual] = useState<string>(
    ingredienteToEdit
      ? String(ingredienteToEdit.stockActual)
      : '0'
  );

  const [disponible, setDisponible] = useState<boolean>(
    ingredienteToEdit?.disponible !== undefined
      ? ingredienteToEdit.disponible
      : true
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanNombre = nombre.trim();

    if (!cleanNombre) {
      setFormError(
        'El nombre del ingrediente es obligatorio.'
      );
      return;
    }

    const cleanUnidad = unidadMedida.trim() as Ingrediente['unidadMedida'];

    if (!cleanUnidad) {
      setFormError(
        'La unidad de medida es obligatoria.'
      );
      return;
    }

    if (!COMMON_UNITS.includes(cleanUnidad as (typeof COMMON_UNITS)[number])) {
      setFormError('Selecciona una unidad válida: kg, g, mg, L, ml o unidad.');
      return;
    }

    const numericStock = Number(stockActual);

    if (!Number.isFinite(numericStock) || numericStock < 0) {
      setFormError(
        'El stock debe ser un número mayor o igual a 0.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        await onSave({
          nombre: cleanNombre,
          stockActual: numericStock,
          disponible,
        });
      } else {
        await onSave({
          nombre: cleanNombre,
          unidadMedida: cleanUnidad,
          stockActual: numericStock,
          disponible,
        });
      }

      onClose();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Error al procesar el ingrediente.'
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
          placeholder="Ej: Carne de Res, Cebolla Roja, Arroz, Sal"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          autoFocus
        />
      </div>

      {/* Unidad de medida */}
      <div>
        <label
          htmlFor="ingrediente-unidad"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5"
        >
          Unidad de Medida *
        </label>

        <div className="space-y-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Selecciona una unidad usando los botones. Solo se permiten las unidades definidas por el sistema.
          </p>

          {!isEditing && (
            <div className="flex flex-wrap gap-1.5">
              {COMMON_UNITS.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setUnidadMedida(unit)}
                  className={`text-xs px-2 py-0.5 rounded-md border transition-colors ${
                    unidadMedida.toLowerCase() ===
                    unit.toLowerCase()
                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          )}

          {isEditing && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Unidad configurada: {unidadMedida}. No se puede cambiar después de crear el ingrediente.
            </p>
          )}
        </div>
      </div>

      {/* Stock */}
      <div>
        <Input
          id="ingrediente-stock"
          name="stockActual"
          type="number"
          min="0"
          step="any"
          label={`Stock Actual (${unidadMedida || 'unidad'}) *`}
          placeholder="0"
          value={stockActual}
          onChange={(e) =>
            setStockActual(e.target.value)
          }
          required
        />

        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
          Puedes aumentar o disminuir libremente la cantidad.
          La unidad permanece fija.
        </p>
      </div>

      {/* Disponibilidad manual */}
      <div className="flex items-center gap-3 pt-2">
        <input
          id="ingrediente-disponible"
          type="checkbox"
          checked={disponible}
          onChange={(e) =>
            setDisponible(e.target.checked)
          }
          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer"
        />

        <label
          htmlFor="ingrediente-disponible"
          className="text-sm font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer select-none"
        >
          Ingrediente disponible para cocina
        </label>
      </div>

      {/* Acciones */}
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
          {isEditing
            ? 'Guardar Cambios'
            : 'Crear Ingrediente'}
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
      title={
        isEditing
          ? 'Editar Ingrediente'
          : 'Nuevo Ingrediente de Cocina'
      }
      description={
        isEditing
          ? 'Actualiza el nombre, stock o disponibilidad. La unidad de medida no puede modificarse.'
          : 'Registra un insumo indicando su unidad de medida y stock inicial.'
      }
      maxWidth="md"
    >
      {isOpen && (
        <IngredienteFormContent
          key={
            ingredienteToEdit?._id ||
            'nuevo-ingrediente'
          }
          onClose={onClose}
          onSave={onSave}
          ingredienteToEdit={ingredienteToEdit}
        />
      )}
    </Modal>
  );
}