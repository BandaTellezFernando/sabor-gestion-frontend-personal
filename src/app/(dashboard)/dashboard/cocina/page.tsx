'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSocketEvent, useSocketStatus } from '@/hooks/use-socket';
import { SOCKET_EVENTS } from '@/lib/socket';
import { pedidoService } from '@/services/pedido.service';
import { Pedido, CocinaPedidoRecogidoPayload } from '@/types';
import { CocinaCard } from '@/components/cocina/cocina-card';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-error';
import { RoleGuard } from '@/components/auth/role-guard';
import {
  ChefHat,
  Inbox,
  Flame,
  CheckCircle2,
  RefreshCw,
  Radio,
  Sparkles,
} from 'lucide-react';

function CocinaPageContent() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isConnected } = useSocketStatus();

  // Estados de pedidos y carga
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Carga inicial de pedidos activos desde el endpoint exclusivo de cocina (Cocinero, Administrador)
  const fetchPedidosCocina = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await pedidoService.getPedidosCocina();
      // Excluir cancelados, cerrados y ya recogidos
      const filtrados = data.filter(
        (p) =>
          (p.estado === 'ABIERTO' ||
            p.estado === 'EN_PREPARACION' ||
            p.estado === 'ENTREGADO') &&
          p.recogido !== true
      );
      setPedidos(filtrados);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.getUserMessage());
      } else {
        setError('Error al sincronizar las comandas de cocina con el servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && (user.rol === 'Cocinero' || user.rol === 'Administrador')) {
      queueMicrotask(() => {
        void fetchPedidosCocina();
      });
    }
  }, [user, fetchPedidosCocina]);

  // Sincronización en tiempo real vía Socket.IO
  // 1. cocina:nuevo_pedido -> Agregar a ABIERTO
  const handleNuevoPedido = useCallback((nuevo: Pedido) => {
    if (!nuevo || !nuevo._id) return;
    setPedidos((prev) => {
      // Deduplicación idempotente
      const exists = prev.some((p) => p._id === nuevo._id || p.codigo === nuevo.codigo);
      if (exists) {
        return prev.map((p) =>
          p._id === nuevo._id || p.codigo === nuevo.codigo ? { ...p, ...nuevo } : p
        );
      }
      return [...prev, nuevo];
    });
  }, []);

  // 2. cocina:actualizar_tablero -> Mover / actualizar pedido
  const handleActualizarTablero = useCallback((actualizado: Pedido) => {
    if (!actualizado || !actualizado._id) return;
    setPedidos((prev) => {
      // Si fue cancelado, cerrado o ya recogido, removerlo de la vista de cocina
      if (
        actualizado.estado === 'CANCELADO' ||
        actualizado.estado === 'CERRADO' ||
        actualizado.recogido === true
      ) {
        return prev.filter(
          (p) => p._id !== actualizado._id && p.codigo !== actualizado.codigo
        );
      }

      const index = prev.findIndex(
        (p) => p._id === actualizado._id || p.codigo === actualizado.codigo
      );
      if (index >= 0) {
        const copia = [...prev];
        copia[index] = { ...copia[index], ...actualizado };
        return copia;
      }

      // Si no existía y está activo, agregarlo
      return [...prev, actualizado];
    });
  }, []);

  // 3. cocina:pedido_recogido -> Retirar de LISTO inmediatamente
  const handlePedidoRecogido = useCallback((data: CocinaPedidoRecogidoPayload) => {
    if (!data || !data.pedidoId) return;
    setPedidos((prev) =>
      prev.filter((p) => p._id !== data.pedidoId && p.codigo !== data.pedidoId)
    );
  }, []);

  useSocketEvent<Pedido>(SOCKET_EVENTS.COCINA_NUEVO_PEDIDO, handleNuevoPedido);
  useSocketEvent<Pedido>(SOCKET_EVENTS.COCINA_ACTUALIZAR_TABLERO, handleActualizarTablero);
  useSocketEvent<CocinaPedidoRecogidoPayload>(SOCKET_EVENTS.COCINA_PEDIDO_RECOGIDO, handlePedidoRecogido);

  // Transición culinaria al tocar la tarjeta completa
  const handleAdvancePedido = async (pedido: Pedido) => {
    if (processingIds.has(pedido._id)) return;

    let siguienteEstado: 'EN_PREPARACION' | 'ENTREGADO' | null = null;
    if (pedido.estado === 'ABIERTO') {
      siguienteEstado = 'EN_PREPARACION';
    } else if (pedido.estado === 'EN_PREPARACION') {
      siguienteEstado = 'ENTREGADO';
    }

    if (!siguienteEstado) return;

    // Bloquear interacción en esta tarjeta mientras se procesa
    setProcessingIds((prev) => new Set(prev).add(pedido._id));
    setError(null);

    try {
      const res = await pedidoService.actualizarEstado(pedido._id, siguienteEstado);
      // Actualizar estado local inmediatamente con la respuesta confirmada del backend
      setPedidos((prev) =>
        prev.map((p) => (p._id === pedido._id ? { ...p, ...res.pedido } : p))
      );
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.getUserMessage());
      } else {
        setError('No se pudo actualizar el estado del pedido. Intenta nuevamente.');
      }
    } finally {
      setProcessingIds((prev) => {
        const copia = new Set(prev);
        copia.delete(pedido._id);
        return copia;
      });
    }
  };

  // Clasificación por columnas
  const pedidosAbiertos = useMemo(
    () => pedidos.filter((p) => p.estado === 'ABIERTO'),
    [pedidos]
  );
  const pedidosEnPreparacion = useMemo(
    () => pedidos.filter((p) => p.estado === 'EN_PREPARACION'),
    [pedidos]
  );
  const pedidosListos = useMemo(
    () => pedidos.filter((p) => p.estado === 'ENTREGADO' && p.recogido !== true),
    [pedidos]
  );

  if (isAuthLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" className="text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 flex flex-col h-full">
      {/* Encabezado Principal de Cocina */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                Estación de Cocina (KDS)
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Tablero táctil de producción culinaria en tiempo real
              </p>
            </div>
          </div>
        </div>

        {/* Acciones y Estado de Conexión */}
        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700'
            }`}
            title={isConnected ? 'Conectado a Socket.IO' : 'Sin conexión a Socket.IO'}
          >
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-stone-400'}`} />
            <span>{isConnected ? 'Sincronizado' : 'Sin conexión'}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchPedidosCocina}
            isLoading={isLoading}
            className="min-h-[38px] text-xs font-semibold rounded-xl"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            title="Refrescar comandas activas"
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Alerta de Error de API */}
      {error && (
        <Alert variant="error" title="Error en Cocina">
          {error}
        </Alert>
      )}

      {/* Tablero Kanban de 3 Columnas Táctiles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 flex-1 min-h-[600px] items-start">
        {/* ========================================================
            COLUMNA 1: ABIERTO (Pendiente de preparación)
           ======================================================== */}
        <div className="flex flex-col rounded-2xl border-2 border-sky-200 dark:border-sky-900/60 bg-sky-50/20 dark:bg-sky-950/10 p-3 sm:p-4 min-h-[500px]">
          {/* Cabecera de Columna */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-sky-100 dark:border-sky-900/40">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                <Inbox className="w-4 h-4" />
              </div>
              <h2 className="font-extrabold text-sm sm:text-base text-sky-950 dark:text-sky-100 tracking-tight">
                ABIERTO
              </h2>
            </div>
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-sky-200/80 dark:bg-sky-900/80 text-sky-900 dark:text-sky-200">
              {pedidosAbiertos.length}
            </span>
          </div>

          {/* Lista de Tarjetas */}
          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[70vh] pr-1">
            {pedidosAbiertos.length === 0 ? (
              <div className="py-16 text-center text-zinc-400 dark:text-zinc-500">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">Sin comandas pendientes</p>
                <p className="text-[11px] opacity-75 mt-0.5">
                  Los nuevos pedidos de salón entrarán aquí
                </p>
              </div>
            ) : (
              pedidosAbiertos.map((pedido) => (
                <CocinaCard
                  key={pedido._id}
                  pedido={pedido}
                  onAdvance={handleAdvancePedido}
                  isLoading={processingIds.has(pedido._id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ========================================================
            COLUMNA 2: EN PREPARACION (En producción culinaria)
           ======================================================== */}
        <div className="flex flex-col rounded-2xl border-2 border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 p-3 sm:p-4 min-h-[500px]">
          {/* Cabecera de Columna */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-amber-100 dark:border-amber-900/40">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-600 animate-pulse" />
              </div>
              <h2 className="font-extrabold text-sm sm:text-base text-amber-950 dark:text-amber-100 tracking-tight">
                EN PREPARACION
              </h2>
            </div>
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
              {pedidosEnPreparacion.length}
            </span>
          </div>

          {/* Lista de Tarjetas */}
          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[70vh] pr-1">
            {pedidosEnPreparacion.length === 0 ? (
              <div className="py-16 text-center text-zinc-400 dark:text-zinc-500">
                <Flame className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">Sin órdenes en cocción</p>
                <p className="text-[11px] opacity-75 mt-0.5">
                  Toca una comanda en Abierto para empezarla
                </p>
              </div>
            ) : (
              pedidosEnPreparacion.map((pedido) => (
                <CocinaCard
                  key={pedido._id}
                  pedido={pedido}
                  onAdvance={handleAdvancePedido}
                  isLoading={processingIds.has(pedido._id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ========================================================
            COLUMNA 3: LISTO (Terminado, esperando recogida del mesero)
           ======================================================== */}
        <div className="flex flex-col rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10 p-3 sm:p-4 min-h-[500px]">
          {/* Cabecera de Columna */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-emerald-100 dark:border-emerald-900/40">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="font-extrabold text-sm sm:text-base text-emerald-950 dark:text-emerald-100 tracking-tight">
                LISTO
              </h2>
            </div>
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200">
              {pedidosListos.length}
            </span>
          </div>

          {/* Lista de Tarjetas (Inertes para cocina, esperan recogida) */}
          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[70vh] pr-1">
            {pedidosListos.length === 0 ? (
              <div className="py-16 text-center text-zinc-400 dark:text-zinc-500">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
                <p className="text-xs font-semibold">Pase de cocina despejado</p>
                <p className="text-[11px] opacity-75 mt-0.5">
                  Los platos listos aparecerán aquí para retiro
                </p>
              </div>
            ) : (
              pedidosListos.map((pedido) => (
                <CocinaCard
                  key={pedido._id}
                  pedido={pedido}
                  isLoading={processingIds.has(pedido._id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CocinaPage() {
  return (
    <RoleGuard allowedRoles={['Administrador', 'Cocinero']}>
      <CocinaPageContent />
    </RoleGuard>
  );
}
