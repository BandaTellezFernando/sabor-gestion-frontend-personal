'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSocketStatus, useSocketEvent } from '@/hooks/use-socket';
import { dashboardService } from '@/services/dashboard.service';
import { ResumenDashboardDTO } from '@/types';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ApiError } from '@/lib/api-error';
import { ROL_LABELS } from '@/lib/constants';
import { SOCKET_EVENTS } from '@/lib/socket';
import {
  DollarSign,
  Receipt,
  Users,
  Grid,
  Percent,
  RefreshCw,
  Utensils,
  Radio,
} from 'lucide-react';

function DashboardAdminContent() {
  const { user } = useAuth();
  const { isConnected } = useSocketStatus();

  // Estados para Administrador (KPIs y métricas reales de negocio)
  const [resumen, setResumen] = useState<ResumenDashboardDTO | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const fetchAdminDashboard = useCallback(async () => {
    setIsLoadingDashboard(true);
    setDashboardError(null);
    try {
      const data = await dashboardService.getResumen();
      setResumen(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setDashboardError(err.getUserMessage());
      } else {
        setDashboardError('No se pudo conectar con el servidor para obtener los datos consolidados.');
      }
    } finally {
      setIsLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchAdminDashboard();
    });
  }, [fetchAdminDashboard]);

  // Actualización reactiva al ocurrir eventos clave en el restaurante
  const handleRefetchEvent = useCallback(() => {
    void fetchAdminDashboard();
  }, [fetchAdminDashboard]);

  useSocketEvent(SOCKET_EVENTS.CAJA_PAGO_CONFIRMADO, handleRefetchEvent);
  useSocketEvent(SOCKET_EVENTS.COCINA_NUEVO_PEDIDO, handleRefetchEvent);
  useSocketEvent(SOCKET_EVENTS.MESAS_UPDATED, handleRefetchEvent);

  if (!user) return null;

  // Fecha en formato boliviano legible
  const fechaHoy = new Date().toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formatEstadoPedidoBadge = (estado: string) => {
    const normal = estado.toUpperCase();
    switch (normal) {
      case 'ABIERTO':
        return <Badge variant="pedido-abierto" dot>Abierto</Badge>;
      case 'EN PREPARACIÓN':
      case 'EN_PREPARACION':
        return <Badge variant="pedido-en-preparacion" dot>En Preparación</Badge>;
      case 'ENTREGADO':
        return <Badge variant="pedido-entregado" dot>Entregado</Badge>;
      case 'CERRADO':
        return <Badge variant="pedido-cerrado" dot>Cerrado</Badge>;
      case 'CANCELADO':
        return <Badge variant="pedido-cancelado" dot>Cancelado</Badge>;
      default:
        return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal del Dashboard Gerencial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Panel Gerencial — Mishi-Food
            </h1>
            <Badge variant="admin" className="text-xs">
              {ROL_LABELS[user.rol]}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 capitalize">
            {fechaHoy}
          </p>
        </div>

        {/* Acciones y estado en vivo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-300">
            <Radio
              className={`w-3.5 h-3.5 ${
                isConnected ? 'text-emerald-500 animate-pulse' : 'text-zinc-400'
              }`}
            />
            <span className="font-medium">
              WebSockets: {isConnected ? 'Sincronizado' : 'Sin conexión'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAdminDashboard}
            isLoading={isLoadingDashboard}
            title="Refrescar métricas consolidadas"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingDashboard ? 'animate-spin' : ''}`} />}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Alerta de Error */}
      {dashboardError && (
        <Alert variant="warning" title="Aviso del Servidor Backend">
          {dashboardError}. Puedes intentar actualizar una vez el servicio esté en ejecución.
        </Alert>
      )}

      {/* Spinner de Carga Inicial */}
      {isLoadingDashboard && !resumen && (
        <div className="p-12 text-center">
          <Spinner size="lg" className="text-amber-600 mx-auto" />
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Cargando métricas consolidadas de la jornada...
          </p>
        </div>
      )}

      {resumen && (
        <>
          {/* Cuadrícula de StatCards con valores absolutos reales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              icon={DollarSign}
              label="Ventas de la Jornada"
              value={`Bs. ${Number(resumen.kpis.ventasHoy).toFixed(2)}`}
              description="Facturación total acumulada hoy"
              iconColor="text-emerald-600 dark:text-emerald-400"
              iconBgColor="bg-emerald-50 dark:bg-emerald-950/40"
            />

            <StatCard
              icon={Receipt}
              label="Comandas del Día"
              value={resumen.kpis.ordenesHoy}
              description="Órdenes procesadas en salón"
              iconColor="text-sky-600 dark:text-sky-400"
              iconBgColor="bg-sky-50 dark:bg-sky-950/40"
            />

            <StatCard
              icon={Users}
              label="Clientes Estimados"
              value={resumen.kpis.clientesEstimados}
              description="Afluencia estimada en servicio"
              iconColor="text-purple-600 dark:text-purple-400"
              iconBgColor="bg-purple-50 dark:bg-purple-950/40"
            />

            <StatCard
              icon={Grid}
              label="Mesas Activas"
              value={resumen.kpis.mesasActivas}
              description="Mesas ocupadas o con cuenta"
              iconColor="text-amber-600 dark:text-amber-400"
              iconBgColor="bg-amber-50 dark:bg-amber-950/40"
            />

            <StatCard
              icon={Percent}
              label="Ocupación de Salón"
              value={`${resumen.kpis.ocupacionPorcentaje}%`}
              description="Capacidad operativa actual"
              iconColor="text-orange-600 dark:text-orange-400"
              iconBgColor="bg-orange-50 dark:bg-orange-950/40"
            />
          </div>

          {/* Tablas de Platos Más Vendidos y Órdenes Recientes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platos más vendidos */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Platos Más Vendidos</CardTitle>
                    <CardDescription>Demanda culinaria registrada durante la jornada</CardDescription>
                  </div>
                  <Utensils className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {resumen.platosMasVendidos.length === 0 ? (
                  <EmptyState
                    icon={Utensils}
                    title="Sin ventas registradas"
                    description="Aún no se han completado órdenes de platos en la jornada actual."
                    className="m-4"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>Plato</TableHead>
                        <TableHead className="text-right">Porciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resumen.platosMasVendidos.map((plato, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-center font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-medium">{plato.nombre}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {plato.cantidad}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Órdenes recientes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Órdenes Recientes</CardTitle>
                    <CardDescription>Últimas comandas procesadas en el restaurante</CardDescription>
                  </div>
                  <Receipt className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {resumen.ordenesRecientes.length === 0 ? (
                  <EmptyState
                    icon={Receipt}
                    title="No hay órdenes recientes"
                    description="Las nuevas comandas emitidas en salón aparecerán listadas aquí."
                    className="m-4"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Mesa</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resumen.ordenesRecientes.map((orden) => (
                        <TableRow key={orden.id}>
                          <TableCell className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {orden.id}
                          </TableCell>
                          <TableCell className="text-zinc-800 dark:text-zinc-200">{orden.mesa}</TableCell>
                          <TableCell className="text-xs text-zinc-500 font-mono">{orden.hora}</TableCell>
                          <TableCell>
                            {formatEstadoPedidoBadge(orden.estado)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                            Bs. {Number(orden.total).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RoleGuard allowedRoles={['Administrador']}>
      <DashboardAdminContent />
    </RoleGuard>
  );
}
