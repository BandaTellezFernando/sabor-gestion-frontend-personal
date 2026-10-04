'use client';

import React, { useState } from 'react';
import { Receta, Plato, Ingrediente, GuardarRecetaDTO } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Plus, Trash2 } from 'lucide-react';

export interface RecetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: GuardarRecetaDTO) => Promise<void>;
  recetaToEdit?: Receta | null;
  platos: Plato[];
  ingredientes: Ingrediente[];
}

interface RecetaFormContentProps {
  onClose: () => void;
  onSave: (data: GuardarRecetaDTO) => Promise<void>;
  recetaToEdit?: Receta | null;
  platos: Plato[];
  ingredientes: Ingrediente[];
}

interface LineaIngrediente {
  ingredienteId: string;
  cantidad: string;
}

function RecetaFormContent({
  onClose,
  onSave,
  recetaToEdit,
  platos,
  ingredientes,
}: RecetaFormContentProps) {
  const isEditing = !!recetaToEdit;

  // Determinar plato inicial
  const initialPlatoId =
    typeof recetaToEdit?.plato === 'object' && recetaToEdit.plato
      ? (recetaToEdit.plato as Plato)._id
      : (recetaToEdit?.plato as string) || (platos[0]?._id || '');

  const [platoId, setPlatoId] = useState<string>(initialPlatoId);

  // Determinar líneas de ingredientes iniciales
  const initialLines: LineaIngrediente[] =
    recetaToEdit && recetaToEdit.ingredientes.length > 0
      ? recetaToEdit.ingredientes.map((i) => ({
          ingredienteId:
            typeof i.ingrediente === 'object' && i.ingrediente
              ? (i.ingrediente as Ingrediente)._id
              : (i.ingrediente as string),
          cantidad: String(i.cantidadNecesaria),
        }))
      : [
          {
            ingredienteId: ingredientes[0]?._id || '',
            cantidad: '1',
          },
        ];

  const [lines, setLines] = useState<LineaIngrediente[]>(initialLines);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Agregar nueva línea de ingrediente
  const handleAddLine = () => {
    // Buscar un ingrediente no usado todavía para conveniencia
    const usedIds = new Set(lines.map((l) => l.ingredienteId));
    const nextUnused = ingredientes.find((ing) => !usedIds.has(ing._id));
    setLines((prev) => [
      ...prev,
      {
        ingredienteId: nextUnused ? nextUnused._id : ingredientes[0]?._id || '',
        cantidad: '1',
      },
    ]);
  };

  // Remover línea
  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) {
      setFormError('La receta debe contener al menos un ingrediente.');
      return;
    }
    setLines((prev) => prev.filter((_, i) => i !== index));
    setFormError(null);
  };

  // Actualizar línea
  const handleUpdateLine = (
    index: number,
    field: keyof LineaIngrediente,
    value: string
  ) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!platoId) {
      setFormError('Debes seleccionar un plato para la receta.');
      return;
    }

    if (lines.length === 0) {
      setFormError('Debes agregar al menos un ingrediente a la receta.');
      return;
    }

    // Validar duplicados
    const ingredientIds = lines.map((l) => l.ingredienteId);
    const uniqueIds = new Set(ingredientIds);
    if (uniqueIds.size !== ingredientIds.length) {
      setFormError('No puedes incluir el mismo ingrediente más de una vez en la receta.');
      return;
    }

    // Validar cantidades
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.ingredienteId) {
        setFormError(`La línea #${i + 1} no tiene un ingrediente seleccionado.`);
        return;
      }
      const qty = parseFloat(line.cantidad);
      if (isNaN(qty) || qty <= 0) {
        setFormError(`La cantidad del ingrediente en la línea #${i + 1} debe ser mayor a 0.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSave({
        plato: platoId,
        ingredientes: lines.map((l) => ({
          ingrediente: l.ingredienteId,
          cantidadNecesaria: parseFloat(l.cantidad),
        })),
      });
      onClose();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Error al guardar la receta del plato.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper para unidad de medida
  const getUnidadMedida = (ingId: string) => {
    const found = ingredientes.find((i) => i._id === ingId);
    return found ? found.unidadMedida : '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <Alert variant="error" title="Validación de la Receta">
          {formError}
        </Alert>
      )}

      {/* Selector de Plato */}
      <div>
        <label
          htmlFor="receta-plato"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5"
        >
          Plato de la Carta *
        </label>
        <select
          id="receta-plato"
          value={platoId}
          onChange={(e) => setPlatoId(e.target.value)}
          disabled={isEditing} // No cambiar plato en edición según regla backend
          required
          className={`w-full py-2 px-3 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            isEditing ? 'opacity-75 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800' : ''
          }`}
        >
          {platos.length === 0 && (
            <option value="">No hay platos disponibles</option>
          )}
          {platos.map((p) => (
            <option key={p._id} value={p._id}>
              {p.nombre} (Bs. {p.precio.toFixed(2)})
            </option>
          ))}
        </select>
        {isEditing && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            El plato asignado no se puede modificar. Si deseas asociar otra receta, crea una nueva.
          </p>
        )}
      </div>

      {/* Lista Dinámica de Insumos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Ingredientes y Cantidades Necesarias *
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddLine}
            disabled={lines.length >= ingredientes.length}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Insumo</span>
          </Button>
        </div>

        {ingredientes.length === 0 ? (
          <p className="text-xs text-amber-600 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/50">
            Aún no has registrado ingredientes en el sistema. Primero crea insumos en la sección de Ingredientes.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {lines.map((line, idx) => {
              const unidad = getUnidadMedida(line.ingredienteId);
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60"
                >
                  {/* Selector de Ingrediente */}
                  <div className="flex-1 min-w-0">
                    <select
                      value={line.ingredienteId}
                      onChange={(e) =>
                        handleUpdateLine(idx, 'ingredienteId', e.target.value)
                      }
                      aria-label={`Seleccionar ingrediente línea ${idx + 1}`}
                      className="w-full py-1.5 px-2 text-xs sm:text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 truncate"
                    >
                      {ingredientes.map((ing) => (
                        <option key={ing._id} value={ing._id}>
                          {ing.nombre} ({ing.unidadMedida})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cantidad */}
                  <div className="w-24 sm:w-28 shrink-0">
                    <Input
                      id={`linea-cantidad-${idx}`}
                      type="number"
                      step="0.01"
                      min="0.001"
                      placeholder="0.00"
                      value={line.cantidad}
                      onChange={(e) =>
                        handleUpdateLine(idx, 'cantidad', e.target.value)
                      }
                      required
                      className="py-1.5 px-2 text-xs sm:text-sm text-right font-mono"
                    />
                  </div>

                  {/* Etiqueta de Unidad */}
                  <div className="w-14 sm:w-16 shrink-0 text-center">
                    <span className="px-2 py-1 text-xs font-mono font-medium rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 block truncate">
                      {unidad || '-'}
                    </span>
                  </div>

                  {/* Botón Eliminar Línea */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLine(idx)}
                    disabled={lines.length <= 1}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 shrink-0"
                    title="Eliminar este ingrediente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
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
          disabled={ingredientes.length === 0}
        >
          {isEditing ? 'Guardar Receta' : 'Crear Receta'}
        </Button>
      </div>
    </form>
  );
}

export function RecetaModal({
  isOpen,
  onClose,
  onSave,
  recetaToEdit,
  platos,
  ingredientes,
}: RecetaModalProps) {
  const isEditing = !!recetaToEdit;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Receta / Escandallo' : 'Nueva Receta / Escandallo'}
      description={
        isEditing
          ? 'Actualiza las proporciones e ingredientes necesarios para preparar el plato.'
          : 'Define los ingredientes requeridos para la preparación del plato en cocina.'
      }
      maxWidth="lg"
    >
      {isOpen && (
        <RecetaFormContent
          key={recetaToEdit?._id || 'nueva-receta'}
          onClose={onClose}
          onSave={onSave}
          recetaToEdit={recetaToEdit}
          platos={platos}
          ingredientes={ingredientes}
        />
      )}
    </Modal>
  );
}
