'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Categoria, CrearCategoriaDTO } from '@/types';
import { categoriaService } from '@/services/categoria.service';
import { RoleGuard } from '@/components/auth/role-guard';
import { CategoriaModal } from '@/components/categorias/categoria-modal';
import { CategoriaDeleteModal } from '@/components/categorias/categoria-delete-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Layers, Plus, Search, RefreshCw, Pencil, Trash2 } from 'lucide-react';

function CategoriasPageContent() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [categoriaToEdit, setCategoriaToEdit] = useState<Categoria | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<Categoria | null>(null);

  const loadCategorias = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await categoriaService.getCategorias();
      setCategorias(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar las categorías.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadCategorias();
    });
  }, [loadCategorias]);

  // Filtrado
  const filteredCategorias = useMemo(() => {
    if (!searchTerm.trim()) return categorias;
    const term = searchTerm.toLowerCase().trim();
    return categorias.filter((c) => c.nombre.toLowerCase().includes(term));
  }, [categorias, searchTerm]);

  // Auto-cerrar notificación de éxito
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleOpenCreate = () => {
    setCategoriaToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (categoria: Categoria) => {
    setCategoriaToEdit(categoria);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (categoria: Categoria) => {
    setCategoriaToDelete(categoria);
    setIsDeleteOpen(true);
  };

  const handleSave = async (dto: CrearCategoriaDTO) => {
    if (categoriaToEdit) {
      await categoriaService.actualizarCategoria(categoriaToEdit._id, dto);
      setNotification({ type: 'success', message: `Categoría "${dto.nombre}" actualizada exitosamente.` });
    } else {
      await categoriaService.crearCategoria(dto);
      setNotification({ type: 'success', message: `Categoría "${dto.nombre}" creada exitosamente.` });
    }
    await loadCategorias();
  };

  const handleDelete = async () => {
    if (!categoriaToDelete) return;
    await categoriaService.eliminarCategoria(categoriaToDelete._id);
    setNotification({ type: 'success', message: `Categoría "${categoriaToDelete.nombre}" eliminada exitosamente.` });
    await loadCategorias();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera de Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Categorías del Menú
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Administra las clasificaciones de la carta para organizar platos y agilizar comandas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={loadCategorias}
            disabled={isLoading}
            title="Recargar categorías"
            className="rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Categoría</span>
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {notification && (
        <Alert
          variant={notification.type === 'success' ? 'success' : 'error'}
          title={notification.type === 'success' ? 'Operación exitosa' : 'Aviso'}
        >
          {notification.message}
        </Alert>
      )}

      {error && (
        <Alert variant="error" title="Error al sincronizar">
          <div className="flex flex-col gap-2">
            <span>{error}</span>
            <div>
              <Button variant="outline" size="sm" onClick={loadCategorias} className="rounded-xl">
                Reintentar
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex-1 max-w-md">
          <Input
            id="buscar-categoria"
            placeholder="Buscar categoría por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="text-xs text-stone-500 dark:text-stone-400 self-center sm:self-auto font-medium">
          Total: {filteredCategorias.length} {filteredCategorias.length === 1 ? 'categoría' : 'categorías'}
        </div>
      </div>

      {/* Estado de Carga */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <Spinner size="lg" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4">
            Cargando catálogo de categorías...
          </p>
        </div>
      )}

      {/* Lista / Tabla de Categorías */}
      {!isLoading && filteredCategorias.length === 0 && (
        <EmptyState
          icon={Layers}
          title={searchTerm ? 'No se encontraron categorías' : 'No hay categorías registradas'}
          description={
            searchTerm
              ? `No hay ninguna categoría que coincida con "${searchTerm}".`
              : 'Empieza creando la primera categoría para organizar los platos del restaurante.'
          }
          action={
            <Button
              variant={searchTerm ? 'outline' : 'primary'}
              size="sm"
              onClick={searchTerm ? () => setSearchTerm('') : handleOpenCreate}
            >
              {searchTerm ? 'Limpiar búsqueda' : 'Crear Categoría'}
            </Button>
          }
        />
      )}

      {!isLoading && filteredCategorias.length > 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" role="table">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Nombre</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredCategorias.map((cat) => (
                  <tr
                    key={cat._id}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-stone-900 dark:text-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
                        <span>{cat.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(cat)}
                          className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 rounded-xl"
                          title={`Editar categoría ${cat.nombre}`}
                        >
                          <Pencil className="w-4 h-4 mr-1.5" />
                          <span>Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete(cat)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 rounded-xl"
                          title={`Eliminar categoría ${cat.nombre}`}
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          <span>Eliminar</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales de Crear / Editar y Eliminar */}
      <CategoriaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        categoriaToEdit={categoriaToEdit}
      />

      <CategoriaDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        categoria={categoriaToDelete}
      />
    </div>
  );
}

export default function CategoriasPage() {
  return (
    <RoleGuard allowedRoles={['Administrador']}>
      <CategoriasPageContent />
    </RoleGuard>
  );
}
