'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useSocketStatus, useSocketEvent } from '@/hooks/use-socket';
import { dashboardService } from '@/services/dashboard.service';
import { ResumenDashboardDTO } from '@/types';
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
  ChefHat,
  CreditCard,
  Radio,
  CheckCircle,
  BellRing,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';

interface AlertaCocina {
  id: string;
  pedidoId?: string;
  mesa?: string;
  mensaje?: string;
  hora: string;
}

interface PagoConfirmado {
  id: string;
  pagoId?: string;
  total?: number;
  metodo?: string;
  hora: string;
}

interface ComandaNueva {
  id: string;
  pedidoId?: string;
  mesa?: string;
  hora: string;
}

interface SocketAlertaCocinaPayload {
  pedidoId?: string;
  id?: string;
  mesa?: string;
  mensaje?: string;
}

interface SocketPagoConfirmadoPayload {
  pagoId?: string;
  id?: string;
  total?: number;
  metodo?: string;
}

interface SocketNuevoPedidoPayload {
  pedidoId?: string;
  id?: string;
  mesa?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { isConnected } = useSocketStatus();

  // Estados para Administrador (KPIs reales)
  const [resumen, setResumen] = useState<ResumenDashboardDTO | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Estados en tiempo real para eventos de Socket.IO
  const [alertasCocina, setAlertasCocina] = useState<AlertaCocina[]>([]);
  const [pagosCaja, setPagosCaja] = useState<PagoConfirmado[]>([]);
  const [comandasCocina, setComandasCocina] = useState<ComandaNueva[]>([]);

  // Escucha de eventos en tiempo real según rol con callbacks estables
  const handleAlertaCocina = useCallback((data: SocketAlertaCocinaPayload) => {
    const nuevaAlerta: AlertaCocina = {
      id: String(Date.now()),
      pedidoId: data?.pedidoId || data?.id,
      mesa: data?.mesa || 'Mesa',
      mensaje: data?.mensaje || 'Pedido listo para ser servido',
      hora: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
    };
    setAlertasCocina((prev) => [nuevaAlerta, ...prev].slice(0, 5));
  }, []);

  const handlePagoConfirmado = useCallback((data: SocketPagoConfirmadoPayload) => {
    const nuevoPago: PagoConfirmado = {
      id: String(Date.now()),
      pagoId: data?.pagoId || data?.id,
      total: data?.total ? Number(data.total) : undefined,
      metodo: data?.metodo || 'QR',
      hora: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
    };
    setPagosCaja((prev) => [nuevoPago, ...prev].slice(0, 5));
  }, []);

  const handleNuevoPedido = useCallback((data: SocketNuevoPedidoPayload) => {
    const nuevaComanda: ComandaNueva = {
      id: String(Date.now()),
      pedidoId: data?.pedidoId || data?.id,
      mesa: data?.mesa || 'Mesa',
      hora: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
    };
    setComandasCocina((prev) => [nuevaComanda, ...prev].slice(0, 5));
  }, []);

  useSocketEvent<SocketAlertaCocinaPayload>(SOCKET_EVENTS.MESAS_ALERTA_LISTO, handleAlertaCocina);
  useSocketEvent<SocketPagoConfirmadoPayload>(SOCKET_EVENTS.CAJA_PAGO_CONFIRMADO, handlePagoConfirmado);
  useSocketEvent<SocketNuevoPedidoPayload>(SOCKET_EVENTS.COCINA_NUEVO_PEDIDO, handleNuevoPedido);

  const fetchAdminDashboard = useCallback(async () => {
    if (user?.rol !== 'Administrador') return;

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
  }, [user?.rol]);

  useEffect(() => {
    if (user?.rol === 'Administrador') {
      queueMicrotask(() => {
        void fetchAdminDashboard();
      });
    }
  }, [user?.rol, fetchAdminDashboard]);

  if (!user) return null;

