'use client';

import React, { useState } from 'react';
import { Categoria, CrearCategoriaDTO } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export interface CategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CrearCategoriaDTO) => Promise<void>;
  categoriaToEdit?: Categoria | null;
}

interface CategoriaFormContentProps {
  onClose: () => void;
  onSave: (data: CrearCategoriaDTO) => Promise<void>;
  categoriaToEdit?: Categoria | null;
}

const CATEGORIA_NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/;

function CategoriaFormContent({
  onClose,
  onSave,
  categoriaToEdit,
}: CategoriaFormContentProps) {
  const isEditing = !!categoriaToEdit;
  const [nombre, setNombre] = useState(categoriaToEdit?.nombre || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanNombre = nombre.trim();
    if (!cleanNombre) {
      setFormError('El nombre de la categoría es obligatorio.');
      return;
    }

    if (cleanNombre.length < 2) {
      setFormError('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    if (!CATEGORIA_NAME_REGEX.test(cleanNombre)) {
      setFormError('El nombre de la categoría solo puede contener letras y espacios (sin números ni caracteres especiales).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({ nombre: cleanNombre });
      onClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al procesar la categoría.');
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

      <div>
        <Input
          id="categoria-nombre"
          name="nombre"
          label="Nombre de la Categoría"
          placeholder="Ej: Entradas, Platos Fuertes, Bebidas, Postres"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          autoFocus
          helperText="Solo se permiten letras y espacios."
        />
      </div>

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
          {isEditing ? 'Guardar Cambios' : 'Crear Categoría'}
        </Button>
      </div>
    </form>
  );
}

export function CategoriaModal({
  isOpen,
  onClose,
  onSave,
  categoriaToEdit,
}: CategoriaModalProps) {
  const isEditing = !!categoriaToEdit;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Categoría' : 'Nueva Categoría del Menú'}
      description={
        isEditing
          ? 'Modifica el nombre de la categoría para organizar los platos del restaurante.'
          : 'Crea una nueva clasificación para organizar los platos en el catálogo y comandas.'
      }
      maxWidth="md"
    >
      {isOpen && (
        <CategoriaFormContent
          key={categoriaToEdit?._id || 'nueva-categoria'}
          onClose={onClose}
          onSave={onSave}
          categoriaToEdit={categoriaToEdit}
        />
      )}
    </Modal>
  );
}
