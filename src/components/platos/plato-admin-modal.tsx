'use client';

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Plato,
  Categoria,
  Ingrediente,
  CrearPlatoDTO,
  ActualizarPlatoDTO,
  GuardarRecetaDTO,
  Receta,
} from '@/types';

import { platoService } from '@/services/plato.service';
import { ingredienteService } from '@/services/ingrediente.service';
import { recetaService } from '@/services/receta.service';

import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

import {
  Upload,
  Image as ImageIcon,
  Check,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';

export interface PlatoAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: CrearPlatoDTO | ActualizarPlatoDTO
  ) => Promise<void>;
  platoToEdit?: Plato | null;
  categorias: Categoria[];
}

interface PlatoAdminFormContentProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: CrearPlatoDTO | ActualizarPlatoDTO
  ) => Promise<void>;
  platoToEdit?: Plato | null;
  categorias: Categoria[];
}

interface LineaIngrediente {
  ingredienteId: string;
  cantidad: string;
}

const DEFAULT_FOOD_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

const DEFAULT_PUBLIC_ID = 'placeholder_plato';

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

function obtenerRecetaPorPlato(
  recetas: Receta[],
  platoId: string
): Receta | null {
  return (
    recetas.find(
      (receta) =>
        obtenerPlatoId(receta.plato) === platoId
    ) || null
  );
}