  // Fecha en formato boliviano legible
  const fechaHoy = new Date().toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formatEstadoMesaBadge = (estado: string) => {
    switch (estado) {
      case 'Libre':
        return <Badge variant="mesa-libre" dot>Libre</Badge>;
      case 'Ocupada':
        return <Badge variant="mesa-ocupada" dot>Ocupada</Badge>;
      case 'Cuenta Solicitada':
        return <Badge variant="mesa-cuenta-solicitada" dot>Cuenta Solicitada</Badge>;
      default:
        return <Badge variant="neutral">{estado}</Badge>;
    }
  };

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
      {/* Encabezado Principal del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Bienvenido, {user.nombre} {user.apellido}
            </h2>
            <Badge
              variant={
                user.rol === 'Administrador'
                  ? 'admin'
                  : user.rol === 'Mesero'
                  ? 'mesero'
                  : user.rol === 'Cajero'
                  ? 'cajero'
                  : 'cocinero'
              }
              className="text-xs"
            >
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

          {user.rol === 'Administrador' && (
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
          )}
        </div>
      </div>

      {/* ========================================================
          1. ADMINISTRADOR: Métricas Reales de GET /api/dashboard/resumen
         ======================================================== */}
      {user.rol === 'Administrador' && (
        <div className="space-y-6">
          {dashboardError && (
            <Alert variant="warning" title="Aviso del Servidor Backend">
              {dashboardError}. Puedes intentar actualizar una vez el servicio esté en ejecución.
            </Alert>
          )}

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
      )}

