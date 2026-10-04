'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Ingrediente, CrearIngredienteDTO } from '@/types';
import { ingredienteService } from '@/services/ingrediente.service';
import { RoleGuard } from '@/components/auth/role-guard';
import { useSocketEvent } from '@/hooks/use-socket';
import { SOCKET_EVENTS } from '@/lib/socket';
import { IngredienteModal } from '@/components/ingredientes/ingrediente-modal';
import { IngredienteDeleteModal } from '@/components/ingredientes/ingrediente-delete-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Apple,
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

function IngredientesPageContent() {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDisponibilidad, setSelectedDisponibilidad] = useState<'Todos' | 'Disponibles' | 'Agotados'>('Todos');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [ingredienteToEdit, setIngredienteToEdit] = useState<Ingrediente | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [ingredienteToDelete, setIngredienteToDelete] = useState<Ingrediente | null>(null);

  const loadIngredientes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ingredienteService.getIngredientes();
      setIngredientes(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los ingredientes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadIngredientes();
    });
  }, [loadIngredientes]);

  // Escuchar actualización en tiempo real desde el backend
  useSocketEvent(SOCKET_EVENTS.INVENTARIO_ACTUALIZADO, () => {
    loadIngredientes();
  });

  // Filtrado
  const filteredIngredientes = useMemo(() => {
    return ingredientes.filter((ing) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesName = ing.nombre.toLowerCase().includes(term);
        const matchesUnidad = ing.unidadMedida.toLowerCase().includes(term);
        if (!matchesName && !matchesUnidad) return false;
      }

      if (selectedDisponibilidad === 'Disponibles' && !ing.disponible) return false;
      if (selectedDisponibilidad === 'Agotados' && ing.disponible) return false;

      return true;
    });
  }, [ingredientes, searchTerm, selectedDisponibilidad]);

  // Contadores
  const totalDisponibles = useMemo(() => ingredientes.filter((i) => i.disponible).length, [ingredientes]);
  const totalAgotados = useMemo(() => ingredientes.filter((i) => !i.disponible).length, [ingredientes]);

  // Auto-cerrar notificación
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleOpenCreate = () => {
    setIngredienteToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ing: Ingrediente) => {
    setIngredienteToEdit(ing);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (ing: Ingrediente) => {
    setIngredienteToDelete(ing);
    setIsDeleteOpen(true);
  };

  const handleSave = async (dto: CrearIngredienteDTO) => {
    if (ingredienteToEdit) {
      await ingredienteService.actualizarIngrediente(ingredienteToEdit._id, dto);
      setNotification({ type: 'success', message: `Ingrediente "${dto.nombre}" actualizado con éxito.` });
    } else {
      await ingredienteService.crearIngrediente(dto);
      setNotification({ type: 'success', message: `Ingrediente "${dto.nombre}" agregado al inventario.` });
    }
    await loadIngredientes();
  };

  const handleDelete = async () => {
    if (!ingredienteToDelete) return;
    await ingredienteService.eliminarIngrediente(ingredienteToDelete._id);
    setNotification({ type: 'success', message: `Ingrediente "${ingredienteToDelete.nombre}" eliminado.` });
    await loadIngredientes();
  };

  const handleToggleDisponibilidad = async (ing: Ingrediente) => {
    const nextState = !ing.disponible;
    // Optimista
    setIngredientes((prev) =>
      prev.map((i) => (i._id === ing._id ? { ...i, disponible: nextState } : i))
    );
    try {
      await ingredienteService.toggleDisponibilidad(ing._id, nextState);
      setNotification({
        type: 'success',
        message: `Ingrediente "${ing.nombre}" marcado como ${nextState ? 'disponible' : 'agotado'}.`,
      });
    } catch (err: unknown) {
      setIngredientes((prev) =>
        prev.map((i) => (i._id === ing._id ? { ...i, disponible: !nextState } : i))
      );
      setError(err instanceof Error ? err.message : 'Error al cambiar disponibilidad.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Apple className="w-6 h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Ingredientes e Insumos
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Control de insumos base para escandallos y disponibilidad en tiempo real para cocina.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={loadIngredientes}
            disabled={isLoading}
            title="Recargar ingredientes"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Ingrediente</span>
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
        <Alert variant="error" title="Error en el inventario">
          <div className="flex flex-col gap-2">
            <span>{error}</span>
            <div>
              <Button variant="outline" size="sm" onClick={loadIngredientes}>
                Reintentar
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Resumen Métrico */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Total Insumos</span>
          <p className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">{ingredientes.length}</p>
        </div>
        <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disponibles en Cocina
          </span>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{totalDisponibles}</p>
        </div>
        <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Insumos Agotados
          </span>
          <p className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-1">{totalAgotados}</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-3 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex-1 max-w-sm">
          <Input
            id="buscar-ingrediente"
            placeholder="Buscar por nombre o unidad de medida..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDisponibilidad}
            onChange={(e) => setSelectedDisponibilidad(e.target.value as 'Todos' | 'Disponibles' | 'Agotados')}
            aria-label="Filtrar por disponibilidad"
            className="py-2 px-3 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="Todos">Todos los Estados</option>
            <option value="Disponibles">Solo Disponibles</option>
            <option value="Agotados">Solo Agotados</option>
          </select>
        </div>
      </div>

      {/* Estado de Carga */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
          <Spinner size="lg" />
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-4">
            Cargando catálogo de ingredientes...
          </p>
        </div>
      )}

      {/* Vacío */}
      {!isLoading && filteredIngredientes.length === 0 && (
        <EmptyState
          icon={Apple}
          title={searchTerm || selectedDisponibilidad !== 'Todos' ? 'Sin coincidencias' : 'No hay ingredientes'}
          description={
            searchTerm || selectedDisponibilidad !== 'Todos'
              ? 'Prueba modificando tus filtros o criterio de búsqueda.'
              : 'Empieza registrando insumos para poder construir las recetas y escandallos.'
          }
          action={
            <Button
              variant={searchTerm || selectedDisponibilidad !== 'Todos' ? 'outline' : 'primary'}
              size="sm"
              onClick={
                searchTerm || selectedDisponibilidad !== 'Todos'
                  ? () => {
                      setSearchTerm('');
                      setSelectedDisponibilidad('Todos');
                    }
                  : handleOpenCreate
              }
            >
              {searchTerm || selectedDisponibilidad !== 'Todos' ? 'Restablecer filtros' : 'Crear Ingrediente'}
            </Button>
          }
        />
      )}

      {/* Tabla de Ingredientes */}
      {!isLoading && filteredIngredientes.length > 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" role="table">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Ingrediente</th>
                  <th scope="col" className="px-6 py-3.5">Unidad de Medida</th>
                  <th scope="col" className="px-6 py-3.5">Disponibilidad</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredIngredientes.map((ing) => (
                  <tr
                    key={ing._id}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-stone-900 dark:text-stone-100">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            ing.disponible ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          aria-hidden="true"
                        />
                        <span>{ing.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-600 dark:text-stone-300 font-mono text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                        {ing.unidadMedida}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={ing.disponible ? 'success' : 'danger'} dot>
                          {ing.disponible ? 'Disponible' : 'Agotado'}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => handleToggleDisponibilidad(ing)}
                          className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                          title={ing.disponible ? 'Marcar como agotado' : 'Marcar como disponible'}
                        >
                          {ing.disponible ? (
                            <ToggleRight className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-stone-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(ing)}
                          className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                          title={`Editar ingrediente ${ing.nombre}`}
                        >
                          <Pencil className="w-4 h-4 mr-1.5" />
                          <span>Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete(ing)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          title={`Eliminar ingrediente ${ing.nombre}`}
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

      {/* Modales */}
      <IngredienteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        ingredienteToEdit={ingredienteToEdit}
      />

      <IngredienteDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        ingrediente={ingredienteToDelete}
      />
    </div>
  );
}

export default function IngredientesPage() {
  return (
    <RoleGuard allowedRoles={['Administrador']}>
      <IngredientesPageContent />
    </RoleGuard>
  );
}
