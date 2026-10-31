'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Grid, Receipt, Users, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSocketEvent, useSocketStatus } from '@/hooks/use-socket';
import { SOCKET_EVENTS } from '@/lib/socket';
import { mesaService } from '@/services/mesa.service';
import { pedidoService } from '@/services/pedido.service';
import { ApiError } from '@/lib/api-error';
import { formatHora, getMesaNombre } from '@/lib/dashboard-format';
import { ROL_LABELS } from '@/lib/constants';
import type { Mesa, Pedido } from '@/types';
import { DashboardWelcome } from './dashboard-welcome';
import { EstadoPedidoBadge } from './estado-pedido-badge';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

const ACCIONES = [
  {
    href: '/dashboard/mesas',
    icon: Grid,
    title: 'Explorar mesas',
    description: 'Estado del salón, ocupación y solicitudes de cuenta.',
  },
  {
    href: '/dashboard/pedidos',
    icon: Receipt,
    title: 'Abrir comandas',
    description: 'Toma de pedidos, seguimiento y solicitud de cuenta.',
  },
];

/**
 * Panel operativo del Mesero. Consume exclusivamente sus propias comandas
 * (GET /api/pedidos está acotado por rol en el backend) y el estado del salón.
 */
export function DashboardMesero() {
  const { user } = useAuth();
  const { isConnected } = useSocketStatus();

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [mesasData, pedidosData] = await Promise.all([
        mesaService.getMesas(),
        pedidoService.getPedidos({ hoy: true }),
      ]);
      setMesas(mesasData);
      setPedidos(pedidosData);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.getUserMessage());
      } else {
        setError('No se pudo sincronizar el estado del salón con el servidor.');
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

  useSocketEvent(SOCKET_EVENTS.MESAS_UPDATED, handleRefetch);
  useSocketEvent(SOCKET_EVENTS.MESAS_ALERTA_LISTO, handleRefetch);
  useSocketEvent(SOCKET_EVENTS.MESAS_PAGO_COMPLETADO, handleRefetch);
  useSocketEvent(SOCKET_EVENTS.COCINA_ACTUALIZAR_TABLERO, handleRefetch);

  const resumen = useMemo(() => {
    const mesasLibres = mesas.filter((mesa) => mesa.estado === 'Libre');
    const mesasOcupadas = mesas.filter((mesa) => mesa.estado === 'Ocupada');
    const mesasPorCobrar = mesas.filter((mesa) => mesa.estado === 'Cuenta Solicitada');
    const comandasActivas = pedidos.filter(
      (pedido) =>
        pedido.estado === 'ABIERTO' ||
        pedido.estado === 'PENDIENTE' ||
        pedido.estado === 'EN_PREPARACION'
    );
    const listos = pedidos.filter(
      (pedido) =>
        (pedido.estado === 'LISTO' || pedido.estado === 'ENTREGADO') && pedido.recogido !== true
    );

    return { mesasLibres, mesasOcupadas, mesasPorCobrar, comandasActivas, listos };
  }, [mesas, pedidos]);

  if (!user) return null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardWelcome
        icon={UtensilsCrossed}
        iconClassName="bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20"
        title={`Hola, ${user.nombre}`}
        description="Tu turno de salón, comandas activas y pedidos listos para servir."
        roleLabel={ROL_LABELS[user.rol]}
        roleBadge="mesero"
        room="room:meseros"
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
            Consultando el salón y tus comandas...
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <StatCard
              icon={Grid}
              label="Mesas libres"
              value={resumen.mesasLibres.length}
              description="Listas para recibir comensales"
              iconColor="text-emerald-700 dark:text-emerald-300"
              iconBgColor="bg-emerald-50 dark:bg-emerald-950/40"
            />
            <StatCard
              icon={Users}
              label="Mesas ocupadas"
              value={resumen.mesasOcupadas.length}
              description="Con servicio en curso"
              iconColor="text-amber-700 dark:text-amber-300"
              iconBgColor="bg-amber-50 dark:bg-amber-950/40"
            />
            <StatCard
              icon={Receipt}
              label="Cuentas solicitadas"
              value={resumen.mesasPorCobrar.length}
              description="Mesas esperando el cobro en caja"
              iconColor="text-sky-700 dark:text-sky-300"
              iconBgColor="bg-sky-50 dark:bg-sky-950/40"
            />
            <StatCard
              icon={UtensilsCrossed}
              label="Comandas activas"
              value={resumen.comandasActivas.length}
              description="Abiertas o en preparación"
              iconColor="text-amber-500"
              iconBgColor="bg-amber-950/40 border border-amber-800/30"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <Card className="lg:col-span-2">
              <CardHeader className="bg-zinc-950/60 border-b border-amber-900/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm sm:text-base">Listos para servir</CardTitle>
                      <CardDescription>Comandas que cocina ya despachó</CardDescription>
                    </div>
                  </div>
                  <Badge variant="success" className="font-mono">
                    {resumen.listos.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                {resumen.listos.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="Sin pedidos pendientes de retiro"
                    description="Cuando cocina marque una comanda como lista, aparecerá aquí."
                    className="py-8"
                  />
                ) : (
                  <ul className="divide-y divide-stone-100 dark:divide-stone-800/80">
                    {resumen.listos.map((pedido) => (
                      <li key={pedido._id}>
                        <Link
                          href={`/dashboard/pedidos?focus=${pedido._id}`}
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
                            <ArrowRight className="w-4 h-4 text-stone-400" aria-hidden="true" />
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
                  <CardTitle className="text-sm sm:text-base">Accesos operativos</CardTitle>
                  <CardDescription>Atajos a tu flujo de trabajo</CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 space-y-2">
                  {ACCIONES.map((accion) => {
                    const Icon = accion.icon;
                    return (
                    <Link
                      key={accion.href}
                      href={accion.href}
                      className="flex items-start gap-3 p-3 rounded-sm border border-stone-200/80 dark:border-stone-800 hover:border-amber-500/40 hover:bg-amber-600/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <div className="p-2 rounded-sm bg-amber-600/10 text-amber-500 shrink-0">
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {accion.title}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                          {accion.description}
                        </p>
                      </div>
                    </Link>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="bg-zinc-950/60 border-b border-amber-900/30">
                  <CardTitle className="text-sm sm:text-base">Mesas esperando el pago</CardTitle>
                  <CardDescription>Cuenta solicitada al mesero</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  {resumen.mesasPorCobrar.length === 0 ? (
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Ninguna mesa pidió la cuenta todavía.
                    </p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {resumen.mesasPorCobrar.map((mesa) => (
                        <li key={mesa._id}>
                          <Badge variant="mesa-cuenta-solicitada" dot className="font-mono">
                            {getMesaNombre(mesa)}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