      {/* ========================================================
          2. MESERO: Vista Operativa de Salón y Atención
         ======================================================== */}
      {user.rol === 'Mesero' && (
        <div className="space-y-6">
          {/* Banner Operativo corregido */}
          <div className="p-5 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-gradient-to-r from-sky-50 to-white dark:from-sky-950/30 dark:to-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="text-base font-bold text-sky-950 dark:text-sky-200">
                  Banner Operativo: Identificación del mesero y estado operativo del servicio
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Atención activa a cargo de <span className="font-semibold text-zinc-900 dark:text-zinc-100">{user.nombre} {user.apellido}</span>. Conexión de servicio vinculada a la sala <span className="font-mono text-sky-600 dark:text-sky-400">room:meseros</span>.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                <CheckCircle className="w-3.5 h-3.5 text-sky-600" />
                Servicio en Marcha
              </span>
            </div>
          </div>

          {/* Tarjetas de Acción Operativa */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Explorar Mesas */}
            <Card isHoverable className="flex flex-col justify-between">
              <CardHeader>
                <div className="p-2.5 w-fit rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-2">
                  <Grid className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">Estado del Salón</CardTitle>
                <CardDescription>
                  Monitoreo de mesas en tiempo real con los 3 estados oficiales:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex flex-wrap gap-2 text-xs">
                  {formatEstadoMesaBadge('Libre')}
                  {formatEstadoMesaBadge('Ocupada')}
                  {formatEstadoMesaBadge('Cuenta Solicitada')}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Consulta de capacidad y ubicación para ubicar comensales.
                </p>
              </CardContent>
              <div className="p-4 pt-0">
                <Link href="/mesas" className="w-full">
                  <Button variant="outline" size="sm" className="w-full justify-between" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Ir a Mesas
                  </Button>
                </Link>
              </div>
            </Card>

            {/* 2. Apertura de Comanda */}
            <Card isHoverable className="flex flex-col justify-between">
              <CardHeader>
                <div className="p-2.5 w-fit rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 mb-2">
                  <Receipt className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">Toma de Comandas</CardTitle>
                <CardDescription>
                  Registro rápido de pedidos y solicitud de cuenta para salón:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-xs text-zinc-600 dark:text-zinc-400">
                <p>• Asignación directa a mesa activa.</p>
                <p>• Selección de platos con notas culinarias.</p>
                <p>• Envío instantáneo a tablero de cocina.</p>
              </CardContent>
              <div className="p-4 pt-0">
                <Link href="/pedidos" className="w-full">
                  <Button variant="outline" size="sm" className="w-full justify-between" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Gestionar Pedidos
                  </Button>
                </Link>
              </div>
            </Card>

            {/* 3. Menú y Disponibilidad */}
            <Card isHoverable className="flex flex-col justify-between">
              <CardHeader>
                <div className="p-2.5 w-fit rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mb-2">
                  <Utensils className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">Menú y Disponibilidad</CardTitle>
                <CardDescription>
                  Consulta rápida de platos e ingredientes para información al comensal:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-xs text-zinc-600 dark:text-zinc-400">
                <p>• Consulta de precios oficiales de platos.</p>
                <p>• Estado booleano de disponibilidad de ingredientes.</p>
                <p>• Clasificación por categorías culinarias.</p>
              </CardContent>
              <div className="p-4 pt-0">
                <Link href="/platos" className="w-full">
                  <Button variant="outline" size="sm" className="w-full justify-between" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Consultar Catálogo
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Bandeja de Avisos de Cocina en Vivo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <CardTitle className="text-base">Bandeja de Pedidos Listos en Vivo</CardTitle>
                    <CardDescription>
                      Notificaciones en tiempo real desde la cocina (evento mesas:alerta_listo)
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={isConnected ? 'success' : 'neutral'} dot>
                  {isConnected ? 'Escuchando cocina' : 'Desconectado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {alertasCocina.length === 0 ? (
                <EmptyState
                  icon={ChefHat}
                  title="Sin alertas de cocina pendientes"
                  description="Cuando cocina marque un plato como listo para servir, la notificación aparecerá aquí al instante."
                />
              ) : (
                <div className="space-y-2">
                  {alertasCocina.map((alerta) => (
                    <div
                      key={alerta.id}
                      className="p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {alerta.mesa}
                          </span>
                          <span className="text-zinc-600 dark:text-zinc-400 ml-2">
                            {alerta.mensaje}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono shrink-0">
                        {alerta.hora}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================
          3. CAJERO: Vista Operativa de Cobros y Facturación
         ======================================================== */}
      {user.rol === 'Cajero' && (
        <div className="space-y-6">
          {/* Banner de Turno de Caja */}
          <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/30 dark:to-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-200">
                  Banner Operativo: Control de Cobros y Facturación en Caja
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Cajero activo: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{user.nombre} {user.apellido}</span>. Recepción de eventos en tiempo real en la sala <span className="font-mono text-emerald-600 dark:text-emerald-400">room:caja</span>.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Caja Habilitada
              </span>
            </div>
          </div>

          {/* Tarjetas de Acción Operativa */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Cuentas Pendientes */}
            <Card isHoverable className="flex flex-col justify-between">
              <CardHeader>
                <div className="p-2.5 w-fit rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mb-2">
                  <Receipt className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">Cuentas por Cobrar</CardTitle>
                <CardDescription>
                  Mesas en estado <span className="font-semibold text-blue-600 dark:text-blue-400">Cuenta Solicitada</span>:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-xs text-zinc-600 dark:text-zinc-400">
                <p>• Liquidación directa de órdenes consumidas.</p>
                <p>• Cálculo automático de subtotal y total.</p>
                <p>• Liberación de mesa al confirmar pago.</p>
              </CardContent>
              <div className="p-4 pt-0">
                <Link href="/caja" className="w-full">
                  <Button variant="outline" size="sm" className="w-full justify-between" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Ver Cuentas
                  </Button>
                </Link>
              </div>
            </Card>

            {/* 2. Métodos Oficiales */}
            <Card isHoverable className="flex flex-col justify-between">
              <CardHeader>
                <div className="p-2.5 w-fit rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-2">
                  <DollarSign className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">Métodos Permitidos</CardTitle>
                <CardDescription>
                  Los 3 únicos métodos válidos en el backend:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="flex flex-wrap gap-1.5 text-xs font-medium">
                  <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                    Efectivo
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                    Tarjeta
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                    QR
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                  Validación transaccional con confirmación inmediata.
                </p>
              </CardContent>
              <div className="p-4 pt-0">
                <Link href="/pagos" className="w-full">
                  <Button variant="outline" size="sm" className="w-full justify-between" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Historial de Pagos
                  </Button>
                </Link>
              </div>
            </Card>

            {/* 3. Cierre de Turno */}
            <Card isHoverable className="flex flex-col justify-between">
              <CardHeader>
                <div className="p-2.5 w-fit rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 mb-2">
                  <Clock className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">Cierre y Arqueo</CardTitle>
                <CardDescription>
                  Liquidación final y entrega de turno:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-xs text-zinc-600 dark:text-zinc-400">
                <p>• Consolidado de total recaudado por método.</p>
                <p>• Registro en colección CierreCaja del backend.</p>
                <p>• Cambio de estado de usuario operativo.</p>
              </CardContent>
              <div className="p-4 pt-0">
                <Button variant="outline" size="sm" className="w-full justify-between" disabled title="Disponible en Fase 3">
                  <span>Preparar Arqueo</span>
                  <span className="text-[10px] text-zinc-400">Próx.</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* Bandeja de Pagos en Vivo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <CardTitle className="text-base">Pagos Confirmados en Vivo</CardTitle>
                    <CardDescription>
                      Notificaciones de cobros procesados en tiempo real (evento caja:pago_confirmado)
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={isConnected ? 'success' : 'neutral'} dot>
                  {isConnected ? 'Canal en vivo' : 'Desconectado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pagosCaja.length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  title="Sin pagos recientes en este turno"
                  description="Las transacciones confirmadas aparecerán registradas aquí automáticamente."
                />
              ) : (
                <div className="space-y-2">
                  {pagosCaja.map((pago) => (
                    <div
                      key={pago.id}
                      className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            Pago Confirmado
                          </span>
                          <span className="text-xs text-zinc-600 dark:text-zinc-400 ml-2 font-mono">
                            Método: {pago.metodo}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {pago.total && (
                          <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            Bs. {pago.total.toFixed(2)}
                          </span>
                        )}
                        <span className="text-xs text-zinc-500 font-mono">
                          {pago.hora}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================
          4. COCINERO: Vista Operativa de Producción Culinaria
         ======================================================== */}
      {user.rol === 'Cocinero' && (
        <div className="space-y-6">
          {/* Banner de Producción Culinaria */}
          <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/30 dark:to-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-base font-bold text-amber-950 dark:text-amber-200">
                  Banner Operativo: Producción Culinaria y Control de Cocina
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Jefe de partida: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{user.nombre} {user.apellido}</span>. Sincronización en vivo con pedidos de salón en <span className="font-mono text-amber-600 dark:text-amber-400">cocina:nuevo_pedido</span>.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
                Cocina en Operación
              </span>
            </div>
          </div>

          {/* Tarjetas de Acción Operativa */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Tablero de Producción */}
            <Card isHoverable className="flex flex-col justify-between">
              <CardHeader>
                <div className="p-2.5 w-fit rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mb-2">
                  <ChefHat className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">Tablero KDS</CardTitle>
                <CardDescription>
                  Comandas en estado <span className="font-semibold text-amber-600 dark:text-amber-400">EN_PREPARACION</span>:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-xs text-zinc-600 dark:text-zinc-400">
                <p>• Cola visual de órdenes por orden de llegada.</p>
                <p>• Transición rápida a ENTREGADO con alerta al mesero.</p>
                <p>• Visualización de notas e indicaciones especiales.</p>
              </CardContent>
              <div className="p-4 pt-0">
                <Link href="/cocina" className="w-full">
                  <Button variant="outline" size="sm" className="w-full justify-between" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Abrir Tablero
                  </Button>
                </Link>
              </div>
            </Card>

            {/* 2. Disponibilidad de Ingredientes */}
            <Card isHoverable className="flex flex-col justify-between">
              <CardHeader>
                <div className="p-2.5 w-fit rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-2">
                  <Utensils className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">Disponibilidad de Ingredientes</CardTitle>
                <CardDescription>
                  Control booleano de insumos para la carta:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-xs text-zinc-600 dark:text-zinc-400">
                <p>• Estado booleano exacto (<span className="font-mono text-emerald-600 dark:text-emerald-400">disponible: true/false</span>).</p>
                <p>• Inhabilitación rápida de platos con insumo faltante.</p>
                <p>• Sincronización con el personal de salón.</p>
              </CardContent>
              <div className="p-4 pt-0">
                <Link href="/ingredientes" className="w-full">
                  <Button variant="outline" size="sm" className="w-full justify-between" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Ver Ingredientes
                  </Button>
                </Link>
              </div>
            </Card>

            {/* 3. Catálogo de Platos */}
            <Card isHoverable className="flex flex-col justify-between">
              <CardHeader>
                <div className="p-2.5 w-fit rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 mb-2">
                  <Receipt className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">Ficha de Platos</CardTitle>
                <CardDescription>
                  Recetario y especificaciones de porcionamiento:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-xs text-zinc-600 dark:text-zinc-400">
                <p>• Consulta de ingredientes de cada receta.</p>
                <p>• Tiempos estimados y temperaturas de servicio.</p>
                <p>• Estándares visuales de presentación.</p>
              </CardContent>
              <div className="p-4 pt-0">
                <Link href="/platos" className="w-full">
                  <Button variant="outline" size="sm" className="w-full justify-between" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Consultar Platos
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Bandeja de Nuevas Comandas en Vivo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <CardTitle className="text-base">Nuevas Comandas en Tiempo Real</CardTitle>
                    <CardDescription>
                      Órdenes recién enviadas desde las mesas (evento cocina:nuevo_pedido)
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={isConnected ? 'success' : 'neutral'} dot>
                  {isConnected ? 'Receptor activo' : 'Desconectado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {comandasCocina.length === 0 ? (
                <EmptyState
                  icon={ChefHat}
                  title="Tablero al día"
                  description="Las nuevas comandas emitidas por los meseros ingresarán aquí en tiempo real para su preparación."
                />
              ) : (
                <div className="space-y-2">
                  {comandasCocina.map((comanda) => (
                    <div
                      key={comanda.id}
                      className="p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <Receipt className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            Nueva orden en {comanda.mesa}
                          </span>
                          {comanda.pedidoId && (
                            <span className="text-xs text-zinc-500 font-mono ml-2">
                              #{comanda.pedidoId}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono shrink-0">
                        {comanda.hora}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
