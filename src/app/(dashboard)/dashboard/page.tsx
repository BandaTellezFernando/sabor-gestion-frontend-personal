'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
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
import { ApiError } from '@/lib/api-error';
import { ROL_LABELS } from '@/lib/constants';
import { SOCKET_EVENTS } from '@/lib/socket';
import {
  DollarSign,
  Receipt,
  Users,
  Percent,
  RefreshCw,
  Utensils,
  Radio,
  Flame,
  Layers,
  ChefHat,
  TrendingUp,
} from 'lucide-react';

function DashboardAdminContent() {
  const { user } = useAuth();
  const { isConnected } = useSocketStatus();

  // Estados para Administrador (datos reales de negocio vía dashboardService)
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
        setDashboardError('No se pudo sincronizar el resumen operativo con el servidor.');
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
      case 'PENDIENTE':
        return <Badge variant="pedido-abierto" dot>Abierto</Badge>;
      case 'EN PREPARACIÓN':
      case 'EN_PREPARACION':
        return <Badge variant="pedido-en-preparacion" dot>En Preparación</Badge>;
      case 'ENTREGADO':
      case 'COMPLETADA':
        return <Badge variant="pedido-entregado" dot>Entregado</Badge>;
      case 'CERRADO':
        return <Badge variant="pedido-cerrado" dot>Cerrado</Badge>;
      case 'CANCELADO':
      case 'CANCELADA':
        return <Badge variant="pedido-cancelado" dot>Cancelado</Badge>;
      default:
        return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Banner de Bienvenida y Encabezado Gastronómico */}
      <div className="rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-gradient-to-r from-[#FFF5EF] via-white to-stone-50 dark:from-[#2A1E18] dark:via-[#201E1B] dark:to-[#171614] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#C84B26]/10 text-[#C84B26] dark:text-[#E05A36] border border-[#C84B26]/20">
                <ChefHat className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-50">
                Panel de Control — Mishi-Food
              </h1>
              <Badge variant="admin" className="text-xs ml-1">
                {ROL_LABELS[user.rol]}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 capitalize">
              {fechaHoy} · <span className="font-medium text-stone-700 dark:text-stone-300">Resumen operativo y analítico de la jornada</span>
            </p>
          </div>

          {/* Estado de Red y Botón Actualizar */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700'
              }`}
              title={isConnected ? 'Conectado a Socket.IO' : 'Sin conexión WebSockets'}
            >
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-stone-400'}`} />
              <span>{isConnected ? 'En tiempo real' : 'Sin conexión'}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchAdminDashboard}
              isLoading={isLoadingDashboard}
              title="Refrescar métricas del salón"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingDashboard ? 'animate-spin' : ''}`} />}
            >
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Alerta de Error de Conexión */}
      {dashboardError && (
        <Alert variant="warning" title="Aviso del Servidor">
          {dashboardError}
        </Alert>
      )}

      {/* Spinner de Carga Inicial */}
      {isLoadingDashboard && !resumen && (
        <div className="py-20 text-center">
          <Spinner size="lg" className="text-[#C84B26] mx-auto" />
          <p className="mt-3 text-sm font-medium text-stone-500 dark:text-stone-400">
            Cargando métricas consolidadas del restaurante...
          </p>
        </div>
      )}

      {resumen && (
        <>
          {/* ========================================================
              PARTE SUPERIOR: 4 TARJETAS DE RESUMEN COMPACTAS
             ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* 1. Facturación de Hoy */}
            <StatCard
              icon={DollarSign}
              label="Facturación de Hoy"
              value={`Bs. ${Number(resumen.kpis.ventasHoy).toFixed(2)}`}
              description="Ingreso total acumulado en el día"
              iconColor="text-emerald-700 dark:text-emerald-300"
              iconBgColor="bg-emerald-50 dark:bg-emerald-950/40"
            />

            {/* 2. Comandas del Día */}
            <StatCard
              icon={Receipt}
              label="Comandas del Día"
              value={resumen.kpis.ordenesHoy}
              description="Órdenes culinarias procesadas"
              iconColor="text-[#C84B26] dark:text-[#E05A36]"
              iconBgColor="bg-[#C84B26]/10 dark:bg-[#C84B26]/20"
            />

            {/* 3. Afluencia Estimada (con aclaración visual obligatoria) */}
            <StatCard
              icon={Users}
              label="Afluencia Estimada"
              value={resumen.kpis.clientesEstimados}
              description="Estimado: 2 comensales / orden"
              iconColor="text-amber-700 dark:text-amber-300"
              iconBgColor="bg-amber-50 dark:bg-amber-950/40"
            />

            {/* 4. Ocupación de Salón */}
            <StatCard
              icon={Percent}
              label="Ocupación de Salón"
              value={`${resumen.kpis.ocupacionPorcentaje}%`}
              description={`${resumen.kpis.mesasActivas} mesas activas en servicio`}
              iconColor="text-sky-700 dark:text-sky-300"
              iconBgColor="bg-sky-50 dark:bg-sky-950/40"
            />
          </div>

          {/* ========================================================
              PARTE INFERIOR: PANELES INFORMATIVOS (ESTILO MANUAL PÁG 9)
             ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* COLUMNA IZQUIERDA (5 cols): Platos Más Vendidos y Categorías Populares */}
            <div className="lg:col-span-5 space-y-6">
              {/* Panel de Platos Más Vendidos */}
              <Card>
                <CardHeader className="bg-stone-50/60 dark:bg-[#1A1816]/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#C84B26]/10 text-[#C84B26] dark:text-[#E05A36]">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm sm:text-base">Platos Más Vendidos</CardTitle>
                        <CardDescription>Top platos con mayor demanda hoy</CardDescription>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Porciones
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  {resumen.platosMasVendidos.length === 0 ? (
                    <EmptyState
                      icon={Utensils}
                      title="Sin comandas registradas"
                      description="Las ventas de platos completadas hoy aparecerán aquí."
                      className="py-6"
                    />
                  ) : (
                    <div className="space-y-3.5">
                      {resumen.platosMasVendidos.map((plato, idx) => {
                        const maxCantidad = Math.max(
                          ...resumen.platosMasVendidos.map((p) => p.cantidad || 1)
                        );
                        const porcentajeVolumen = Math.round((plato.cantidad / maxCantidad) * 100);

                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-stone-50/70 dark:bg-[#1A1816]/70 border border-stone-200/70 dark:border-stone-800 transition-all hover:border-stone-300 dark:hover:border-stone-700"
                          >
                            <div className="flex items-center justify-between gap-3 mb-1.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-6 h-6 rounded-lg bg-[#C84B26]/10 text-[#C84B26] dark:text-[#E05A36] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                {plato.imagen ? (
                                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 relative bg-stone-200 dark:bg-stone-800">
                                    <Image
                                      src={plato.imagen}
                                      alt={plato.nombre}
                                      fill
                                      sizes="32px"
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-500 flex items-center justify-center shrink-0">
                                    <Utensils className="w-4 h-4" />
                                  </div>
                                )}
                                <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                                  {plato.nombre}
                                </span>
                              </div>

                              <span className="font-mono text-xs sm:text-sm font-extrabold text-[#C84B26] dark:text-[#E05A36] shrink-0">
                                {plato.cantidad} {plato.cantidad === 1 ? 'ped' : 'peds'}
                              </span>
                            </div>

                            {/* Barra de progreso visual sutil */}
                            <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#C84B26] h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${Math.max(8, porcentajeVolumen)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Panel de Categorías Populares (Inspirado en el manual) */}
              <Card>
                <CardHeader className="bg-stone-50/60 dark:bg-[#1A1816]/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm sm:text-base">Categorías Populares</CardTitle>
                        <CardDescription>Distribución porcentual de comandas</CardDescription>
                      </div>
                    </div>
                    <TrendingUp className="w-4 h-4 text-stone-400" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  {!resumen.categoriasPopulares || resumen.categoriasPopulares.length === 0 ? (
                    <EmptyState
                      icon={Layers}
                      title="Sin datos de categorías"
                      description="La distribución de pedidos por categoría aparecerá aquí."
                      className="py-6"
                    />
                  ) : (
                    <div className="space-y-3">
                      {resumen.categoriasPopulares.map((cat, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-stone-800 dark:text-stone-200 truncate">
                              {cat.nombre}
                            </span>
                            <span className="font-mono text-stone-500 dark:text-stone-400">
                              {cat.porcentaje}% ({cat.pedidos})
                            </span>
                          </div>
                          <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-[#C84B26] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(5, cat.porcentaje)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* COLUMNA DERECHA (7 cols): Comandas Recientes en Salón */}
            <div className="lg:col-span-7">
              <Card className="h-full flex flex-col">
                <CardHeader className="bg-stone-50/60 dark:bg-[#1A1816]/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-400">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm sm:text-base">Comandas Recientes</CardTitle>
                        <CardDescription>Flujo de atención en mesas en tiempo real</CardDescription>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-stone-500">
                      Últimas 5
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 flex-1">
                  {resumen.ordenesRecientes.length === 0 ? (
                    <EmptyState
                      icon={Receipt}
                      title="Sin comandas recientes"
                      description="Las nuevas comandas emitidas en el salón se reflejarán automáticamente."
                      className="py-12"
                    />
                  ) : (
                    <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
                      {resumen.ordenesRecientes.map((orden) => (
                        <div
                          key={orden.id}
                          className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 p-2 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-mono text-xs font-extrabold text-stone-800 dark:text-stone-200 shrink-0 border border-stone-200/80 dark:border-stone-700">
                              {orden.mesa}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100">
                                  {orden.id}
                                </span>
                                <span className="text-stone-300 dark:text-stone-600">·</span>
                                <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                                  {orden.hora}
                                </span>
                              </div>
                              <div className="mt-1">
                                {formatEstadoPedidoBadge(orden.estado)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 pl-13 sm:pl-0">
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                                Importe
                              </span>
                              <span className="font-mono text-sm sm:text-base font-extrabold text-stone-900 dark:text-stone-50">
                                Bs. {Number(orden.total).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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

export default function DashboardPage() {
  return (
    <RoleGuard allowedRoles={['Administrador']}>
      <DashboardAdminContent />
    </RoleGuard>
  );
}
