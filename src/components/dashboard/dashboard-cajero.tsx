'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Receipt,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSocketEvent, useSocketStatus } from '@/hooks/use-socket';
import { SOCKET_EVENTS } from '@/lib/socket';
import { cuentaMesaService } from '@/services/cuenta-mesa.service';
import { ApiError } from '@/lib/api-error';
import { formatBs, formatHora, getMesaNombre } from '@/lib/dashboard-format';
import { ROL_LABELS } from '@/lib/constants';
import type { CuentaMesaDTO } from '@/types';
import { DashboardWelcome } from './dashboard-welcome';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

interface PagoConfirmadoPayload {
  cuentaId?: string;
  codigoCuenta?: string;
  metodoPago?: string;
  totalPagado?: number;
  mensaje?: string;
  fecha?: string;
}

const METODOS_PAGO = [
  { label: 'Efectivo', icon: DollarSign },
  { label: 'Tarjeta', icon: CreditCard },
  { label: 'QR', icon: Receipt },
];

/**
 * Panel del turno de Caja. Se alimenta de las cuentas agrupadas pendientes
 * (GET /api/cuentas-mesa) y de los eventos de la sala room:caja.
 */
export function DashboardCajero() {
  const { user } = useAuth();
  const { isConnected } = useSocketStatus();

  const [cuentas, setCuentas] = useState<CuentaMesaDTO[]>([]);
  const [ultimoPago, setUltimoPago] = useState<PagoConfirmadoPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCuentas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await cuentaMesaService.listarPendientes();
      setCuentas(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.getUserMessage());
      } else {
        setError('No se pudieron consultar las cuentas pendientes de cobro.');
      }
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchCuentas();
    });
  }, [fetchCuentas]);

  const handleRefetch = useCallback(() => {
    void fetchCuentas();
  }, [fetchCuentas]);

  useSocketEvent(SOCKET_EVENTS.CAJA_NUEVA_CUENTA, handleRefetch);
  useSocketEvent(SOCKET_EVENTS.CAJA_SOLICITUD_PAGO, handleRefetch);
  useSocketEvent(SOCKET_EVENTS.MESAS_UPDATED, handleRefetch);
  useSocketEvent<PagoConfirmadoPayload>(SOCKET_EVENTS.CAJA_PAGO_CONFIRMADO, (pago) => {
    setUltimoPago(pago ?? null);
    void fetchCuentas();
  });

  const resumen = useMemo(() => {
    const totalPorCobrar = cuentas.reduce((total, cuenta) => total + Number(cuenta.total || 0), 0);
    const propinas = cuentas.reduce(
      (total, cuenta) => total + Number(cuenta.montoPropina || 0),
      0
    );
    return { totalPorCobrar, propinas };
  }, [cuentas]);

  if (!user) return null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardWelcome
        icon={CreditCard}
        iconClassName="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
        title={`Turno de caja — ${user.nombre}`}
        description="Cuentas agrupadas por mesa, cobros pendientes y confirmaciones en vivo."
        roleLabel={ROL_LABELS[user.rol]}
        roleBadge="cajero"
        room="room:caja"
        isConnected={isConnected}
        isRefreshing={isLoading}
        onRefresh={handleRefetch}
      />

      {ultimoPago && (
        <Alert variant="success" title="Pago confirmado">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              {ultimoPago.codigoCuenta ? `Cuenta ${ultimoPago.codigoCuenta}` : 'Cuenta cobrada'}
              {ultimoPago.metodoPago ? ` · ${ultimoPago.metodoPago}` : ''}
              {ultimoPago.totalPagado !== undefined
                ? ` · ${formatBs(ultimoPago.totalPagado)}`
                : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUltimoPago(null)}
              className="self-start sm:self-auto"
            >
              Ocultar
            </Button>
          </div>
        </Alert>
      )}

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
            Consultando las cuentas pendientes de cobro...
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            <StatCard
              icon={Receipt}
              label="Cuentas por cobrar"
              value={cuentas.length}
              description="Mesas esperando el pago"
              iconColor="text-amber-700 dark:text-amber-300"
              iconBgColor="bg-amber-50 dark:bg-amber-950/40"
            />
            <StatCard
              icon={DollarSign}
              label="Total por cobrar"
              value={formatBs(resumen.totalPorCobrar)}
              description="Subtotal más propina de las cuentas"
              iconColor="text-emerald-700 dark:text-emerald-300"
              iconBgColor="bg-emerald-50 dark:bg-emerald-950/40"
            />
            <StatCard
              icon={Clock}
              label="Propinas incluidas"
              value={formatBs(resumen.propinas)}
              description="Acumulado de las cuentas pendientes"
              iconColor="text-amber-500"
              iconBgColor="bg-amber-950/40 border border-amber-800/30"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <Card className="lg:col-span-2">
              <CardHeader className="bg-zinc-950/60 border-b border-amber-900/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-sm bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm sm:text-base">Cuentas esperando cobro</CardTitle>
                      <CardDescription>Agrupadas por mesa, listas para facturar</CardDescription>
                    </div>
                  </div>
                  <Badge variant="warning" className="font-mono">
                    {cuentas.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                {cuentas.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="Caja al día"
                    description="Cuando un mesero solicite la cuenta, la mesa aparecerá aquí."
                    className="py-8"
                  />
                ) : (
                  <ul className="divide-y divide-stone-100 dark:divide-stone-800/80">
                    {cuentas.slice(0, 6).map((cuenta) => (
                      <li key={cuenta._id}>
                        <Link
                          href="/dashboard/caja"
                          className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 rounded-sm px-2 transition-colors hover:bg-stone-50/70 dark:hover:bg-stone-800/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                {getMesaNombre(cuenta.mesa)}
                              </span>
                              <span className="text-stone-300 dark:text-stone-600" aria-hidden="true">
                                ·
                              </span>
                              <span className="font-mono text-xs text-stone-500 dark:text-stone-400">
                                {cuenta.codigoCuenta}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                              Solicitada a las{' '}
                              <span className="font-mono">{formatHora(cuenta.fechaSolicitud)}</span>
                              <span className="mx-1.5" aria-hidden="true">
                                ·
                              </span>
                              {cuenta.pedidos?.length ?? 0}{' '}
                              {cuenta.pedidos?.length === 1 ? 'comanda' : 'comandas'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-mono text-sm font-extrabold text-stone-900 dark:text-stone-50">
                              {formatBs(cuenta.total)}
                            </span>
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
                  <CardTitle className="text-sm sm:text-base">Cobro inmediato</CardTitle>
                  <CardDescription>Estación de caja y facturación</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    Abre la estación de caja para registrar el pago de una cuenta completa y emitir
                    su comprobante.
                  </p>
                  <Link
                    href="/dashboard/caja"
                    className="inline-flex w-full items-center justify-center gap-2 px-4 py-2 min-h-[40px] rounded-sm bg-amber-600 text-stone-950 text-sm font-semibold hover:bg-amber-500 active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                  >
                    <CreditCard className="w-4 h-4" aria-hidden="true" />
                    Ir a caja
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="bg-zinc-950/60 border-b border-amber-900/30">
                  <CardTitle className="text-sm sm:text-base">Métodos permitidos</CardTitle>
                  <CardDescription>Los tres únicos métodos del sistema</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  <ul className="flex flex-wrap gap-2">
                    {METODOS_PAGO.map((metodo) => {
                      const Icon = metodo.icon;
                      return (
                        <li key={metodo.label}>
                          <Badge variant="neutral" className="gap-1.5 py-1">
                            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                            {metodo.label}
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 flex items-start gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    Los pagos QR de esta versión son simulados y no constituyen confirmación bancaria
                    real.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
