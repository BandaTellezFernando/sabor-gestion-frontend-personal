'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChefHat, Flame, Grid, Inbox, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSocketEvent, useSocketStatus } from '@/hooks/use-socket';
import { SOCKET_EVENTS } from '@/lib/socket';
import { pedidoService } from '@/services/pedido.service';
import { ingredienteService } from '@/services/ingrediente.service';
import { ApiError } from '@/lib/api-error';
import { formatHora, getMesaNombre } from '@/lib/dashboard-format';
import { ROL_LABELS } from '@/lib/constants';
import type { Ingrediente, Pedido } from '@/types';
import { DashboardWelcome } from './dashboard-welcome';
import { EstadoPedidoBadge } from './estado-pedido-badge';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

/**
 * Panel de producción del Cocinero. Resume la cola culinaria activa
 * (GET /api/pedidos/cocina) y la disponibilidad booleana de los insumos
 * (GET /api/inventario/ingredientes), ambos autorizados para el rol.
 */
export function DashboardCocinero() {
  const { user } = useAuth();
  const { isConnected } = useSocketStatus();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pedidosData, ingredientesData] = await Promise.all([
        pedidoService.getPedidosCocina(),
        ingredienteService.getIngredientes(),
      ]);
      setPedidos(pedidosData);
      setIngredientes(ingredientesData);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.getUserMessage());
      } else {
        setError('No se pudo sincronizar la producción culinaria con el servidor.');
      }
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchDashboard();
    });
  }, [fetchDashboard]);

  const handleRefetch = useCallback(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  useSocketEvent(SOCKET_EVENTS.COCINA_NUEVO_PEDIDO, handleRefetch);
  useSocketEvent(SOCKET_EVENTS.COCINA_ACTUALIZAR_TABLERO, handleRefetch);
  useSocketEvent(SOCKET_EVENTS.COCINA_PEDIDO_RECOGIDO, handleRefetch);
  useSocketEvent(SOCKET_EVENTS.INVENTARIO_ACTUALIZADO, handleRefetch);

  const resumen = useMemo(() => {
    const enEspera = pedidos.filter(
      (pedido) => pedido.estado === 'PENDIENTE' || pedido.estado === 'ABIERTO'
    );
    const enPreparacion = pedidos.filter((pedido) => pedido.estado === 'EN_PREPARACION');
    const listos = pedidos.filter(
      (pedido) =>
        (pedido.estado === 'LISTO' || pedido.estado === 'ENTREGADO') && pedido.recogido !== true
    );
    const noDisponibles = ingredientes.filter((ingrediente) => !ingrediente.disponible);

    return { enEspera, enPreparacion, listos, noDisponibles };
  }, [pedidos, ingredientes]);

  if (!user) return null;

  const comandasEnCurso = [...resumen.enEspera, ...resumen.enPreparacion, ...resumen.listos];

  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardWelcome
        icon={ChefHat}
        iconClassName="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
        title={`Partida de ${user.nombre}`}
        description="Cola de producción, comandas activas y disponibilidad de insumos."
        roleLabel={ROL_LABELS[user.rol]}
        roleBadge="cocinero"
        room="room:cocina"
        isConnected={isConnected}
        isRefreshing={isLoading}
        onRefresh={handleRefetch}
      />

      {error && (
        <Alert variant="warning" title="Aviso del servidor">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRefetch}>
              Reintentar
            </Button>
          </div>
        </Alert>
      )}

      {isLoading && !hasLoaded ? (
        <div className="py-20 text-center">
          <Spinner size="lg" className="text-amber-500 mx-auto" />
          <p className="mt-3 text-sm font-medium text-stone-500 dark:text-stone-400">
            Sincronizando comandas y disponibilidad de insumos...
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            <StatCard
              icon={Inbox}
              label="Por iniciar"
              value={resumen.enEspera.length}
              description="Comandas pendientes de preparación"
              iconColor="text-sky-700 dark:text-sky-300"
              iconBgColor="bg-sky-50 dark:bg-sky-950/40"
            />
            <StatCard
              icon={Flame}
              label="En preparación"
              value={resumen.enPreparacion.length}
              description="Órdenes en producción culinaria"
              iconColor="text-amber-700 dark:text-amber-300"
              iconBgColor="bg-amber-50 dark:bg-amber-950/40"
            />
            <StatCard
              icon={CheckCircle2}
              label="Listos por recoger"
              value={resumen.listos.length}
              description="Esperando al mesero en el pase"
              iconColor="text-emerald-700 dark:text-emerald-300"
              iconBgColor="bg-emerald-50 dark:bg-emerald-950/40"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <Card className="lg:col-span-2">
              <CardHeader className="bg-zinc-950/60 border-b border-amber-900/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-sm bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      <ChefHat className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm sm:text-base">Comandas en curso</CardTitle>
                      <CardDescription>Flujo activo de la partida</CardDescription>
                    </div>
                  </div>
                  <Badge variant="warning" className="font-mono">
                    {comandasEnCurso.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                {comandasEnCurso.length === 0 ? (
                  <EmptyState
                    icon={UtensilsCrossed}
                    title="Sin comandas en producción"
                    description="Las nuevas comandas del salón aparecerán aquí en tiempo real."
                    className="py-8"
                  />
                ) : (
                  <ul className="divide-y divide-stone-100 dark:divide-stone-800/80">
                    {comandasEnCurso.slice(0, 6).map((pedido) => (
                      <li key={pedido._id}>
                        <Link
                          href="/dashboard/cocina"
                          className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 rounded-sm px-2 transition-colors hover:bg-stone-50/70 dark:hover:bg-stone-800/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-sm bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 flex items-center justify-center font-mono text-xs font-extrabold text-stone-800 dark:text-stone-200 shrink-0">
                              {getMesaNombre(pedido.mesa).replace(/^Mesa /, '')}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100">
                                  {pedido.codigo}
                                </span>
                                <span className="text-stone-300 dark:text-stone-600" aria-hidden="true">
                                  ·
                                </span>
                                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                                  {getMesaNombre(pedido.mesa)}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                                {(pedido.detalles || []).reduce(
                                  (total, detalle) => total + detalle.cantidad,
                                  0
                                )}{' '}
                                {(pedido.detalles || []).length === 1 ? 'plato' : 'platos'}
                                <span className="mx-1.5" aria-hidden="true">
                                  ·
                                </span>
                                <span className="font-mono">{formatHora(pedido.fechaHora)}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <EstadoPedidoBadge estado={pedido.estado} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader className="bg-zinc-950/60 border-b border-amber-900/30">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm sm:text-base">Insumos sin disponibilidad</CardTitle>
                      <CardDescription>Indicador oficial del inventario</CardDescription>
                    </div>
                    <Badge variant={resumen.noDisponibles.length > 0 ? 'danger' : 'success'} className="font-mono">
                      {resumen.noDisponibles.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  {resumen.noDisponibles.length === 0 ? (
                    <p className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                      Todos los insumos están marcados como disponibles.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {resumen.noDisponibles.slice(0, 6).map((ingrediente) => (
                        <li
                          key={ingrediente._id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-sm bg-stone-50/70 dark:bg-zinc-950/70 border border-stone-200/70 dark:border-stone-800"
                        >
                          <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                            {ingrediente.nombre}
                          </span>
                          <Badge variant="danger" className="text-[10px] shrink-0">
                            No disponible
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 flex items-start gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                    <Grid className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                    Solo el Administrador puede modificar la disponibilidad desde Inventario.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="bg-zinc-950/60 border-b border-amber-900/30">
                  <CardTitle className="text-sm sm:text-base">Tablero de producción</CardTitle>
                  <CardDescription>Pantalla táctil de cocina (KDS)</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    Avanza comandas de pendiente a preparación y a listo desde el tablero completo.
                  </p>
                  <Link
                    href="/dashboard/cocina"
                    className="inline-flex w-full items-center justify-center gap-2 px-4 py-2 min-h-[40px] rounded-sm bg-amber-600 text-stone-950 text-sm font-semibold hover:bg-amber-500 active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                  >
                    <Flame className="w-4 h-4" aria-hidden="true" />
                    Abrir tablero
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
