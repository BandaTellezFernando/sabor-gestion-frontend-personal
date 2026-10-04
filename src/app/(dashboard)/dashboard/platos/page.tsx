'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plato, Categoria, CrearPlatoDTO, ActualizarPlatoDTO } from '@/types';
import { platoService } from '@/services/plato.service';
import { categoriaService } from '@/services/categoria.service';
import { RoleGuard } from '@/components/auth/role-guard';
import { PlatoAdminModal } from '@/components/platos/plato-admin-modal';
import { PlatoDeleteModal } from '@/components/platos/plato-delete-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Utensils,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

function PlatosPageContent() {
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
  const [selectedDisponibilidad, setSelectedDisponibilidad] = useState<'Todos' | 'Disponibles' | 'Agotados'>('Todos');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [platoToEdit, setPlatoToEdit] = useState<Plato | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [platoToDelete, setPlatoToDelete] = useState<Plato | null>(null);

  // Carga de datos
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [platosData, categoriasData] = await Promise.all([
        platoService.getPlatos(),
        categoriaService.getCategorias(),
      ]);
      setPlatos(platosData);
      setCategorias(categoriasData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos del menú.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, [loadData]);

  // Filtrado reactivo
  const filteredPlatos = useMemo(() => {
    return platos.filter((plato) => {
      // Filtro de texto (nombre o descripción)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesName = plato.nombre.toLowerCase().includes(term);
        const matchesDesc = (plato.descripcion || '').toLowerCase().includes(term);
        if (!matchesName && !matchesDesc) return false;
      }

      // Filtro por categoría
      if (selectedCategoria !== 'Todas') {
        const catId = typeof plato.categoria === 'object' && plato.categoria ? plato.categoria._id : plato.categoria;
        if (catId !== selectedCategoria) return false;
      }

      // Filtro por disponibilidad
      if (selectedDisponibilidad === 'Disponibles' && !plato.disponible) return false;
      if (selectedDisponibilidad === 'Agotados' && plato.disponible) return false;

      return true;
    });
  }, [platos, searchTerm, selectedCategoria, selectedDisponibilidad]);

  // Contadores para métricas
  const totalDisponibles = useMemo(() => platos.filter((p) => p.disponible).length, [platos]);
  const totalAgotados = useMemo(() => platos.filter((p) => !p.disponible).length, [platos]);

  // Auto-cerrar notificación de éxito
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleOpenCreate = () => {
    setPlatoToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plato: Plato) => {
    setPlatoToEdit(plato);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (plato: Plato) => {
    setPlatoToDelete(plato);
    setIsDeleteOpen(true);
  };

  const handleSave = async (dto: CrearPlatoDTO | ActualizarPlatoDTO) => {
    if (platoToEdit) {
      await platoService.actualizarPlato(platoToEdit._id, dto);
      setNotification({ type: 'success', message: `Plato "${dto.nombre}" actualizado con éxito.` });
    } else {
      await platoService.crearPlato(dto as CrearPlatoDTO);
      setNotification({ type: 'success', message: `Plato "${dto.nombre}" agregado al menú.` });
    }
    await loadData();
  };

  const handleDelete = async () => {
    if (!platoToDelete) return;
    await platoService.eliminarPlato(platoToDelete._id);
    setNotification({ type: 'success', message: `Plato "${platoToDelete.nombre}" eliminado del menú.` });
    await loadData();
  };

  const handleToggleDisponibilidad = async (plato: Plato) => {
    const nextState = !plato.disponible;
    // Actualización optimista local
    setPlatos((prev) =>
      prev.map((p) => (p._id === plato._id ? { ...p, disponible: nextState } : p))
    );
    try {
      await platoService.toggleDisponibilidad(plato._id, nextState);
      setNotification({
        type: 'success',
        message: `Plato "${plato.nombre}" marcado como ${nextState ? 'disponible' : 'agotado'}.`,
      });
    } catch (err: unknown) {
      // Revertir en caso de falla
      setPlatos((prev) =>
        prev.map((p) => (p._id === plato._id ? { ...p, disponible: !nextState } : p))
      );
      setError(err instanceof Error ? err.message : 'Error al actualizar disponibilidad.');
    }
  };

  // Helper para nombre de categoría
  const getCategoriaNombre = (plato: Plato) => {
    if (typeof plato.categoria === 'object' && plato.categoria) {
      return (plato.categoria as Categoria).nombre;
    }
    const found = categorias.find((c) => c._id === plato.categoria);
    return found ? found.nombre : 'Sin categoría';
  };

  return (
    <div className="space-y-6">
      {/* Cabecera de Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Utensils className="w-6 h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Menú y Platos
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Administra la carta gastronómica, precios, recetas asociadas y disponibilidad inmediata.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={loadData}
            disabled={isLoading}
            title="Recargar platos"
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
            <span>Nuevo Plato</span>
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
        <Alert variant="error" title="Error en el catálogo">
          <div className="flex flex-col gap-2">
            <span>{error}</span>
            <div>
              <Button variant="outline" size="sm" onClick={loadData}>
                Reintentar
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Resumen Métrico Rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Total Carta</span>
          <p className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">{platos.length}</p>
        </div>
        <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disponibles
          </span>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{totalDisponibles}</p>
        </div>
        <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Agotados
          </span>
          <p className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-1">{totalAgotados}</p>
        </div>
        <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-xs text-primary font-medium">Categorías</span>
          <p className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">{categorias.length}</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex-1 max-w-sm">
          <Input
            id="buscar-plato"
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Categoría */}
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            aria-label="Filtrar por categoría"
            className="py-2 px-3 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="Todas">Todas las Categorías</option>
            {categorias.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          {/* Selector de Disponibilidad */}
          <select
            value={selectedDisponibilidad}
            onChange={(e) => setSelectedDisponibilidad(e.target.value as 'Todos' | 'Disponibles' | 'Agotados')}
            aria-label="Filtrar por disponibilidad"
            className="py-2 px-3 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="Todos">Todos los Estados</option>
            <option value="Disponibles">Solo Disponibles</option>
            <option value="Agotados">Solo Agotados</option>
          </select>
        </div>
      </div>

      {/* Estado de Carga */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <Spinner size="lg" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4">
            Cargando carta de platos...
          </p>
        </div>
      )}

      {/* Vacío */}
      {!isLoading && filteredPlatos.length === 0 && (
        <EmptyState
          icon={Utensils}
          title={searchTerm || selectedCategoria !== 'Todas' ? 'Sin coincidencias' : 'No hay platos registrados'}
          description={
            searchTerm || selectedCategoria !== 'Todas'
              ? 'Prueba modificando tus filtros o criterio de búsqueda.'
              : 'Empieza agregando el primer plato al menú del restaurante.'
          }
          action={
            <Button
              variant={searchTerm || selectedCategoria !== 'Todas' ? 'outline' : 'primary'}
              size="sm"
              onClick={
                searchTerm || selectedCategoria !== 'Todas'
                  ? () => {
                      setSearchTerm('');
                      setSelectedCategoria('Todas');
                      setSelectedDisponibilidad('Todos');
                    }
                  : handleOpenCreate
              }
            >
              {searchTerm || selectedCategoria !== 'Todas' ? 'Restablecer filtros' : 'Crear Plato'}
            </Button>
          }
        />
      )}

      {/* Grilla de Platos */}
      {!isLoading && filteredPlatos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlatos.map((plato) => (
            <div
              key={plato._id}
              className={`flex flex-col justify-between bg-white dark:bg-stone-900 rounded-3xl border transition-all shadow-xs overflow-hidden ${
                plato.disponible
                  ? 'border-stone-200 dark:border-stone-800'
                  : 'border-stone-200 dark:border-stone-800/80 opacity-75 bg-stone-50/50 dark:bg-stone-950/40'
              }`}
            >
              <div>
                {/* Imagen del Plato */}
                <div className="relative h-44 w-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={plato.imagenUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
                    alt={plato.nombre}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  {/* Badge de Disponibilidad sobre la foto */}
                  <div className="absolute top-3 right-3">
                    <Badge variant={plato.disponible ? 'success' : 'danger'} dot>
                      {plato.disponible ? 'Disponible' : 'Agotado'}
                    </Badge>
                  </div>
                  {/* Categoría sobre la foto */}
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2.5 py-1 bg-stone-900/80 backdrop-blur-xs text-stone-100 text-[11px] font-semibold rounded-lg">
                      {getCategoriaNombre(plato)}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-4 sm:p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-bold text-base text-stone-900 dark:text-stone-100 leading-snug line-clamp-1">
                      {plato.nombre}
                    </h2>
                    <span className="font-extrabold text-primary dark:text-primary-light text-base shrink-0">
                      Bs. {plato.precio.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                    {plato.descripcion || 'Sin descripción detallada.'}
                  </p>
                </div>
              </div>

              {/* Barra de Acciones */}
              <div className="p-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 bg-stone-50/50 dark:bg-stone-900/50">
                {/* Conmutador de Disponibilidad */}
                <button
                  type="button"
                  onClick={() => handleToggleDisponibilidad(plato)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl transition-colors ${
                    plato.disponible
                      ? 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                      : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                  title={plato.disponible ? 'Desactivar plato' : 'Activar plato'}
                >
                  {plato.disponible ? (
                    <ToggleRight className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-stone-400" />
                  )}
                  <span className="hidden sm:inline">
                    {plato.disponible ? 'Activo' : 'Inactivo'}
                  </span>
                </button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(plato)}
                    className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 px-2.5 py-1 text-xs rounded-xl"
                    title={`Editar ${plato.nombre}`}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    <span>Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDelete(plato)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 px-2.5 py-1 text-xs rounded-xl"
                    title={`Eliminar ${plato.nombre}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modales */}
      <PlatoAdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        platoToEdit={platoToEdit}
        categorias={categorias}
      />

      <PlatoDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        plato={platoToDelete}
      />
    </div>
  );
}

export default function PlatosPage() {
  return (
    <RoleGuard allowedRoles={['Administrador']}>
      <PlatosPageContent />
    </RoleGuard>
  );
}
