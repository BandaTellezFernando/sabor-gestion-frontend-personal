'use client';

import React, { useState, useRef } from 'react';
import { Plato, Categoria, CrearPlatoDTO, ActualizarPlatoDTO } from '@/types';
import { platoService } from '@/services/plato.service';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Upload, Image as ImageIcon, Check } from 'lucide-react';

export interface PlatoAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CrearPlatoDTO | ActualizarPlatoDTO) => Promise<void>;
  platoToEdit?: Plato | null;
  categorias: Categoria[];
}

interface PlatoAdminFormContentProps {
  onClose: () => void;
  onSave: (data: CrearPlatoDTO | ActualizarPlatoDTO) => Promise<void>;
  platoToEdit?: Plato | null;
  categorias: Categoria[];
}

const DEFAULT_FOOD_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
const DEFAULT_PUBLIC_ID = 'placeholder_plato';

function PlatoAdminFormContent({
  onClose,
  onSave,
  platoToEdit,
  categorias,
}: PlatoAdminFormContentProps) {
  const isEditing = !!platoToEdit;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializar estado de campos
  const [nombre, setNombre] = useState(platoToEdit?.nombre || '');
  const [descripcion, setDescripcion] = useState(platoToEdit?.descripcion || '');
  const [precio, setPrecio] = useState<string>(
    platoToEdit ? String(platoToEdit.precio) : ''
  );
  const initialCategoriaId =
    typeof platoToEdit?.categoria === 'object' && platoToEdit.categoria
      ? (platoToEdit.categoria as Categoria)._id
      : (platoToEdit?.categoria as string) || (categorias[0]?._id || '');

  const [categoria, setCategoria] = useState<string>(initialCategoriaId);
  const [disponible, setDisponible] = useState<boolean>(
    platoToEdit?.disponible !== undefined ? platoToEdit.disponible : true
  );

  // Gestión de archivo de imagen
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(
    platoToEdit?.imagenUrl || ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('El archivo seleccionado debe ser una imagen válida (JPG, PNG, WebP).');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanNombre = nombre.trim();
    if (!cleanNombre) {
      setFormError('El nombre del plato es obligatorio.');
      return;
    }

    const cleanDescripcion = descripcion.trim();
    if (!cleanDescripcion) {
      setFormError('La descripción del plato es obligatoria.');
      return;
    }

    const numPrecio = parseFloat(precio);
    if (isNaN(numPrecio) || numPrecio < 0) {
      setFormError('El precio debe ser un número válido mayor o igual a 0.');
      return;
    }

    if (!categoria) {
      setFormError('Debes seleccionar una categoría para el plato.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = platoToEdit?.imagenUrl || DEFAULT_FOOD_IMAGE;
      let finalPublicId = platoToEdit?.imagenPublicId || DEFAULT_PUBLIC_ID;

      // Subir imagen si el usuario seleccionó un nuevo archivo
      if (selectedFile) {
        setUploadStatus('Subiendo imagen al servidor...');
        const uploadRes = await platoService.subirImagen(selectedFile);
        finalImageUrl = uploadRes.url;
        finalPublicId = uploadRes.publicId;
      }

      setUploadStatus('Guardando plato en el catálogo...');
      await onSave({
        nombre: cleanNombre,
        descripcion: cleanDescripcion,
        precio: numPrecio,
        categoria,
        imagenUrl: finalImageUrl,
        imagenPublicId: finalPublicId,
        disponible,
      });

      onClose();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Error al procesar la solicitud del plato.'
      );
    } finally {
      setIsSubmitting(false);
      setUploadStatus(null);
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
          id="plato-nombre"
          name="nombre"
          label="Nombre del Plato"
          placeholder="Ej: Lomo Saltado Criollo, Pique Macho, Jugo Especial"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>

      {/* Categoría y Precio en fila */}
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
            onChange={(e) => setCategoria(e.target.value)}
            required
            className="w-full py-2 px-3 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            {categorias.length === 0 && (
              <option value="">No hay categorías disponibles</option>
            )}
            {categorias.map((cat) => (
              <option key={cat._id} value={cat._id}>
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
            step="0.50"
            min="0"
            label="Precio (Bs.) *"
            placeholder="0.00"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Descripción */}
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
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Detalle de preparación, ingredientes principales o notas para el comensal..."
          className="w-full py-2 px-3 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
          required
        />
      </div>

      {/* Subida de Imagen y Vista Previa */}
      <div>
        <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5">
          Fotografía del Plato
        </label>
        <div className="flex items-start gap-4">
          {/* Miniatura Preview */}
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
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{selectedFile ? 'Cambiar Imagen' : 'Seleccionar Imagen'}</span>
            </Button>
            {selectedFile && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Archivo listo: {selectedFile.name}</span>
              </p>
            )}
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Formatos aceptados: JPG, PNG, WebP. Si no seleccionas una imagen, se asignará una fotografía gastronómica por defecto.
            </p>
          </div>
        </div>
      </div>

      {/* Disponibilidad */}
      <div className="flex items-center gap-3 pt-2">
        <input
          id="plato-disponible"
          type="checkbox"
          checked={disponible}
          onChange={(e) => setDisponible(e.target.checked)}
          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer"
        />
        <label
          htmlFor="plato-disponible"
          className="text-sm font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer select-none"
        >
          Disponible para la venta (Mostrar en comanda)
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
          {uploadStatus || (isEditing ? 'Guardar Cambios' : 'Crear Plato')}
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
      title={isEditing ? 'Editar Plato del Menú' : 'Nuevo Plato del Menú'}
      description={
        isEditing
          ? 'Modifica los datos, precio, categoría o fotografía del plato.'
          : 'Registra un nuevo plato o bebida en la carta del restaurante.'
      }
      maxWidth="lg"
    >
      {isOpen && (
        <PlatoAdminFormContent
          key={platoToEdit?._id || 'nuevo-plato'}
          onClose={onClose}
          onSave={onSave}
          platoToEdit={platoToEdit}
          categorias={categorias}
        />
      )}
    </Modal>
  );
}
