'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Receta, Plato, Ingrediente, GuardarRecetaDTO } from '@/types';
import { recetaService } from '@/services/receta.service';
import { platoService } from '@/services/plato.service';
import { ingredienteService } from '@/services/ingrediente.service';
import { RoleGuard } from '@/components/auth/role-guard';
import { useSocketEvent } from '@/hooks/use-socket';
import { SOCKET_EVENTS } from '@/lib/socket';
import { RecetaModal } from '@/components/recetas/receta-modal';
import { RecetaDeleteModal } from '@/components/recetas/receta-delete-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ScrollText,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Utensils,
} from 'lucide-react';

function RecetasPageContent() {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [recetaToEdit, setRecetaToEdit] = useState<Receta | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [recetaToDelete, setRecetaToDelete] = useState<Receta | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [recetasData, platosData, ingredientesData] = await Promise.all([
        recetaService.getRecetas(),
        platoService.getPlatos(),
        ingredienteService.getIngredientes(),
      ]);
      setRecetas(recetasData);
      setPlatos(platosData);
      setIngredientes(ingredientesData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar las recetas y escandallos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, [loadData]);

  // Escuchar actualización en tiempo real desde el backend
  useSocketEvent(SOCKET_EVENTS.INVENTARIO_ACTUALIZADO, () => {
    loadData();
  });

  // Mapa de disponibilidad de ingredientes para verificación rápida
  const ingredientMap = useMemo(() => {
    const map = new Map<string, Ingrediente>();
    ingredientes.forEach((i) => map.set(i._id, i));
    return map;
  }, [ingredientes]);

  // Filtrado reactivo por nombre de plato o ingrediente
  const filteredRecetas = useMemo(() => {
    if (!searchTerm.trim()) return recetas;
    const term = searchTerm.toLowerCase().trim();

    return recetas.filter((receta) => {
      // Buscar por nombre de plato
      const platoNombre =
        typeof receta.plato === 'object' && receta.plato
          ? (receta.plato as Plato).nombre.toLowerCase()
          : '';
      if (platoNombre.includes(term)) return true;

      // Buscar por nombre de algún ingrediente de la receta
      const hasIngredient = receta.ingredientes.some((i) => {
        let name = '';
        if (typeof i.ingrediente === 'object' && i.ingrediente) {
          name = (i.ingrediente as Ingrediente).nombre.toLowerCase();
        } else {
          const found = ingredientMap.get(i.ingrediente as string);
          if (found) name = found.nombre.toLowerCase();
        }
        return name.includes(term);
      });

      return hasIngredient;
    });
  }, [recetas, searchTerm, ingredientMap]);

  // Analizar recetas con insumos faltantes
  const metricas = useMemo(() => {
    let completas = 0;
    let conFaltantes = 0;

    recetas.forEach((receta) => {
      const tieneFaltante = receta.ingredientes.some((i) => {
        const ingId =
          typeof i.ingrediente === 'object' && i.ingrediente
            ? (i.ingrediente as Ingrediente)._id
            : (i.ingrediente as string);
        const liveIng = ingredientMap.get(ingId);
        return liveIng ? !liveIng.disponible : false;
      });

      if (tieneFaltante) {
        conFaltantes++;
      } else {
        completas++;
      }
    });

    return { total: recetas.length, completas, conFaltantes };
  }, [recetas, ingredientMap]);

  // Auto-cerrar notificación
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleOpenCreate = () => {
    setRecetaToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (receta: Receta) => {
    setRecetaToEdit(receta);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (receta: Receta) => {
    setRecetaToDelete(receta);
    setIsDeleteOpen(true);
  };

  const handleSave = async (dto: GuardarRecetaDTO) => {
    await recetaService.guardarReceta(dto);
    setNotification({
      type: 'success',
      message: 'Receta / escandallo guardado exitosamente.',
    });
    await loadData();
  };

  const handleDelete = async () => {
    if (!recetaToDelete) return;
    await recetaService.eliminarReceta(recetaToDelete._id);
    setNotification({
      type: 'success',
      message: 'Receta eliminada del catálogo.',
    });
    await loadData();
  };

  // Helper para datos del plato
  const getPlatoInfo = (receta: Receta): { nombre: string; precio: number; imagenUrl?: string } => {
    if (typeof receta.plato === 'object' && receta.plato) {
      const p = receta.plato as Plato;
      return { nombre: p.nombre, precio: p.precio, imagenUrl: p.imagenUrl };
    }
    const found = platos.find((p) => p._id === receta.plato);
    return {
      nombre: found?.nombre || 'Plato del Menú',
      precio: found?.precio || 0,
      imagenUrl: found?.imagenUrl,
    };
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Recetas y Escandallos
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Fórmulas de preparación, control de insumos y compatibilidad de platos según disponibilidad de cocina.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={loadData}
            disabled={isLoading}
            title="Recargar recetas"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            disabled={platos.length === 0 || ingredientes.length === 0}
            className="flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Receta</span>
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
        <Alert variant="error" title="Error de sincronización">
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

      {/* Resumen Métrico */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Recetas Configuradas</span>
          <p className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">{metricas.total}</p>
        </div>
        <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Insumos 100% Listos
          </span>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{metricas.completas}</p>
        </div>
        <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Con Insumo Agotado
          </span>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">{metricas.conFaltantes}</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-3 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex-1 max-w-md">
          <Input
            id="buscar-receta"
            placeholder="Buscar por plato o ingrediente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="text-xs text-stone-500 dark:text-stone-400 self-center sm:self-auto font-medium">
          Total: {filteredRecetas.length} {filteredRecetas.length === 1 ? 'receta' : 'recetas'}
        </div>
      </div>

      {/* Estado de Carga */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
          <Spinner size="lg" />
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-4">
            Cargando recetas y escandallos...
          </p>
        </div>
      )}

      {/* Vacío */}
      {!isLoading && filteredRecetas.length === 0 && (
        <EmptyState
          icon={ScrollText}
          title={searchTerm ? 'No se encontraron recetas' : 'No hay recetas configuradas'}
          description={
            searchTerm
              ? `No se encontraron coincidencias para "${searchTerm}".`
              : 'Empieza definiendo los ingredientes necesarios para los platos de la carta.'
          }
          action={
            <Button
              variant={searchTerm ? 'outline' : 'primary'}
              size="sm"
              onClick={searchTerm ? () => setSearchTerm('') : handleOpenCreate}
            >
              {searchTerm ? 'Limpiar búsqueda' : 'Crear Receta'}
            </Button>
          }
        />
      )}

      {/* Grilla de Recetas */}
      {!isLoading && filteredRecetas.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRecetas.map((receta) => {
            const platoInfo = getPlatoInfo(receta);

            // Verificar si algún ingrediente está agotado
            const faltantes = receta.ingredientes.filter((i) => {
              const ingId =
                typeof i.ingrediente === 'object' && i.ingrediente
                  ? (i.ingrediente as Ingrediente)._id
                  : (i.ingrediente as string);
              const liveIng = ingredientMap.get(ingId);
              return liveIng ? !liveIng.disponible : false;
            });
            const tieneFaltantes = faltantes.length > 0;

            return (
              <div
                key={receta._id}
                className="flex flex-col justify-between bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs transition-all hover:border-stone-300 dark:hover:border-stone-700"
              >
                <div className="space-y-4">
                  {/* Encabezado del Plato */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {platoInfo.imagenUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={platoInfo.imagenUrl}
                          alt={platoInfo.nombre}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-200 dark:border-stone-800 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                          <Utensils className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 leading-snug">
                          {platoInfo.nombre}
                        </h2>
                        <span className="text-xs font-semibold text-primary">
                          Bs. {platoInfo.precio.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {tieneFaltantes ? (
                        <Badge variant="warning" dot>
                          Insumo Agotado
                        </Badge>
                      ) : (
                        <Badge variant="success" dot>
                          Completa
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Tabla de Ingredientes de la Receta */}
                  <div className="bg-stone-50 dark:bg-stone-800/40 rounded-xl p-3 border border-stone-100 dark:border-stone-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2 block">
                      Escandallo ({receta.ingredientes.length} insumos)
                    </span>
                    <ul className="space-y-1.5" role="list">
                      {receta.ingredientes.map((det, idx) => {
                        let ingNombre = 'Ingrediente';
                        let ingUnidad = '';
                        let disponible = true;

                        if (typeof det.ingrediente === 'object' && det.ingrediente) {
                          const i = det.ingrediente as Ingrediente;
                          ingNombre = i.nombre;
                          ingUnidad = i.unidadMedida;
                          // Chequear estado en vivo desde mapa
                          const live = ingredientMap.get(i._id);
                          disponible = live ? live.disponible : i.disponible;
                        } else {
                          const found = ingredientMap.get(det.ingrediente as string);
                          if (found) {
                            ingNombre = found.nombre;
                            ingUnidad = found.unidadMedida;
                            disponible = found.disponible;
                          }
                        }

                        return (
                          <li
                            key={idx}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-700/50"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  disponible ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                                aria-hidden="true"
                              />
                              <span className="font-medium text-stone-800 dark:text-stone-200 truncate">
                                {ingNombre}
                              </span>
                              {!disponible && (
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 px-1 py-0.2 rounded">
                                  Agotado
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-stone-600 dark:text-stone-400 shrink-0 font-medium">
                              {det.cantidadNecesaria} {ingUnidad}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-end gap-2 pt-4 mt-2 border-t border-stone-100 dark:border-stone-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(receta)}
                    className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 text-xs"
                    title={`Editar receta de ${platoInfo.nombre}`}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    <span>Editar Proporciones</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDelete(receta)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 text-xs"
                    title={`Eliminar receta de ${platoInfo.nombre}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    <span>Eliminar</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modales */}
      <RecetaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        recetaToEdit={recetaToEdit}
        platos={platos}
        ingredientes={ingredientes}
      />

      <RecetaDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        receta={recetaToDelete}
      />
    </div>
  );
}

export default function RecetasPage() {
  return (
    <RoleGuard allowedRoles={['Administrador']}>
      <RecetasPageContent />
    </RoleGuard>
  );
}
