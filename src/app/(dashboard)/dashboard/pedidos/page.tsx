'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSocketStatus, useSocketEvent } from '@/hooks/use-socket';
import { pedidoService } from '@/services/pedido.service';
import { mesaService } from '@/services/mesa.service';
import { platoService } from '@/services/plato.service';
import {
  Pedido,
  Mesa,
  Plato,
  ActualizarPedidoDTO,
} from '@/types';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { PedidoCard } from '@/components/pedidos/pedido-card';
import { PedidoFormModal } from '@/components/pedidos/pedido-form-modal';
import { PedidoDetailModal } from '@/components/pedidos/pedido-detail-modal';
import { PedidoCancelModal } from '@/components/pedidos/pedido-cancel-modal';
import { RoleGuard } from '@/components/auth/role-guard';
import {
  Receipt,
  Radio,
  RefreshCw,
  Search,
  Filter,
  Clock,
  ChefHat,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';

interface NotificationState {
  type: 'success' | 'info';
  message: string;
}

/**
 * Obtiene el identificador primario del pedido (_id o fallback a id).
 */
function getPedidoId(pedido: unknown): string {
  if (!pedido || typeof pedido !== 'object') return '';
  const p = pedido as { _id?: unknown; id?: unknown };
  if (typeof p._id === 'string') return p._id;
  if (typeof p.id === 'string') return p.id;
  if (p._id && typeof p._id === 'object' && 'toString' in p._id) {
    return String(p._id);
  }
  return '';
}

/**
 * Obtiene el código del pedido (ej. PED-0021).
 */
function getPedidoCodigo(pedido: unknown): string {
  if (!pedido || typeof pedido !== 'object') return '';
  const p = pedido as { codigo?: unknown };
  return typeof p.codigo === 'string' ? p.codigo : '';
}

/**
 * Compara si dos referencias corresponden a la misma orden
 * usando _id como identificador principal y codigo como fallback seguro.
 */
function isSamePedido(a: unknown, b: unknown): boolean {
  if (!a || !b) return false;
  const idA = getPedidoId(a);
  const idB = getPedidoId(b);
  if (idA && idB && idA === idB) return true;

  const codA = getPedidoCodigo(a);
  const codB = getPedidoCodigo(b);
  if (codA && codB && codA === codB) return true;

  return false;
}

/**
 * Normaliza un pedido enriqueciendo campos como mesa si viene como ObjectId crudo.
 */
function normalizePedido(pedido: Pedido, mesasList: Mesa[] = []): Pedido {
  if (!pedido) return pedido;

  let mesaNormalizada = pedido.mesa;
  if (typeof pedido.mesa === 'string' && mesasList.length > 0) {
    const encontrada = mesasList.find(
      (m) => m._id === pedido.mesa || m.numero === pedido.mesa
    );
    if (encontrada) {
      mesaNormalizada = encontrada;
    }
  }

  return {
    ...pedido,
    mesa: mesaNormalizada,
  };
}

/**
 * Fusiona dos representaciones del mismo pedido priorizando los datos
 * más completos (ej. objetos poblados de mesa/usuario frente a ObjectIds crudos).
 */
function mergePedido(existing: Pedido, incoming: Pedido, mesasList: Mesa[] = []): Pedido {
  const normExisting = normalizePedido(existing, mesasList);
  const normIncoming = normalizePedido(incoming, mesasList);

  // Resolver la mejor representación de mesa (objeto poblado > string)
  let mejorMesa = normIncoming.mesa || normExisting.mesa;
  if (typeof normExisting.mesa === 'object' && normExisting.mesa !== null) {
    if (typeof normIncoming.mesa === 'string') {
      const existingId = (normExisting.mesa as Mesa)._id;
      if (existingId === normIncoming.mesa) {
        mejorMesa = normExisting.mesa;
      }
    }
  }

  // Resolver la mejor representación de usuario responsable
  let mejorUsuario = normIncoming.usuario || normExisting.usuario;
  if (typeof normExisting.usuario === 'object' && normExisting.usuario !== null) {
    if (typeof normIncoming.usuario === 'string') {
      const existingUserObj = normExisting.usuario as { _id?: string; id?: string };
      const existingUserId = existingUserObj._id || existingUserObj.id;
      if (existingUserId === normIncoming.usuario) {
        mejorUsuario = normExisting.usuario;
      }
    }
  }

  // Resolver detalles de platos (priorizar detalles más completos)
  const mejoresDetalles =
    normIncoming.detalles && normIncoming.detalles.length > 0
      ? normIncoming.detalles
      : normExisting.detalles;

  return {
    ...normExisting,
    ...normIncoming,
    mesa: mejorMesa,
    usuario: mejorUsuario,
    detalles: mejoresDetalles,
  };
}

/**
 * Realiza un upsert idempotente en la lista de pedidos:
 * - Si el pedido ya existe por _id (o fallback codigo), lo actualiza y mergea sin duplicarlo ni moverlo.
 * - Si no existe, lo inserta al principio de la lista.
 */
function upsertPedido(
  lista: Pedido[],
  incoming: Pedido,
  mesasList: Mesa[] = []
): Pedido[] {
  if (!incoming) return lista;

  const index = lista.findIndex((item) => isSamePedido(item, incoming));

  if (index >= 0) {
    const existing = lista[index];
    const merged = mergePedido(existing, incoming, mesasList);
    const updated = [...lista];
    updated[index] = merged;
    return updated;
  }

  const normalized = normalizePedido(incoming, mesasList);
  return [normalized, ...lista];
}

/**
 * Deduplica y normaliza una lista completa de pedidos.
 */
function dedupeAndNormalizeList(list: Pedido[], mesasList: Mesa[] = []): Pedido[] {
  const seenKeys = new Set<string>();
  const result: Pedido[] = [];

  for (const item of list) {
    if (!item) continue;
    const id = getPedidoId(item);
    const cod = getPedidoCodigo(item);

    const key = id || cod;
    if (key && seenKeys.has(key)) {
      const existingIdx = result.findIndex((r) => isSamePedido(r, item));
      if (existingIdx >= 0) {
        result[existingIdx] = mergePedido(result[existingIdx], item, mesasList);
      }
      continue;
    }

    if (id) seenKeys.add(id);
    if (cod) seenKeys.add(cod);
    result.push(normalizePedido(item, mesasList));
  }

  return result;
}

function PedidosPageContent() {
  const { user } = useAuth();
  const { isConnected } = useSocketStatus();
  const searchParams = useSearchParams();
  const focusId = searchParams.get('focus');
  const focusHandledRef = useRef<string | null>(null);

  // Estados de datos
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Filtros interactivos client-side
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEstado, setSelectedEstado] = useState<string>('Todos');
  const [soloHoy, setSoloHoy] = useState<boolean>(true);

  // Estados de modales
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [pedidoToEdit, setPedidoToEdit] = useState<Pedido | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedDetailPedido, setSelectedDetailPedido] = useState<Pedido | null>(null);

  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);
  const [pedidoToCancel, setPedidoToCancel] = useState<Pedido | null>(null);

  // Carga inicial y refresco de pedidos, mesas y catálogo
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pedidosList, mesasList, platosList] = await Promise.all([
        pedidoService.getPedidos({ hoy: soloHoy }),
        mesaService.getMesas().catch(() => []),
        platoService.getPlatos().catch(() => []),
      ]);
      setMesas(mesasList);
      setPlatos(platosList);
      setPedidos((prev) => {
        const dedupedIncoming = dedupeAndNormalizeList(pedidosList, mesasList);
        let merged = [...dedupedIncoming];
        for (const p of prev) {
          const alreadyExists = merged.some((m) => isSamePedido(m, p));
          if (!alreadyExists) {
            merged = upsertPedido(merged, p, mesasList);
          }
        }
        return dedupeAndNormalizeList(merged, mesasList);
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al conectar con el servidor para sincronizar las comandas.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [soloHoy]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
  }, [fetchData]);

  // Temporizador para limpiar notificaciones
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [notification]);

  // Soporte de query param ?focus=<pedidoId> para abrir automáticamente el modal de detalle
  useEffect(() => {
    if (!focusId || focusHandledRef.current === focusId) return;

    const encontrado = pedidos.find(
      (p) => p._id === focusId || p.codigo === focusId
    );

    if (encontrado) {
      queueMicrotask(() => {
        setSelectedDetailPedido(encontrado);
        setIsDetailOpen(true);
        focusHandledRef.current = focusId;
      });
    } else if (!isLoading) {
      pedidoService
        .getPedidos({ hoy: false })
        .then((list: Pedido[]) => {
          const p = list.find((item) => item._id === focusId || item.codigo === focusId);
          if (p) {
            setPedidos((prev) => upsertPedido(prev, p, mesas));
            setSelectedDetailPedido(p);
            setIsDetailOpen(true);
            focusHandledRef.current = focusId;
          }
        })
        .catch(() => {
          // Ignorar si no se pudo sincronizar
        });
    }
  }, [focusId, pedidos, isLoading, mesas]);

  // ─── Socket.IO: Integración en Tiempo Real ───────────────────────────

  // Evento A: cocina:nuevo_pedido (llega comanda nueva o reabierta)
  const handleNuevoPedidoSocket = useCallback((data: unknown) => {
    if (!data || typeof data !== 'object') return;
    const nuevo = data as Pedido;
    setPedidos((prev) => upsertPedido(prev, nuevo, mesas));
    setNotification({
      type: 'info',
      message: `Nueva comanda recibida: ${nuevo.codigo || 'PED-NUEVO'}`,
    });
  }, [mesas]);

  // Evento B: cocina:actualizar_tablero (cambio de estado o actualización de comanda)
  const handleActualizarTableroSocket = useCallback((data: unknown) => {
    if (!data || typeof data !== 'object') return;
    const actualizado = data as Pedido;
    setPedidos((prev) => upsertPedido(prev, actualizado, mesas));
    setSelectedDetailPedido((prev) => {
      if (prev && isSamePedido(prev, actualizado)) {
        return mergePedido(prev, actualizado, mesas);
      }
      return prev;
    });
  }, [mesas]);

  // Evento C: mesas:updated (actualizar estado físico de la mesa en salón)
  const handleMesaUpdatedSocket = useCallback((data: unknown) => {
    if (!data || typeof data !== 'object') return;
    const mesaData = data as { id?: string; _id?: string; status?: string; estado?: string };
    const mesaId = mesaData.id || mesaData._id;
    if (!mesaId) return;

    setMesas((prev) =>
      prev.map((m) => {
        if (m._id === mesaId) {
          const rawStatus = mesaData.status || mesaData.estado;
          const nuevoEstado =
            rawStatus === 'Disponible' || rawStatus === 'Libre'
              ? 'Libre'
              : rawStatus === 'Esperando pago' || rawStatus === 'Cuenta Solicitada'
              ? 'Cuenta Solicitada'
              : 'Ocupada';
          return { ...m, estado: nuevoEstado };
        }
        return m;
      })
    );
  }, []);

  // Evento D: mesas:alerta_listo (alerta hacia meseros cuando cocina marca ENTREGADO)
  const handleAlertaListoSocket = useCallback((data: unknown) => {
    if (!data || typeof data !== 'object') return;
    const info = data as { pedidoId?: string; mesaNombre?: string };
    setNotification({
      type: 'info',
      message: `🔔 ¡Pedido listo para servir en ${info.mesaNombre || 'la mesa'}!`,
    });
  }, []);

  // Evento E: cocina:pedido_recogido (comanda fue recogida físicamente de cocina)
  const handlePedidoRecogidoSocket = useCallback((data: unknown) => {
    if (!data || typeof data !== 'object') return;
    const info = data as { pedidoId?: string };
    const pId = info.pedidoId;
    if (!pId) return;
    setPedidos((prev) =>
      prev.map((p) => (p._id === pId ? { ...p, recogido: true } : p))
    );
    setSelectedDetailPedido((prev) =>
      prev && prev._id === pId ? { ...prev, recogido: true } : prev
    );
  }, []);

  useSocketEvent('cocina:nuevo_pedido', handleNuevoPedidoSocket);
  useSocketEvent('cocina:actualizar_tablero', handleActualizarTableroSocket);
  useSocketEvent('mesas:updated', handleMesaUpdatedSocket);
  useSocketEvent('mesas:alerta_listo', handleAlertaListoSocket);
  useSocketEvent('cocina:pedido_recogido', handlePedidoRecogidoSocket);

  // ─── Acciones Operativas ─────────────────────────────────────────────

  // Abrir modal de edición
  const handleOpenEdit = (pedido: Pedido) => {
    setPedidoToEdit(pedido);
    setIsEditOpen(true);
  };

  // Abrir modal de detalle
  const handleOpenDetail = (pedido: Pedido) => {
    setSelectedDetailPedido(pedido);
    setIsDetailOpen(true);
  };

  // Abrir modal de cancelación
  const handleOpenCancel = (pedido: Pedido) => {
    setPedidoToCancel(pedido);
    setIsCancelOpen(true);
  };

  // Guardar edición
  const handleSaveUpdate = async (id: string, data: ActualizarPedidoDTO) => {
    const updated = await pedidoService.actualizarPedido(id, data);
    setPedidos((prev) => upsertPedido(prev, updated, mesas));
    setNotification({
      type: 'success',
      message: `Comanda ${updated.codigo} actualizada exitosamente.`,
    });
  };

  // Cambiar estado de cocina (Cocinero / Admin)
  const handleCambiarEstadoCocina = async (
    pedido: Pedido,
    nuevoEstado: 'EN_PREPARACION' | 'ENTREGADO'
  ) => {
    try {
      const res = await pedidoService.actualizarEstado(pedido._id, nuevoEstado);
      const nuevoObj = res.pedido || { ...pedido, estado: nuevoEstado };
      setPedidos((prev) => upsertPedido(prev, nuevoObj, mesas));
      setNotification({
        type: 'success',
        message: `Comanda ${pedido.codigo} movida a ${nuevoEstado === 'EN_PREPARACION' ? 'En Preparación' : 'Entregado'}.`,
      });
    } catch (err: unknown) {
      setNotification({
        type: 'info',
        message: `No se pudo actualizar el estado: ${err instanceof Error ? err.message : 'Error del servidor'}`,
      });
      throw err;
    }
  };

  // Solicitar cuenta (Mesero / Admin)
  const handleSolicitarCuenta = async (pedido: Pedido) => {
    try {
      await pedidoService.solicitarCuenta(pedido._id);
      // Actualizar mesa asociada localmente
      if (pedido.mesa) {
        const mId = typeof pedido.mesa === 'object' ? pedido.mesa._id : pedido.mesa;
        setMesas((prev) =>
          prev.map((m) => (m._id === mId ? { ...m, estado: 'Cuenta Solicitada' } : m))
        );
      }
      setNotification({
        type: 'success',
        message: `Cuenta solicitada para la comanda ${pedido.codigo}. Notificación enviada a Caja.`,
      });
    } catch (err: unknown) {
      setNotification({
        type: 'info',
        message: `Error al pedir cuenta: ${err instanceof Error ? err.message : 'Error del servidor'}`,
      });
      throw err;
    }
  };

  // Cancelar pedido (Mesero / Admin)
  const handleConfirmCancel = async (pedido: Pedido) => {
    try {
      const res = await pedidoService.cancelarPedido(pedido._id);
      const canceladoObj = res.pedido || { ...pedido, estado: 'CANCELADO' };
      setPedidos((prev) => upsertPedido(prev, canceladoObj, mesas));
      // Liberar mesa asociada
      if (pedido.mesa) {
        const mId = typeof pedido.mesa === 'object' ? pedido.mesa._id : pedido.mesa;
        setMesas((prev) => prev.map((m) => (m._id === mId ? { ...m, estado: 'Libre' } : m)));
      }
      setNotification({
        type: 'success',
        message: `Comanda ${pedido.codigo} anulada y mesa liberada correctamente.`,
      });
    } catch (err: unknown) {
      setNotification({
        type: 'info',
        message: `Error al cancelar: ${err instanceof Error ? err.message : 'Error del servidor'}`,
      });
      throw err;
    }
  };

  // Recoger comanda físicamente de cocina (Mesero responsable o Administrador)
  const handleRecogerPedido = async (pedido: Pedido) => {
    try {
      const res = await pedidoService.marcarRecogido(pedido._id);
      const recogidoObj: Pedido = res.pedido || {
        ...pedido,
        recogido: true,
        fechaRecogida: new Date().toISOString(),
      };
      setPedidos((prev) => upsertPedido(prev, recogidoObj, mesas));
      setSelectedDetailPedido((prev) =>
        prev && prev._id === pedido._id ? { ...prev, ...recogidoObj } : prev
      );
      setNotification({
        type: 'success',
        message: `Comanda ${pedido.codigo} marcada como recogida de cocina.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al recoger el pedido';
      setNotification({
        type: 'info',
        message:
          msg.includes('403') || msg.toLowerCase().includes('responsable')
            ? 'Solo el mesero responsable o Administrador puede recoger este pedido.'
            : msg.includes('409') || msg.toLowerCase().includes('ya')
            ? 'El pedido ya fue marcado como recogido anteriormente.'
            : `No se pudo registrar la recogida: ${msg}`,
      });
      throw err;
    }
  };

  // Métricas consolidadas (KPIs)
  const stats = useMemo(() => {
    const total = pedidos.length;
    const abiertos = pedidos.filter((p) => p.estado === 'ABIERTO').length;
    const enPreparacion = pedidos.filter((p) => p.estado === 'EN_PREPARACION').length;
    const entregados = pedidos.filter((p) => p.estado === 'ENTREGADO').length;
    const cerrados = pedidos.filter((p) => p.estado === 'CERRADO').length;

    return { total, abiertos, enPreparacion, entregados, cerrados };
  }, [pedidos]);

  // Filtrado reactivo en memoria client-side
  const filteredPedidos = useMemo(() => {
    return pedidos.filter((p) => {
      const mesaNombre =
        typeof p.mesa === 'object' && p.mesa ? p.mesa.numero : String(p.mesa || '');
      const searchLower = searchTerm.toLowerCase();

      const matchSearch =
        p.codigo.toLowerCase().includes(searchLower) ||
        mesaNombre.toLowerCase().includes(searchLower) ||
        (p.clienteNombre || '').toLowerCase().includes(searchLower);

      const matchEstado =
        selectedEstado === 'Todos'
          ? true
          : selectedEstado === 'LISTO_PARA_RECOGER'
          ? p.estado === 'ENTREGADO' && !p.recogido
          : p.estado === selectedEstado;

      return matchSearch && matchEstado;
    });
  }, [pedidos, searchTerm, selectedEstado]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Gestión de Pedidos y Comandas
            </h1>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800'
              }`}
              title={isConnected ? 'Conexión WebSockets activa' : 'Sin conexión en tiempo real'}
            >
              <Radio
                className={`w-3 h-3 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-zinc-400'}`}
              />
              <span className="hidden sm:inline">{isConnected ? 'En Vivo' : 'Desconectado'}</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Supervisión y control en tiempo real de las órdenes de servicio en salón y cocina.
          </p>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="min-h-[38px] px-3 text-xs sm:text-sm font-medium"
            title="Refrescar listado de comandas"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Banner de Notificación */}
      {notification && (
        <Alert
          variant={notification.type === 'success' ? 'success' : 'info'}
          title={notification.type === 'success' ? 'Operación Exitosa' : 'Aviso de Comanda'}
        >
          {notification.message}
        </Alert>
      )}

      {/* Banner de Error */}
      {error && (
        <Alert variant="error" title="Error de Conexión">
          {error}. Por favor verifica el estado del servidor.
        </Alert>
      )}

      {/* Resumen Visual por Estado (KPIs de Comandas) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          icon={Receipt}
          label="Total Comandas"
          value={stats.total}
          description={soloHoy ? 'Registradas hoy' : 'Total acumulado'}
          iconColor="text-zinc-700 dark:text-zinc-300"
          iconBgColor="bg-zinc-100 dark:bg-zinc-800"
        />

        <StatCard
          icon={Clock}
          label="Abiertas"
          value={stats.abiertos}
          description="En toma o pendientes"
          iconColor="text-sky-700 dark:text-sky-400"
          iconBgColor="bg-sky-50 dark:bg-sky-950/50"
        />

        <StatCard
          icon={ChefHat}
          label="En Preparación"
          value={stats.enPreparacion}
          description="Cocinando actualmente"
          iconColor="text-amber-700 dark:text-amber-400"
          iconBgColor="bg-amber-50 dark:bg-amber-950/50"
        />

        <StatCard
          icon={CheckCircle2}
          label="Entregadas"
          value={stats.entregados}
          description="Listas / servidas en mesa"
          iconColor="text-emerald-700 dark:text-emerald-400"
          iconBgColor="bg-emerald-50 dark:bg-emerald-950/50"
        />

        <StatCard
          icon={ShoppingBag}
          label="Pedidos Cerrados"
          value={stats.cerrados}
          description="Servicio finalizado"
          iconColor="text-zinc-600 dark:text-zinc-400"
          iconBgColor="bg-zinc-100 dark:bg-zinc-800"
        />
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-3 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Búsqueda por texto */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por código PED-XXXX, mesa o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all min-h-[40px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filtro por Estado */}
            <div className="flex items-center gap-1.5 min-w-[160px]">
              <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <select
                id="filtro-estado"
                value={selectedEstado}
                onChange={(e) => setSelectedEstado(e.target.value)}
                className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[40px]"
              >
                <option value="Todos">Todos los Estados</option>
                <option value="LISTO_PARA_RECOGER">Listo para Recoger</option>
                <option value="ABIERTO">Abierto</option>
                <option value="EN_PREPARACION">En Preparación</option>
                <option value="ENTREGADO">Entregado</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="CERRADO">Cerrado</option>
              </select>
            </div>

            {/* Alternar Solo Hoy */}
            <Button
              variant={soloHoy ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSoloHoy((prev) => !prev)}
              className="min-h-[40px] px-3.5 text-xs font-semibold"
              title="Filtrar pedidos de la jornada actual"
            >
              {soloHoy ? 'Jornada de Hoy' : 'Histórico Completo'}
            </Button>

            {/* Limpiar filtros */}
            {(searchTerm || selectedEstado !== 'Todos' || !soloHoy) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedEstado('Todos');
                  setSoloHoy(true);
                }}
                className="min-h-[40px] px-3 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Listado de Pedidos en Grilla Adaptativa */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 animate-pulse">
            Sincronizando comandas activas del restaurante...
          </p>
        </div>
      ) : filteredPedidos.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={
            pedidos.length === 0
              ? 'No hay comandas registradas'
              : 'Ninguna comanda coincide con los filtros'
          }
          description={
            pedidos.length === 0
              ? 'Aún no se han registrado órdenes en el sistema para esta jornada. Las nuevas comandas se inician desde la gestión de Mesas.'
              : 'Intenta modificar el término de búsqueda o el filtro de estado.'
          }
          className="my-8"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPedidos.map((pedido) => (
            <PedidoCard
              key={pedido._id || pedido.codigo}
              pedido={pedido}
              mesas={mesas}
              userRole={user.rol}
              currentUserId={user?.id}
              onViewDetail={handleOpenDetail}
              onEdit={handleOpenEdit}
              onCancel={handleOpenCancel}
              onSolicitarCuenta={handleSolicitarCuenta}
              onCambiarEstadoCocina={handleCambiarEstadoCocina}
              onRecogerPedido={handleRecogerPedido}
            />
          ))}
        </div>
      )}

      {/* Modal de Edición de Comanda Existente */}
      <PedidoFormModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setPedidoToEdit(null);
        }}
        onSaveCreate={async () => {}}
        onSaveUpdate={handleSaveUpdate}
        pedidoToEdit={pedidoToEdit}
        mesas={mesas}
        platos={platos}
      />

      <PedidoDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        pedido={selectedDetailPedido}
        mesas={mesas}
        userRole={user.rol}
        currentUserId={user?.id}
        onEdit={(p) => {
          setIsDetailOpen(false);
          handleOpenEdit(p);
        }}
        onCancel={(p) => {
          setIsDetailOpen(false);
          handleOpenCancel(p);
        }}
        onSolicitarCuenta={handleSolicitarCuenta}
        onCambiarEstadoCocina={handleCambiarEstadoCocina}
        onRecogerPedido={handleRecogerPedido}
      />

      <PedidoCancelModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        pedido={pedidoToCancel}
        mesas={mesas}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  );
}

export default function PedidosPage() {
  return (
    <RoleGuard allowedRoles={['Administrador', 'Mesero']}>
      <Suspense
        fallback={
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Spinner size="lg" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 animate-pulse">
              Cargando comandas del restaurante...
            </p>
          </div>
        }
      >
        <PedidosPageContent />
      </Suspense>
    </RoleGuard>
  );
}
