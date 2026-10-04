'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { mesaService, normalizeMesa, MesaBackendRaw } from '@/services/mesa.service';
import { ubicacionService } from '@/services/ubicacion.service';
import { useSocketEvent, useSocketStatus } from '@/hooks/use-socket';
import { SOCKET_EVENTS } from '@/lib/socket';
import { Mesa, EstadoMesa, CrearMesaDTO, Ubicacion, Pedido, Plato, ActualizarPedidoDTO } from '@/types';
import { MesaCard } from '@/components/mesas/mesa-card';
import { MesaFormModal } from '@/components/mesas/mesa-form-modal';
import { MesaDeleteModal } from '@/components/mesas/mesa-delete-modal';
import { ComandaModal } from '@/components/mesas/comanda-modal';
import { PedidoDetailModal } from '@/components/pedidos/pedido-detail-modal';
import { PedidoFormModal } from '@/components/pedidos/pedido-form-modal';
import { PedidoCancelModal } from '@/components/pedidos/pedido-cancel-modal';
import { pedidoService } from '@/services/pedido.service';
import { platoService } from '@/services/plato.service';
import { ApiError } from '@/lib/api-error';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Grid,
  Users,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  UtensilsCrossed,
  Clock,
  Radio,
} from 'lucide-react';
import { RoleGuard } from '@/components/auth/role-guard';