function PlatoAdminFormContent({
  isOpen,
  onClose,
  onSave,
  platoToEdit,
  categorias,
}: PlatoAdminFormContentProps) {
  const isEditing = !!platoToEdit;

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  // ─────────────────────────────────────────────
  // Datos principales
  // ─────────────────────────────────────────────

  const [nombre, setNombre] = useState(
    platoToEdit?.nombre || ''
  );

  const [descripcion, setDescripcion] = useState(
    platoToEdit?.descripcion || ''
  );

  const [precio, setPrecio] = useState<string>(
    platoToEdit
      ? String(platoToEdit.precio)
      : ''
  );

  const initialCategoriaId =
    typeof platoToEdit?.categoria === 'object' &&
    platoToEdit.categoria
      ? platoToEdit.categoria._id
      : (platoToEdit?.categoria as string) ||
        (categorias[0]?._id || '');

  const [categoria, setCategoria] =
    useState<string>(initialCategoriaId);

  const [disponible, setDisponible] =
    useState<boolean>(
      platoToEdit?.disponible !== undefined
        ? platoToEdit.disponible
        : true
    );

  // ─────────────────────────────────────────────
  // Imagen
  // ─────────────────────────────────────────────

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string>(
      platoToEdit?.imagenUrl || ''
    );

  // ─────────────────────────────────────────────
  // Ingredientes / Receta
  // ─────────────────────────────────────────────

  const [ingredientes, setIngredientes] =
    useState<Ingrediente[]>([]);

  const [lineas, setLineas] = useState<
    LineaIngrediente[]
  >([]);

  const [
    isLoadingIngredientes,
    setIsLoadingIngredientes,
  ] = useState<boolean>(false);

  const [isLoadingReceta, setIsLoadingReceta] =
    useState<boolean>(false);

  const [recetaError, setRecetaError] =
    useState<string | null>(null);

  // ─────────────────────────────────────────────
  // Estado del formulario
  // ─────────────────────────────────────────────

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [uploadStatus, setUploadStatus] =
    useState<string | null>(null);

  const [formError, setFormError] =
    useState<string | null>(null);

  // ─────────────────────────────────────────────
  // Cargar ingredientes y receta
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const cargarDatosReceta =
      async () => {
        setIsLoadingIngredientes(true);
        setRecetaError(null);

        try {
          const ingredientesData =
            await ingredienteService.getIngredientes();

          if (cancelled) return;

          setIngredientes(ingredientesData);

          // Crear nuevo plato
          if (!platoToEdit) {
            setLineas(
              ingredientesData.length > 0
                ? [
                    {
                      ingredienteId:
                        ingredientesData[0]._id,
                      cantidad: '',
                    },
                  ]
                : []
            );

            return;
          }

          // Editar plato existente
          setIsLoadingReceta(true);

          const recetasData =
            await recetaService.getRecetas();

          if (cancelled) return;

          const receta =
            obtenerRecetaPorPlato(
              recetasData,
              platoToEdit._id
            );

          if (receta) {
            setLineas(
              receta.ingredientes.map(
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
            );
          } else {
            setLineas(
              ingredientesData.length > 0
                ? [
                    {
                      ingredienteId:
                        ingredientesData[0]._id,
                      cantidad: '',
                    },
                  ]
                : []
            );
          }
        } catch (error: unknown) {
          if (cancelled) return;

          setRecetaError(
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar los ingredientes y la receta.'
          );

          setLineas([]);
        } finally {
          if (!cancelled) {
            setIsLoadingIngredientes(false);
            setIsLoadingReceta(false);
          }
        }
      };

    void cargarDatosReceta();

    return () => {
      cancelled = true;
    };
  }, [isOpen, platoToEdit]);

  // ─────────────────────────────────────────────
  // Imagen
  // ─────────────────────────────────────────────

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError(
        'El archivo seleccionado debe ser una imagen válida (JPG, PNG, WebP).'
      );
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(
      URL.createObjectURL(file)
    );
    setFormError(null);
  };

  // ─────────────────────────────────────────────
  // Ingredientes
  // ─────────────────────────────────────────────

  const agregarLineaIngrediente = () => {
    if (ingredientes.length === 0) {
      setRecetaError(
        'Primero debes registrar al menos un ingrediente en el inventario.'
      );
      return;
    }

    const usados = new Set(
      lineas.map(
        (linea) => linea.ingredienteId
      )
    );

    const siguienteDisponible =
      ingredientes.find(
        (ingrediente) =>
          !usados.has(ingrediente._id)
      );

    if (!siguienteDisponible) {
      setRecetaError(
        'Todos los ingredientes disponibles ya fueron agregados a la receta.'
      );
      return;
    }

    setLineas((prev) => [
      ...prev,
      {
        ingredienteId:
          siguienteDisponible._id,
        cantidad: '',
      },
    ]);

    setRecetaError(null);
    setFormError(null);
  };

  const eliminarLineaIngrediente = (
    index: number
  ) => {
    setLineas((prev) =>
      prev.filter((_, i) => i !== index)
    );

    setRecetaError(null);
    setFormError(null);
  };

  const actualizarLineaIngrediente = (
    index: number,
    campo: keyof LineaIngrediente,
    valor: string
  ) => {
    setLineas((prev) => {
      const nuevasLineas = [...prev];

      nuevasLineas[index] = {
        ...nuevasLineas[index],
        [campo]: valor,
      };

      return nuevasLineas;
    });

    setRecetaError(null);
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

  // ─────────────────────────────────────────────
  // Validación receta
  // ─────────────────────────────────────────────

  const validarReceta = (): boolean => {
    if (lineas.length === 0) {
      setRecetaError(
        'Debes agregar al menos un ingrediente a la receta.'
      );
      return false;
    }

    const ids = lineas.map(
      (linea) => linea.ingredienteId
    );

    const idsUnicos = new Set(ids);

    if (
      idsUnicos.size !== ids.length
    ) {
      setRecetaError(
        'No puedes incluir el mismo ingrediente más de una vez en la receta.'
      );
      return false;
    }

    for (
      let index = 0;
      index < lineas.length;
      index++
    ) {
      const linea = lineas[index];

      if (!linea.ingredienteId) {
        setRecetaError(
          `La línea #${index + 1} no tiene un ingrediente seleccionado.`
        );
        return false;
      }

      const cantidad = Number(
        linea.cantidad
      );

      if (
        !Number.isFinite(cantidad) ||
        cantidad <= 0
      ) {
        setRecetaError(
          `La cantidad del ingrediente en la línea #${
            index + 1
          } debe ser mayor a 0.`
        );
        return false;
      }
    }

    setRecetaError(null);

    return true;
  };

  const construirIngredientes = () =>
    lineas.map((linea) => ({
      ingrediente:
        linea.ingredienteId,
      cantidadNecesaria: Number(
        linea.cantidad
      ),
    }));

  // ─────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setFormError(null);
    setRecetaError(null);

    const cleanNombre =
      nombre.trim();

    if (!cleanNombre) {
      setFormError(
        'El nombre del plato es obligatorio.'
      );
      return;
    }

    const cleanDescripcion =
      descripcion.trim();

    if (!cleanDescripcion) {
      setFormError(
        'La descripción del plato es obligatoria.'
      );
      return;
    }

    const numPrecio =
      Number(precio);

    if (
      !Number.isFinite(numPrecio) ||
      numPrecio < 0
    ) {
      setFormError(
        'El precio debe ser un número válido mayor o igual a 0.'
      );
      return;
    }

    if (!categoria) {
      setFormError(
        'Debes seleccionar una categoría para el plato.'
      );
      return;
    }

    if (
      isLoadingIngredientes ||
      isLoadingReceta
    ) {
      setFormError(
        'Espera a que termine de cargar la información de la receta.'
      );
      return;
    }

    if (!validarReceta()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl =
        platoToEdit?.imagenUrl ||
        DEFAULT_FOOD_IMAGE;

      let finalPublicId =
        platoToEdit?.imagenPublicId ||
        DEFAULT_PUBLIC_ID;

      // Subida de imagen
      if (selectedFile) {
        setUploadStatus(
          'Subiendo imagen al servidor...'
        );

        const uploadRes =
          await platoService.subirImagen(
            selectedFile
          );

        finalImageUrl =
          uploadRes.url;

        finalPublicId =
          uploadRes.publicId;
      }

      const ingredientesReceta =
        construirIngredientes();

      // Crear plato + receta
      if (!isEditing) {
        setUploadStatus(
          'Creando plato y receta...'
        );

        const crearData: CrearPlatoDTO = {
          nombre: cleanNombre,
          descripcion: cleanDescripcion,
          precio: numPrecio,
          categoria,
          imagenUrl: finalImageUrl,
          imagenPublicId: finalPublicId,
          disponible,
          ingredientes:
            ingredientesReceta,
        };

        await onSave(crearData);

        onClose();

        return;
      }

      // Actualizar plato
      setUploadStatus(
        'Actualizando datos del plato...'
      );

      await onSave({
        nombre: cleanNombre,
        descripcion: cleanDescripcion,
        precio: numPrecio,
        categoria,
        imagenUrl: finalImageUrl,
        imagenPublicId: finalPublicId,
        disponible,
      });

      // Actualizar receta
      setUploadStatus(
        'Actualizando receta...'
      );

      const recetaData: GuardarRecetaDTO = {
        plato: platoToEdit!._id,
        ingredientes:
          ingredientesReceta,
      };

      await recetaService.guardarReceta(
        recetaData
      );

      onClose();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Error al guardar el plato y su receta.'
      );
    } finally {
      setIsSubmitting(false);
      setUploadStatus(null);
    }
  };

  const recetaBloqueada =
    isLoadingIngredientes ||
    isLoadingReceta;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {formError && (
        <Alert
          variant="error"
          title="Error en los datos"
        >
          {formError}
        </Alert>
      )}

      {/* Datos principales */}
      <div>
        <Input
          id="plato-nombre"
          name="nombre"
          label="Nombre del Plato"
          placeholder="Ej: Lomo Saltado Criollo, Pique Macho"
          value={nombre}
          onChange={(e) =>
            setNombre(e.target.value)
          }
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="plato-categoria"
            className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5"
          >
            Categoría *
          </label>

          <select
            id="plato-categoria"
            value={categoria}
            onChange={(e) =>
              setCategoria(e.target.value)
            }
            required
            className="w-full py-2 px-3 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            {categorias.length === 0 && (
              <option value="">
                No hay categorías disponibles
              </option>
            )}

            {categorias.map((cat) => (
              <option
                key={cat._id}
                value={cat._id}
              >
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Input
            id="plato-precio"
            name="precio"
            type="number"
            step="0.01"
            min="0"
            label="Precio (Bs.) *"
            placeholder="0.00"
            value={precio}
            onChange={(e) =>
              setPrecio(e.target.value)
            }
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="plato-descripcion"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5"
        >
          Descripción del Plato *
        </label>

        <textarea
          id="plato-descripcion"
          rows={3}
          value={descripcion}
          onChange={(e) =>
            setDescripcion(
              e.target.value
            )
          }
          placeholder="Detalle de preparación, ingredientes principales o notas para el comensal..."
          className="w-full py-2 px-3 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
          required
        />
      </div>

      {/* Imagen */}
      <div>
        <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5">
          Fotografía del Plato
        </label>

        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 relative flex items-center justify-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Vista previa del plato"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-zinc-400" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />

              <span>
                {selectedFile
                  ? 'Cambiar Imagen'
                  : 'Seleccionar Imagen'}
              </span>
            </Button>

            {selectedFile && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" />

                <span>
                  Archivo listo:{' '}
                  {selectedFile.name}
                </span>
              </p>
            )}

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Formatos aceptados: JPG, PNG,
              WebP. Si no seleccionas una imagen,
              se utilizará una fotografía
              gastronómica por defecto.
            </p>
          </div>
        </div>
      </div>

      {/* Receta */}
      <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/50 p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Ingredientes de la Receta
            </h3>

            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Define cuánto se utiliza de cada ingrediente
              para preparar una unidad del plato.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={
              agregarLineaIngrediente
            }
            disabled={
              recetaBloqueada ||
              ingredientes.length === 0 ||
              lineas.length >=
                ingredientes.length
            }
            className="flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </Button>
        </div>

        {recetaError && (
          <Alert
            variant="error"
            title="Error en la receta"
          >
            {recetaError}
          </Alert>
        )}

        {recetaBloqueada ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-stone-500 dark:text-stone-400">
            <Loader2 className="w-4 h-4 animate-spin" />

            <span>
              {isLoadingIngredientes
                ? 'Cargando ingredientes...'
                : 'Cargando receta...'}
            </span>
          </div>
        ) : ingredientes.length === 0 ? (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              No hay ingredientes registrados.
            </p>

            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Primero registra al menos un
              ingrediente desde Inventario.
            </p>
          </div>
        ) : lineas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 dark:border-stone-700 p-5 text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Esta receta todavía no tiene
              ingredientes.
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={
                agregarLineaIngrediente
              }
              className="mt-3"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Agregar primer ingrediente
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {lineas.map(
              (linea, index) => {
                const unidad =
                  obtenerUnidad(
                    linea.ingredienteId
                  );

                const utilizados =
                  new Set(
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
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                  >
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`plato-ingrediente-${index}`}
                        className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-1"
                      >
                        Ingrediente
                      </label>

                      <select
                        id={`plato-ingrediente-${index}`}
                        value={
                          linea.ingredienteId
                        }
                        onChange={(e) =>
                          actualizarLineaIngrediente(
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
                              disabled={utilizados.has(
                                ingrediente._id
                              )}
                            >
                              {ingrediente.nombre}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="w-full sm:w-32">
                      <label
                        htmlFor={`plato-cantidad-${index}`}
                        className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-1"
                      >
                        Cantidad
                      </label>

                      <Input
                        id={`plato-cantidad-${index}`}
                        type="number"
                        min="0.000001"
                        step="any"
                        value={
                          linea.cantidad
                        }
                        onChange={(e) =>
                          actualizarLineaIngrediente(
                            index,
                            'cantidad',
                            e.target.value
                          )
                        }
                        placeholder="0.00"
                        className="text-right font-mono"
                        required
                      />
                    </div>

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

                    <div className="flex justify-end sm:pt-5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          eliminarLineaIngrediente(
                            index
                          )
                        }
                        disabled={
                          lineas.length <= 1
                        }
                        title="Eliminar ingrediente"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="w-4 h-4" />

                        <span className="sm:hidden ml-1">
                          Eliminar
                        </span>
                      </Button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

        {lineas.length > 0 &&
          ingredientes.length > 0 && (
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-3">
              La unidad se obtiene automáticamente
              del ingrediente y no puede modificarse
              desde la receta.
            </p>
          )}
      </section>

      {/* Disponibilidad */}
      <div className="flex items-center gap-3 pt-1">
        <input
          id="plato-disponible"
          type="checkbox"
          checked={disponible}
          onChange={(e) =>
            setDisponible(
              e.target.checked
            )
          }
          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer"
        />

        <label
          htmlFor="plato-disponible"
          className="text-sm font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer select-none"
        >
          Disponible para la venta
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
          disabled={
            recetaBloqueada ||
            ingredientes.length === 0 ||
            lineas.length === 0
          }
        >
          {uploadStatus ||
            (isEditing
              ? 'Guardar Cambios'
              : 'Crear Plato')}
        </Button>
      </div>
    </form>
  );
}

export function PlatoAdminModal({
  isOpen,
  onClose,
  onSave,
  platoToEdit,
  categorias,
}: PlatoAdminModalProps) {
  const isEditing = !!platoToEdit;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? 'Editar Plato del Menú'
          : 'Nuevo Plato del Menú'
      }
      description={
        isEditing
          ? 'Modifica los datos del plato y administra su receta desde la misma ventana.'
          : 'Registra el plato y define sus ingredientes y cantidades necesarias.'
      }
      maxWidth="lg"
    >
      {isOpen && (
        <PlatoAdminFormContent
          key={
            platoToEdit?._id ||
            'nuevo-plato'
          }
          isOpen={isOpen}
          onClose={onClose}
          onSave={onSave}
          platoToEdit={platoToEdit}
          categorias={categorias}
        />
      )}
    </Modal>
  );
}