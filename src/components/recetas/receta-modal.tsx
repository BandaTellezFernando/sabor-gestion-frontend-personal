'use client';

import React, { useState } from 'react';

import {
  Receta,
  Plato,
  Ingrediente,
  GuardarRecetaDTO,
} from '@/types';

import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

import {
  Plus,
  Trash2,
} from 'lucide-react';

export interface RecetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: GuardarRecetaDTO
  ) => Promise<void>;
  recetaToEdit?: Receta | null;
  platos: Plato[];
  ingredientes: Ingrediente[];
}

interface RecetaFormContentProps {
  onClose: () => void;
  onSave: (
    data: GuardarRecetaDTO
  ) => Promise<void>;
  recetaToEdit?: Receta | null;
  platos: Plato[];
  ingredientes: Ingrediente[];
}

interface LineaIngrediente {
  ingredienteId: string;
  cantidad: string;
}

function obtenerPlatoId(
  plato: string | Plato
): string {
  return typeof plato === 'object'
    ? plato._id
    : plato;
}

function obtenerIngredienteId(
  ingrediente: string | Ingrediente
): string {
  return typeof ingrediente === 'object'
    ? ingrediente._id
    : ingrediente;
}

function RecetaFormContent({
  onClose,
  onSave,
  recetaToEdit,
  platos,
  ingredientes,
}: RecetaFormContentProps) {
  const isEditing = !!recetaToEdit;

  // Plato
  const initialPlatoId = recetaToEdit
    ? obtenerPlatoId(recetaToEdit.plato)
    : platos[0]?._id || '';

  const [platoId, setPlatoId] =
    useState<string>(initialPlatoId);

  // Ingredientes iniciales
  const initialLines: LineaIngrediente[] =
    recetaToEdit &&
    recetaToEdit.ingredientes.length > 0
      ? recetaToEdit.ingredientes.map(
          (linea) => ({
            ingredienteId:
              obtenerIngredienteId(
                linea.ingrediente
              ),
            cantidad:
              String(
                linea.cantidadNecesaria
              ),
          })
        )
      : ingredientes.length > 0
        ? [
            {
              ingredienteId:
                ingredientes[0]._id,
              cantidad: '',
            },
          ]
        : [];

  const [lineas, setLineas] =
    useState<LineaIngrediente[]>(
      initialLines
    );

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [formError, setFormError] =
    useState<string | null>(null);

  // ─────────────────────────────────────
  // Ingredientes
  // ─────────────────────────────────────

  const agregarLinea = () => {
    if (ingredientes.length === 0) {
      setFormError(
        'No existen ingredientes registrados.'
      );
      return;
    }

    const usados = new Set(
      lineas.map(
        (linea) =>
          linea.ingredienteId
      )
    );

    const siguiente =
      ingredientes.find(
        (ingrediente) =>
          !usados.has(
            ingrediente._id
          )
      );

    if (!siguiente) {
      setFormError(
        'Todos los ingredientes disponibles ya están agregados a la receta.'
      );
      return;
    }

    setLineas((prev) => [
      ...prev,
      {
        ingredienteId:
          siguiente._id,
        cantidad: '',
      },
    ]);

    setFormError(null);
  };

  const eliminarLinea = (
    index: number
  ) => {
    setLineas((prev) =>
      prev.filter((_, i) => i !== index)
    );

    setFormError(null);
  };

  const actualizarLinea = (
    index: number,
    campo: keyof LineaIngrediente,
    valor: string
  ) => {
    setLineas((prev) => {
      const nuevas = [...prev];

      nuevas[index] = {
        ...nuevas[index],
        [campo]: valor,
      };

      return nuevas;
    });

    setFormError(null);
  };

  const obtenerUnidad = (
    ingredienteId: string
  ) => {
    const ingrediente =
      ingredientes.find(
        (item) =>
          item._id === ingredienteId
      );

    return (
      ingrediente?.unidadMedida || '-'
    );
  };

  // ─────────────────────────────────────
  // Submit
  // ─────────────────────────────────────

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setFormError(null);

    if (!platoId) {
      setFormError(
        'Debes seleccionar un plato.'
      );
      return;
    }

    if (lineas.length === 0) {
      setFormError(
        'La receta debe contener al menos un ingrediente.'
      );
      return;
    }

    const ids = lineas.map(
      (linea) =>
        linea.ingredienteId
    );

    const idsUnicos =
      new Set(ids);

    if (
      idsUnicos.size !== ids.length
    ) {
      setFormError(
        'No puedes incluir el mismo ingrediente más de una vez en la receta.'
      );
      return;
    }

    for (
      let index = 0;
      index < lineas.length;
      index++
    ) {
      const linea = lineas[index];

      if (!linea.ingredienteId) {
        setFormError(
          `La línea #${index + 1} no tiene un ingrediente seleccionado.`
        );
        return;
      }

      const cantidad =
        Number(linea.cantidad);

      if (
        !Number.isFinite(cantidad) ||
        cantidad <= 0
      ) {
        setFormError(
          `La cantidad de la línea #${
            index + 1
          } debe ser mayor a 0.`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await onSave({
        plato: platoId,
        ingredientes: lineas.map(
          (linea) => ({
            ingrediente:
              linea.ingredienteId,
            cantidadNecesaria:
              Number(
                linea.cantidad
              ),
          })
        ),
      });

      onClose();
    } catch (error: unknown) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la receta.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {formError && (
        <Alert
          variant="error"
          title="Error en la receta"
        >
          {formError}
        </Alert>
      )}

      {/* Plato */}
      <div>
        <label
          htmlFor="receta-plato"
          className="block text-sm font-medium text-stone-800 dark:text-stone-200 mb-1.5"
        >
          Plato *
        </label>

        <select
          id="receta-plato"
          value={platoId}
          onChange={(e) =>
            setPlatoId(e.target.value)
          }
          disabled={isEditing}
          required
          className={`w-full py-2 px-3 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            isEditing
              ? 'opacity-70 cursor-not-allowed'
              : ''
          }`}
        >
          {platos.length === 0 && (
            <option value="">
              No hay platos disponibles
            </option>
          )}

          {platos.map((plato) => (
            <option
              key={plato._id}
              value={plato._id}
            >
              {plato.nombre}
            </option>
          ))}
        </select>

        {isEditing && (
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">
            El plato asociado no puede
            cambiarse durante la edición.
          </p>
        )}
      </div>

      {/* Ingredientes */}
      <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/50 p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Ingredientes
            </h3>

            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Define la cantidad exacta utilizada
              para preparar una unidad.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={agregarLinea}
            disabled={
              ingredientes.length === 0 ||
              lineas.length >=
                ingredientes.length
            }
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </Button>
        </div>

        {ingredientes.length === 0 ? (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              No hay ingredientes registrados.
            </p>

            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Primero crea los ingredientes en
              Inventario.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {lineas.map(
              (linea, index) => {
                const unidad =
                  obtenerUnidad(
                    linea.ingredienteId
                  );

                const usados = new Set(
                  lineas
                    .filter(
                      (_, i) =>
                        i !== index
                    )
                    .map(
                      (item) =>
                        item.ingredienteId
                    )
                );

                return (
                  <div
                    key={`${index}-${linea.ingredienteId}`}
                    className="flex flex-col sm:flex-row sm:items-end gap-2 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                  >
                    {/* Ingrediente */}
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`receta-ingrediente-${index}`}
                        className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-1"
                      >
                        Ingrediente
                      </label>

                      <select
                        id={`receta-ingrediente-${index}`}
                        value={
                          linea.ingredienteId
                        }
                        onChange={(e) =>
                          actualizarLinea(
                            index,
                            'ingredienteId',
                            e.target.value
                          )
                        }
                        className="w-full py-2 px-2.5 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {ingredientes.map(
                          (ingrediente) => (
                            <option
                              key={
                                ingrediente._id
                              }
                              value={
                                ingrediente._id
                              }
                              disabled={usados.has(
                                ingrediente._id
                              )}
                            >
                              {
                                ingrediente.nombre
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {/* Cantidad */}
                    <div className="w-full sm:w-32">
                      <label
                        htmlFor={`receta-cantidad-${index}`}
                        className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-1"
                      >
                        Cantidad
                      </label>

                      <Input
                        id={`receta-cantidad-${index}`}
                        type="number"
                        min="0.000001"
                        step="any"
                        value={
                          linea.cantidad
                        }
                        onChange={(e) =>
                          actualizarLinea(
                            index,
                            'cantidad',
                            e.target.value
                          )
                        }
                        placeholder="0.00"
                        className="font-mono text-right"
                        required
                      />
                    </div>

                    {/* Unidad */}
                    <div className="w-full sm:w-20">
                      <span className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-1">
                        Unidad
                      </span>

                      <div className="h-10 flex items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2">
                        <span className="text-xs font-mono font-semibold text-stone-700 dark:text-stone-300 truncate">
                          {unidad}
                        </span>
                      </div>
                    </div>

                    {/* Eliminar */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        eliminarLinea(index)
                      }
                      disabled={
                        lineas.length <= 1
                      }
                      title="Eliminar ingrediente"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              }
            )}
          </div>
        )}

        {lineas.length > 0 &&
          ingredientes.length > 0 && (
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-3">
              La unidad se obtiene directamente
              del ingrediente y no se puede
              cambiar desde la receta.
            </p>
          )}
      </section>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
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
          disabled={
            ingredientes.length === 0 ||
            lineas.length === 0
          }
        >
          {isEditing
            ? 'Guardar Receta'
            : 'Crear Receta'}
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
      title={
        isEditing
          ? 'Editar Receta / Escandallo'
          : 'Nueva Receta / Escandallo'
      }
      description={
        isEditing
          ? 'Modifica ingredientes y cantidades del plato.'
          : 'Define los ingredientes y cantidades necesarias para preparar el plato.'
      }
      maxWidth="lg"
    >
      {isOpen && (
        <RecetaFormContent
          key={
            recetaToEdit?._id ||
            'nueva-receta'
          }
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