//src/app/(dashboard)/dashboard/cocina/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSocketEvent, useSocketStatus } from '@/hooks/use-socket';
import { SOCKET_EVENTS } from '@/lib/socket';
import { pedidoService } from '@/services/pedido.service';
import { Pedido, CocinaPedidoRecogidoPayload } from '@/types';
import { CocinaCard } from '@/components/cocina/cocina-card';
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
  const { user } = useAuth();
  const { isConnected } = useSocketStatus();

  // Estados de pedidos y carga
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Carga inicial de pedidos activos desde el endpoint exclusivo de cocina
  const fetchPedidosCocina = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await pedidoService.getPedidosCocina();
      const filtrados = data.filter(
        (p) =>
          (
            p.estado === 'PENDIENTE' ||
            p.estado === 'ABIERTO' ||
            p.estado === 'EN_PREPARACION' ||
            p.estado === 'LISTO' ||
            p.estado === 'ENTREGADO'
          ) &&
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
  const handleNuevoPedido = useCallback((nuevo: Pedido) => {
    if (!nuevo || !nuevo._id) return;
    setPedidos((prev) => {
      const exists = prev.some((p) => p._id === nuevo._id || p.codigo === nuevo.codigo);
      if (exists) {
        return prev.map((p) =>
          p._id === nuevo._id || p.codigo === nuevo.codigo ? { ...p, ...nuevo } : p
        );
      }
      return [...prev, nuevo];
    });
  }, []);

  const handleActualizarTablero = useCallback((actualizado: Pedido) => {
    if (!actualizado || !actualizado._id) return;
    setPedidos((prev) => {
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

      return [...prev, actualizado];
    });
  }, []);

  const handlePedidoRecogido = useCallback((data: CocinaPedidoRecogidoPayload) => {
    if (!data || !data.pedidoId) return;
    setPedidos((prev) =>
      prev.filter((p) => p._id !== data.pedidoId && p.codigo !== data.pedidoId)
    );
  }, []);

  useSocketEvent<Pedido>(SOCKET_EVENTS.COCINA_NUEVO_PEDIDO, handleNuevoPedido);
  useSocketEvent<Pedido>(SOCKET_EVENTS.COCINA_ACTUALIZAR_TABLERO, handleActualizarTablero);
  useSocketEvent<CocinaPedidoRecogidoPayload>(SOCKET_EVENTS.COCINA_PEDIDO_RECOGIDO, handlePedidoRecogido);

  // Manejo del avance de estado en la comanda
  const handleAdvancePedido = useCallback(
    async (pedido: Pedido) => {
      if (processingIds.has(pedido._id)) return;

      const isPendiente = pedido.estado === 'PENDIENTE' || pedido.estado === 'ABIERTO';
      const isEnPreparacion = pedido.estado === 'EN_PREPARACION';

      if (!isPendiente && !isEnPreparacion) return;

      const proximoEstado = isPendiente ? 'EN_PREPARACION' : 'LISTO';

      setProcessingIds((prev) => new Set(prev).add(pedido._id));
      setError(null);

      try {
        const res = await pedidoService.actualizarEstado(pedido._id, proximoEstado);
        const actualizado = res.pedido || { ...pedido, estado: proximoEstado };
        setPedidos((prev) =>
          prev.map((p) => (p._id === actualizado._id ? actualizado : p))
        );
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setError(err.getUserMessage());
        } else {
          setError(`No se pudo avanzar la comanda ${pedido.codigo}. Reintenta.`);
        }
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(pedido._id);
          return next;
        });
      }
    },
    [processingIds]
  );

  // Filtrado de pedidos en las 3 columnas
  const pedidosAbiertos = useMemo(
    () => pedidos.filter((p) => p.estado === 'PENDIENTE' || p.estado === 'ABIERTO'),
    [pedidos]
  );

  const pedidosEnPreparacion = useMemo(
    () => pedidos.filter((p) => p.estado === 'EN_PREPARACION'),
    [pedidos]
  );

  const pedidosListos = useMemo(
    () => pedidos.filter((p) => (p.estado === 'LISTO' || p.estado === 'ENTREGADO') && p.recogido !== true),
    [pedidos]
  );

  return (
    <div className="space-y-4 sm:space-y-6 flex flex-col h-full">
      {/* Encabezado Principal de Cocina */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-900/30 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-sm bg-amber-950/60 text-amber-400 border border-amber-700/40">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif text-lg sm:text-xl font-semibold text-stone-100 tracking-wide">
                Pase de Cocina (KDS)
              </h1>
              <p className="text-xs text-stone-400 font-light">
                Gestión en tiempo real de partidas culinarias
              </p>
            </div>
          </div>
        </div>

        {/* Acciones y Estado de Conexión */}
        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs font-medium tracking-wide ${
              isConnected
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40'
                : 'bg-zinc-900 text-stone-400 border-stone-800'
            }`}
            title={isConnected ? 'Conectado a Socket.IO' : 'Sin conexión a Socket.IO'}
          >
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-stone-500'}`} />
            <span className="font-mono text-[11px]">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchPedidosCocina}
            isLoading={isLoading}
            className="min-h-[36px]"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            title="Refrescar comandas activas"
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Alerta de Error de API */}
      {error && (
        <Alert variant="error" title="Aviso de Cocina">
          {error}
        </Alert>
      )}

      {/* Tablero Kanban de 3 Columnas Fine Dining */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 flex-1 min-h-[600px] items-start">
        {/* COLUMNA 1: PENDIENTE */}
        <div className="flex flex-col rounded-sm border border-amber-900/30 bg-zinc-950/60 p-3 sm:p-4 min-h-[500px] shadow-sm">
          {/* Cabecera de Columna */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-amber-900/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-zinc-900 text-stone-300 border border-stone-800 flex items-center justify-center">
                <Inbox className="w-4 h-4 text-amber-500/70" />
              </div>
              <h2 className="font-serif font-medium text-sm sm:text-base text-stone-200 tracking-wide">
                PENDIENTE
              </h2>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-sm bg-zinc-900 text-stone-300 border border-stone-800">
              {pedidosAbiertos.length}
            </span>
          </div>

          {/* Lista de Tarjetas */}
          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[70vh] pr-1">
            {pedidosAbiertos.length === 0 ? (
              <div className="py-16 text-center text-stone-500">
                <Inbox className="w-7 h-7 mx-auto mb-2 opacity-40 text-amber-600" />
                <p className="font-serif text-xs font-medium text-stone-400">Sin comandas pendientes</p>
                <p className="text-[11px] font-light text-stone-500 mt-0.5">
                  Las nuevas órdenes de sala ingresarán aquí
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

        {/* COLUMNA 2: EN PREPARACIÓN */}
        <div className="flex flex-col rounded-sm border border-amber-600/40 bg-gradient-to-b from-amber-950/20 to-zinc-950/60 p-3 sm:p-4 min-h-[500px] shadow-[0_0_15px_rgba(217,119,6,0.08)]">
          {/* Cabecera de Columna */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-amber-900/40">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-amber-950/60 text-amber-300 border border-amber-700/40 flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
              <h2 className="font-serif font-medium text-sm sm:text-base text-amber-300 tracking-wide">
                EN PREPARACIÓN
              </h2>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-sm bg-amber-950 text-amber-300 border border-amber-700/40">
              {pedidosEnPreparacion.length}
            </span>
          </div>

          {/* Lista de Tarjetas */}
          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[70vh] pr-1">
            {pedidosEnPreparacion.length === 0 ? (
              <div className="py-16 text-center text-stone-500">
                <Flame className="w-7 h-7 mx-auto mb-2 opacity-40 text-amber-500" />
                <p className="font-serif text-xs font-medium text-stone-400">Sin órdenes en cocción</p>
                <p className="text-[11px] font-light text-stone-500 mt-0.5">
                  Toca una comanda en Pendiente para iniciarla
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

        {/* COLUMNA 3: LISTO */}
        <div className="flex flex-col rounded-sm border border-emerald-800/40 bg-zinc-950/60 p-3 sm:p-4 min-h-[500px] shadow-sm">
          {/* Cabecera de Columna */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-emerald-900/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="font-serif font-medium text-sm sm:text-base text-emerald-300 tracking-wide">
                LISTO PARA SALA
              </h2>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-sm bg-emerald-950 text-emerald-300 border border-emerald-800/40">
              {pedidosListos.length}
            </span>
          </div>

          {/* Lista de Tarjetas */}
          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[70vh] pr-1">
            {pedidosListos.length === 0 ? (
              <div className="py-16 text-center text-stone-500">
                <Sparkles className="w-7 h-7 mx-auto mb-2 opacity-40 text-emerald-500" />
                <p className="font-serif text-xs font-medium text-stone-400">Pase despejado</p>
                <p className="text-[11px] font-light text-stone-500 mt-0.5">
                  Los platos listos aguardan recogida de sala
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