function MesasPageContent() {
  const { user } = useAuth();
  const { isConnected } = useSocketStatus();

  // Estados principales de datos
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('Todas');
  const [selectedEstado, setSelectedEstado] = useState<string>('Todos');

  // Estados de Modales de Mesas (CRUD Admin)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [mesaToEdit, setMesaToEdit] = useState<Mesa | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [mesaToDelete, setMesaToDelete] = useState<Mesa | null>(null);

  // Estados para Ocupación Temporal y Apertura de Comanda
  const [comandaMesa, setComandaMesa] = useState<Mesa | null>(null);
  const [comandaExpiraEn, setComandaExpiraEn] = useState<string | Date | null>(null);
  const [isComandaOpen, setIsComandaOpen] = useState<boolean>(false);
  const [processingMesaId, setProcessingMesaId] = useState<string | null>(null);

  // Estados para visualización y edición de Pedido Activo en mesa (Caso D)
  const [activePedido, setActivePedido] = useState<Pedido | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [pedidoToEdit, setPedidoToEdit] = useState<Pedido | null>(null);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [pedidoToCancel, setPedidoToCancel] = useState<Pedido | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const solicitarCuentaLockRef = useRef<Record<string, boolean>>({});

  const canManage = user?.rol === 'Administrador';
  const isMesero = user?.rol === 'Mesero';

  // Cargar mesas y ubicaciones
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [mesasList, ubicacionesList] = await Promise.all([
        mesaService.getMesas(),
        ubicacionService.getUbicaciones().catch(() => []),
      ]);
      setMesas(mesasList);
      setUbicaciones(ubicacionesList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor para cargar las mesas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
  }, [fetchData]);

  // Temporizador para limpiar notificaciones visuales
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [notification]);

  // Manejadores en tiempo real con Socket.IO
  const handleMesaCreated = useCallback((data: unknown) => {
    if (!data || typeof data !== 'object') return;
    const nueva = normalizeMesa(data as MesaBackendRaw);
    setMesas((prev) => {
      if (prev.some((m) => m._id === nueva._id)) {
        return prev.map((m) => (m._id === nueva._id ? nueva : m));
      }
      return [...prev, nueva];
    });
    setNotification({
      type: 'info',
      message: `Nueva mesa agregada en tiempo real: ${nueva.numero}`,
    });
  }, []);

  const handleMesaUpdated = useCallback((data: unknown) => {
    if (!data || typeof data !== 'object') return;
    const actualizada = normalizeMesa(data as MesaBackendRaw);
    setMesas((prev) =>
      prev.map((m) => {
        if (m._id === actualizada._id) {
          return {
            ...m,
            ...actualizada,
            capacidad: actualizada.capacidad || m.capacidad,
            ubicacion: actualizada.ubicacion || m.ubicacion,
            ubicacionId: actualizada.ubicacionId || m.ubicacionId,
          };
        }
        return m;
      })
    );
  }, []);

  const handleMesaDeleted = useCallback((data: unknown) => {
    if (!data || typeof data !== 'object') return;
    const payload = data as Record<string, unknown>;
    const mesaObj = payload.mesa as Record<string, unknown> | undefined;
    const deletedId = String(payload._id || payload.id || mesaObj?._id || mesaObj?.id || '');
    if (!deletedId) return;
    setMesas((prev) => prev.filter((m) => m._id !== deletedId));
    setNotification({
      type: 'info',
      message: 'Una mesa ha sido eliminada del catálogo.',
    });
  }, []);

  const handlePagoCompletado = useCallback((data: unknown) => {
    if (!data || typeof data !== 'object') return;
    const payload = data as Record<string, unknown>;
    const mesaObj = payload.mesa as Record<string, unknown> | undefined;
    const mesaId = payload.mesaId || mesaObj?._id || mesaObj?.id;
    if (mesaId) {
      setMesas((prev) =>
        prev.map((m) => (m._id === String(mesaId) ? { ...m, estado: 'Libre' } : m))
      );
    }
  }, []);

  const handleAlertaListo = useCallback((data: unknown) => {
    if (isMesero && data && typeof data === 'object') {
      const payload = data as Record<string, unknown>;
      setNotification({
        type: 'info',
        message: `Cocina: ${String(payload.mensaje || 'Pedido listo para ser servido en salón')} (${String(payload.mesa || 'Mesa')})`,
      });
    }
  }, [isMesero]);

  // Suscripción a eventos Socket.IO
  useSocketEvent<unknown>(SOCKET_EVENTS.MESAS_CREATED, handleMesaCreated);
  useSocketEvent<unknown>(SOCKET_EVENTS.MESAS_UPDATED, handleMesaUpdated);
  useSocketEvent<unknown>(SOCKET_EVENTS.MESAS_DELETED, handleMesaDeleted);
  useSocketEvent<unknown>(SOCKET_EVENTS.MESAS_PAGO_COMPLETADO, handlePagoCompletado);
  useSocketEvent<unknown>(SOCKET_EVENTS.MESAS_ALERTA_LISTO, handleAlertaListo);

  // Acciones de Gestión de Mesa
  const handleOpenCreate = () => {
    setMesaToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (mesa: Mesa) => {
    setMesaToEdit(mesa);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (mesa: Mesa) => {
    setMesaToDelete(mesa);
    setIsDeleteOpen(true);
  };

  const handleSaveMesa = async (data: CrearMesaDTO) => {
    if (mesaToEdit) {
      const updated = await mesaService.actualizarMesa(mesaToEdit._id, data);
      setMesas((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      setNotification({
        type: 'success',
        message: `Mesa ${updated.numero} actualizada exitosamente.`,
      });
    } else {
      const created = await mesaService.crearMesa(data);
      setMesas((prev) => {
        if (prev.some((m) => m._id === created._id)) {
          return prev.map((m) => (m._id === created._id ? created : m));
        }
        return [...prev, created];
      });
      setNotification({
        type: 'success',
        message: `Mesa ${created.numero} creada exitosamente.`,
      });
    }
  };

  const handleDeleteMesa = async () => {
    if (!mesaToDelete) return;
    await mesaService.eliminarMesa(mesaToDelete._id);
    setMesas((prev) => prev.filter((m) => m._id !== mesaToDelete._id));
    setNotification({
      type: 'success',
      message: `Mesa ${mesaToDelete.numero} eliminada del sistema.`,
    });
  };

  const handleStateChange = async (mesa: Mesa, nuevoEstado: EstadoMesa) => {
    try {
      const updated = await mesaService.actualizarEstado(mesa._id, nuevoEstado);
      setMesas((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      setNotification({
        type: 'success',
        message: `Mesa ${updated.numero} marcada como ${
          nuevoEstado === 'Libre'
            ? 'Disponible'
            : nuevoEstado === 'Cuenta Solicitada'
            ? 'Esperando pago'
            : 'Ocupada'
        }.`,
      });
    } catch (err: unknown) {
      setNotification({
        type: 'info',
        message: `No se pudo cambiar el estado: ${err instanceof Error ? err.message : 'Error del servidor'}`,
      });
      throw err;
    }
  };

  // ─── Flujo de Ocupación Temporal y Apertura de Comanda ──────────────
  const handleSelectMesa = async (mesa: Mesa) => {
    if (!user) return;
    const canOperate = user.rol === 'Mesero' || user.rol === 'Administrador';
    if (!canOperate) return;

    setProcessingMesaId(mesa._id);
    setError(null);

    try {
      // ── CASO A: MESA LIBRE ──
      if (mesa.estado === 'Libre') {
        try {
          const res = await mesaService.ocuparTemporal(mesa._id);
          // Actualizar inmediatamente la mesa en el estado local a Ocupada
          setMesas((prev) =>
            prev.map((m) => (m._id === mesa._id ? { ...m, estado: 'Ocupada' } : m))
          );
          setComandaMesa(mesa);
          setComandaExpiraEn(res.ocupacion.expiraEn);
          setIsComandaOpen(true);
        } catch (err: unknown) {
          // ── CASO B: 409 CONFLICT ──
          if (err instanceof ApiError && err.statusCode === 409) {
            setNotification({
              type: 'info',
              message: 'La mesa acaba de ser ocupada por otro mesero.',
            });
            void fetchData();
            return;
          }
          throw err;
        }
        return;
      }

      // ── CASO C: MESA OCUPADA TEMPORALMENTE ──
      if (mesa.estado === 'Ocupada') {
        const ocupacionRes = await mesaService.consultarOcupacionTemporal(mesa._id);

        if (ocupacionRes.activa) {
          // Comprobar si el usuario actual es el propietario o Administrador
          const esDuenio =
            ocupacionRes.esPropietario === true ||
            (ocupacionRes.usuarioId && ocupacionRes.usuarioId === user.id) ||
            user.rol === 'Administrador';

          if (esDuenio) {
            // Permitir continuar comanda temporal y restaurar borrador
            setComandaMesa(mesa);
            setComandaExpiraEn(ocupacionRes.expiraEn || null);
            setIsComandaOpen(true);
            return;
          } else {
            // Ocupada por otro mesero
            setNotification({
              type: 'info',
              message: 'La mesa está siendo atendida temporalmente por otro mesero.',
            });
            return;
          }
        }
      }

      // ── CASO D: MESA OCUPADA CON PEDIDO REAL O CUENTA SOLICITADA ──
      // Si no hay ocupación temporal activa, buscar el pedido real en curso
      const pedidosActivos = await pedidoService.getPedidos({
        mesa: mesa._id,
        activo: true,
      });

      if (pedidosActivos.length > 0) {
        // Mostrar pedido activo (nunca abrir una segunda comanda)
        setActivePedido(pedidosActivos[0]);
        setIsDetailOpen(true);
        return;
      }

      // Si no existe ni ocupación ni pedido activo (expirada en servidor)
      setNotification({
        type: 'info',
        message: 'No hay comanda activa para esta mesa. Sincronizando estado...',
      });
      void fetchData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setNotification({
          type: 'info',
          message: err.getUserMessage(),
        });
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Error al procesar la selección de la mesa.'
        );
      }
    } finally {
      setProcessingMesaId(null);
    }
  };

  // Manejo de Comanda Exitosa (POST /api/pedidos 201)
  const handleComandaSuccess = (nuevoPedido: Pedido) => {
    setIsComandaOpen(false);
    const mesaObjetivo = comandaMesa;
    setComandaMesa(null);
    setComandaExpiraEn(null);

    if (mesaObjetivo) {
      setMesas((prev) =>
        prev.map((m) => (m._id === mesaObjetivo._id ? { ...m, estado: 'Ocupada' } : m))
      );
    }
    setNotification({
      type: 'success',
      message: `Comanda ${nuevoPedido.codigo} abierta exitosamente para ${mesaObjetivo?.numero || 'la mesa'}.`,
    });
  };

  // Manejo de Cancelación de Ocupación Temporal (DELETE 200)
  const handleMesaLiberada = (mesaId: string) => {
    setIsComandaOpen(false);
    setComandaMesa(null);
    setComandaExpiraEn(null);
    setMesas((prev) =>
      prev.map((m) => (m._id === mesaId ? { ...m, estado: 'Libre' } : m))
    );
    setNotification({
      type: 'info',
      message: 'Ocupación cancelada y mesa disponible en el salón.',
    });
  };

  // Manejo de Minimizar Comanda (cierra modal visualmente, conserva ocupación y borrador)
  const handleMinimizeComanda = () => {
    const mesaNum = comandaMesa?.numero;
    setIsComandaOpen(false);
    setComandaMesa(null);
    setComandaExpiraEn(null);
    setNotification({
      type: 'info',
      message: mesaNum
        ? `Comanda de Mesa ${mesaNum} minimizada. La ocupación temporal sigue activa y el borrador guardado.`
        : 'Comanda minimizada. La ocupación temporal sigue activa.',
    });
  };

  // Manejo de Expiración de 10 minutos
  const handleComandaExpired = () => {
    void fetchData();
  };

  // Cargar catálogo de platos cuando se abre edición de pedido activo
  useEffect(() => {
    if (isEditOpen && platos.length === 0) {
      platoService.getPlatos().then((res) => {
        setPlatos(res.filter((p) => p.disponible !== false));
      }).catch(() => {});
    }
  }, [isEditOpen, platos.length]);

  // Guardar edición de un pedido activo (Caso D)
  const handleSaveEditOrder = async (id: string, data: ActualizarPedidoDTO) => {
    const updated = await pedidoService.actualizarPedido(id, data);
    setActivePedido(updated);
    setIsEditOpen(false);
    setNotification({
      type: 'success',
      message: `Comanda ${updated.codigo} actualizada exitosamente.`,
    });
  };

  // Cancelar pedido activo y liberar mesa (Caso D)
  const handleConfirmCancelOrder = async (pedido: Pedido) => {
    await pedidoService.cancelarPedido(pedido._id);
    setIsCancelOpen(false);
    setActivePedido(null);
    const mesaId = typeof pedido.mesa === 'object' && pedido.mesa ? pedido.mesa._id : pedido.mesa;
    if (mesaId) {
      setMesas((prev) =>
        prev.map((m) => (m._id === mesaId ? { ...m, estado: 'Libre' } : m))
      );
    }
    setNotification({
      type: 'success',
      message: `Comanda ${pedido.codigo} anulada y mesa liberada correctamente.`,
    });
  };

  // Métricas consolidadas del salón
  const stats = useMemo(() => {
    const total = mesas.length;
    const libres = mesas.filter((m) => m.estado === 'Libre').length;
    const ocupadas = mesas.filter((m) => m.estado === 'Ocupada').length;
    const cuenta = mesas.filter((m) => m.estado === 'Cuenta Solicitada').length;
    const capacidadTotal = mesas.reduce((acc, m) => acc + (m.capacidad || 0), 0);

    return { total, libres, ocupadas, cuenta, capacidadTotal };
  }, [mesas]);

  // Lista única de ubicaciones presentes en las mesas cargadas
  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    ubicaciones.forEach((u) => set.add(u.nombre));
    mesas.forEach((m) => {
      if (m.ubicacion) set.add(m.ubicacion);
    });
    return Array.from(set).sort();
  }, [ubicaciones, mesas]);

  // Mesas filtradas por búsqueda, ubicación y estado
  const filteredMesas = useMemo(() => {
    return mesas.filter((m) => {
      const matchSearch = m.numero.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLocation =
        selectedLocation === 'Todas' ||
        m.ubicacion?.toLowerCase() === selectedLocation.toLowerCase();
      const matchEstado =
        selectedEstado === 'Todos' ||
        m.estado === selectedEstado;

      return matchSearch && matchLocation && matchEstado;
    });
  }, [mesas, searchTerm, selectedLocation, selectedEstado]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Gestión de Mesas y Salón
            </h1>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-stone-100 text-stone-500 border-stone-200 dark:bg-stone-800'
              }`}
              title={isConnected ? 'Conexión WebSockets activa' : 'Sin conexión en tiempo real'}
            >
              <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-stone-400'}`} />
              <span className="hidden sm:inline">{isConnected ? 'En Vivo' : 'Desconectado'}</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Supervisión operativa en tiempo real del estado de atención y capacidad física del salón.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            title="Refrescar lista de mesas"
          >
            Actualizar
          </Button>

          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Nueva Mesa
            </Button>
          )}
        </div>
      </div>

      {/* Notificación Flotante / Banner */}
      {notification && (
        <Alert
          variant={notification.type === 'success' ? 'success' : 'info'}
          title={notification.type === 'success' ? 'Operación Exitosa' : 'Aviso del Salón'}
        >
          {notification.message}
        </Alert>
      )}

      {error && (
        <Alert variant="error" title="Error de Conexión">
          {error}. Por favor verifica que el backend esté operativo.
        </Alert>
      )}

      {/* Resumen Visual por Estado (KPIs de Salón) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          icon={Grid}
          label="Total Mesas"
          value={stats.total}
          description="Mesas físicas registradas"
          iconColor="text-zinc-700 dark:text-zinc-300"
          iconBgColor="bg-zinc-100 dark:bg-zinc-800"
        />

        <StatCard
          icon={CheckCircle2}
          label="Disponibles"
          value={stats.libres}
          description="Listas para comensales"
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBgColor="bg-emerald-50 dark:bg-emerald-950/40"
        />

        <StatCard
          icon={UtensilsCrossed}
          label="Ocupadas"
          value={stats.ocupadas}
          description="Servicio activo en mesa"
          iconColor="text-amber-600 dark:text-amber-400"
          iconBgColor="bg-amber-50 dark:bg-amber-950/40"
        />

        <StatCard
          icon={Clock}
          label="Esperando Pago"
          value={stats.cuenta}
          description="Cuentas solicitadas a caja"
          iconColor="text-sky-600 dark:text-sky-400"
          iconBgColor="bg-sky-50 dark:bg-sky-950/40"
        />

        <StatCard
          icon={Users}
          label="Capacidad Total"
          value={`${stats.capacidadTotal} p.`}
          description="Aforo máximo del restaurante"
          iconColor="text-purple-600 dark:text-purple-400"
          iconBgColor="bg-purple-50 dark:bg-purple-950/40"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Búsqueda por número */}
        <div className="w-full md:w-72">
          <Input
            id="filtro-busqueda-mesa"
            name="search-mesa"
            placeholder="Buscar por número o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Filtros por ubicación y estado */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Ubicación */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Filter className="w-3.5 h-3.5" aria-hidden="true" />
            <label htmlFor="filtro-ubicacion" className="sr-only">Filtrar por ubicación</label>
            <select
              id="filtro-ubicacion"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="Todas">Todas las Zonas</option>
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Estado */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedEstado('Todos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedEstado === 'Todos'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Todos ({mesas.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedEstado('Libre')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedEstado === 'Libre'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400'
              }`}
            >
              Libres ({stats.libres})
            </button>
            <button
              type="button"
              onClick={() => setSelectedEstado('Ocupada')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedEstado === 'Ocupada'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-primary dark:hover:text-primary-light'
              }`}
            >
              Ocupadas ({stats.ocupadas})
            </button>
            <button
              type="button"
              onClick={() => setSelectedEstado('Cuenta Solicitada')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedEstado === 'Cuenta Solicitada'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400'
              }`}
            >
              Cuenta ({stats.cuenta})
            </button>
          </div>
        </div>
      </div>

      {/* Grid Principal de Mesas */}
      {isLoading && mesas.length === 0 ? (
        <div className="p-16 text-center">
          <Spinner size="lg" className="text-amber-600 mx-auto" />
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Sincronizando estado físico y operativo de las mesas...
          </p>
        </div>
      ) : filteredMesas.length === 0 ? (
        <EmptyState
          icon={Grid}
          title={
            mesas.length === 0
              ? 'No hay mesas registradas'
              : 'Ninguna mesa coincide con los filtros'
          }
          description={
            mesas.length === 0
              ? canManage
                ? 'Comienza configurando las mesas del salón gastronómico.'
                : 'Aún no se han configurado mesas en el sistema.'
              : 'Intenta modificar el término de búsqueda, zona o filtro de estado.'
          }
          action={
            canManage && mesas.length === 0 ? (
              <Button onClick={handleOpenCreate} variant="primary" size="sm">
                Crear Primera Mesa
              </Button>
            ) : undefined
          }
          className="my-8"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMesas.map((mesa) => (
            <MesaCard
              key={mesa._id}
              mesa={mesa}
              userRole={user.rol}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
              onStateChange={handleStateChange}
              onSelectMesa={handleSelectMesa}
              isProcessing={processingMesaId === mesa._id}
            />
          ))}
        </div>
      )}

      {/* Modal de Apertura de Comanda desde Mesa Física */}
      <ComandaModal
        isOpen={isComandaOpen}
        mesa={comandaMesa}
        expiraEn={comandaExpiraEn}
        onClose={() => {
          setIsComandaOpen(false);
          setComandaMesa(null);
          setComandaExpiraEn(null);
        }}
        onMinimize={handleMinimizeComanda}
        onSuccess={handleComandaSuccess}
        onMesaLiberada={handleMesaLiberada}
        onExpired={handleComandaExpired}
      />

      {/* Modales para Ver y Operar Pedido Activo de la Mesa (Caso D) */}
      <PedidoDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setActivePedido(null);
        }}
        pedido={activePedido}
        mesas={mesas}
        userRole={user.rol}
        onEdit={(p) => {
          setIsDetailOpen(false);
          setPedidoToEdit(p);
          setIsEditOpen(true);
        }}
        onCancel={(p) => {
          setIsDetailOpen(false);
          setPedidoToCancel(p);
          setIsCancelOpen(true);
        }}
        onSolicitarCuenta={async (p) => {
          if (!p._id || solicitarCuentaLockRef.current[p._id]) return;
          solicitarCuentaLockRef.current[p._id] = true;
          try {
            await pedidoService.solicitarCuenta(p._id);
            setIsDetailOpen(false);
            setMesas((prev) =>
              prev.map((m) =>
                m._id === (typeof p.mesa === 'object' && p.mesa ? p.mesa._id : p.mesa)
                  ? { ...m, estado: 'Cuenta Solicitada' }
                  : m
              )
            );
            setNotification({
              type: 'success',
              message: `Cuenta solicitada para la comanda ${p.codigo}.`,
            });
          } catch (err: unknown) {
            setNotification({
              type: 'info',
              message: `Error al pedir cuenta: ${err instanceof Error ? err.message : 'Error del servidor'}`,
            });
            throw err;
          } finally {
            solicitarCuentaLockRef.current[p._id] = false;
          }
        }}
        onCambiarEstadoCocina={async (p, nuevoEstado) => {
          const res = await pedidoService.actualizarEstado(p._id, nuevoEstado);
          setActivePedido(res.pedido || { ...p, estado: nuevoEstado });
          setNotification({
            type: 'success',
            message: `Comanda ${p.codigo} actualizada a ${nuevoEstado}.`,
          });
        }}
      />

      <PedidoFormModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setPedidoToEdit(null);
        }}
        onSaveCreate={async () => {}}
        onSaveUpdate={handleSaveEditOrder}
        pedidoToEdit={pedidoToEdit}
        mesas={mesas}
        platos={platos}
      />

      <PedidoCancelModal
        isOpen={isCancelOpen}
        onClose={() => {
          setIsCancelOpen(false);
          setPedidoToCancel(null);
        }}
        pedido={pedidoToCancel}
        mesas={mesas}
        onConfirmCancel={handleConfirmCancelOrder}
      />

      {/* Modales de Gestión de Mesas (Solo Administrador) */}
      {canManage && (
        <>
          <MesaFormModal
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSave={handleSaveMesa}
            mesaToEdit={mesaToEdit}
            ubicaciones={ubicaciones}
          />

          <MesaDeleteModal
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleDeleteMesa}
            mesa={mesaToDelete}
          />
        </>
      )}
    </div>
  );
}

export default function MesasPage() {
  return (
    <RoleGuard allowedRoles={['Administrador', 'Mesero']}>
      <MesasPageContent />
    </RoleGuard>
  );
}
