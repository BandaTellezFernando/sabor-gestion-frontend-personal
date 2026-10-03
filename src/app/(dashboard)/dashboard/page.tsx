'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSocketStatus } from '@/hooks/use-socket';
import { dashboardService } from '@/services/dashboard.service';
import { ResumenDashboardDTO } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ApiError } from '@/lib/api-error';
import { ROL_LABELS } from '@/lib/constants';
import {
  TrendingUp,
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
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { isConnected } = useSocketStatus();

  // Estados para Administrador (KPIs reales)
  const [resumen, setResumen] = useState<ResumenDashboardDTO | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Bienvenido, {user.nombre} {user.apellido}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Panel operativo en ejecución. Rol activo:{' '}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {ROL_LABELS[user.rol]}
            </span>
          </p>
        </div>

        {/* Estado en Vivo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-300">
            <Radio
              className={`w-3.5 h-3.5 ${
                isConnected ? 'text-emerald-500 animate-pulse' : 'text-zinc-400'
              }`}
            />
            <span>Canal Socket: {isConnected ? 'Sincronizado' : 'Sin conexión'}</span>
          </div>

          {user.rol === 'Administrador' && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAdminDashboard}
              isLoading={isLoadingDashboard}
              title="Refrescar métricas"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizar</span>
            </Button>
          )}
        </div>
      </div>

      {/* VISTA SEGÚN ROL */}

      {/* 1. ADMINISTRADOR: KPIs y Métricas Reales de GET /api/dashboard/resumen */}
      {user.rol === 'Administrador' && (
        <div className="space-y-6">
          {dashboardError && (
            <Alert variant="warning" title="Servidor Backend">
              {dashboardError}. Puedes intentar actualizar una vez el servicio esté en ejecución.
            </Alert>
          )}

          {isLoadingDashboard && !resumen && (
            <div className="p-12 text-center">
              <Spinner size="lg" className="text-amber-600" />
              <p className="mt-3 text-sm text-zinc-500">Cargando métricas consolidadas...</p>
            </div>
          )}

          {resumen && (
            <>
              {/* Tarjetas de KPIs Reales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                        Ventas Hoy
                      </span>
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      Bs. {Number(resumen.kpis.ventasHoy).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                        Órdenes Hoy
                      </span>
                      <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {resumen.kpis.ordenesHoy}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                        Clientes Est.
                      </span>
                      <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {resumen.kpis.clientesEstimados}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                        Mesas Activas
                      </span>
                      <Grid className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {resumen.kpis.mesasActivas}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                        Ocupación
                      </span>
                      <Percent className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {resumen.kpis.ocupacionPorcentaje}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Tablas de Platos Más Vendidos y Órdenes Recientes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Platos más vendidos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Platos Más Vendidos</CardTitle>
                    <CardDescription>Demanda culinaria registrada durante la jornada</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {resumen.platosMasVendidos.length === 0 ? (
                      <p className="p-4 text-xs text-zinc-400">Sin ventas registradas hoy.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plato</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {resumen.platosMasVendidos.map((plato, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{plato.nombre}</TableCell>
                              <TableCell className="text-right font-mono">{plato.cantidad}</TableCell>
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
                    <CardTitle className="text-base">Órdenes Recientes</CardTitle>
                    <CardDescription>Últimas comandas procesadas en salón</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {resumen.ordenesRecientes.length === 0 ? (
                      <p className="p-4 text-xs text-zinc-400">No hay órdenes recientes.</p>
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
                              <TableCell className="font-mono text-xs">{orden.id}</TableCell>
                              <TableCell>{orden.mesa}</TableCell>
                              <TableCell className="text-xs text-zinc-500">{orden.hora}</TableCell>
                              <TableCell>
                                <Badge variant="neutral">{orden.estado}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
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

      {/* 2. MESERO: Vista Operativa de Salón */}
      {user.rol === 'Mesero' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <CardTitle>Área de Atención en Salón y Comandas</CardTitle>
              </div>
              <CardDescription>
                Acceso autorizado para consulta de mesas, toma de pedidos y solicitud de cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 rounded-lg text-sm text-sky-900 dark:text-sky-200">
                <p className="font-medium">Funciones habilitadas para tu rol:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                  <li>Visualización del estado de mesas (Libre, Ocupada, Cuenta Solicitada).</li>
                  <li>Apertura de nuevas comandas y asignación de platos.</li>
                  <li>Solicitud de pre-cuenta para comensales en salón.</li>
                  <li>Recepción de alertas sonoras/visuales de platos listos desde cocina.</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 pt-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Arquitectura base y conexión a sala room:meseros activas.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. CAJERO: Vista Operativa de Caja */}
      {user.rol === 'Cajero' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle>Área de Facturación, Cobros y Arqueo</CardTitle>
              </div>
              <CardDescription>
                Acceso autorizado para liquidación de pedidos con cuenta solicitada y cierre de turno.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg text-sm text-emerald-900 dark:text-emerald-200">
                <p className="font-medium">Funciones habilitadas para tu rol:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                  <li>Consulta de pedidos pendientes de cobro en caja.</li>
                  <li>Procesamiento transaccional de pagos mediante Efectivo, Tarjeta o QR.</li>
                  <li>Confirmación de notificaciones de pago QR en tiempo real.</li>
                  <li>Emisión de comprobantes y cierre de turno con arqueo diario.</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 pt-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Arquitectura base y conexión a sala room:caja activas.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. COCINERO: Vista Operativa de Cocina */}
      {user.rol === 'Cocinero' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <CardTitle>Área de Producción Culinaria y Tablero de Cocina</CardTitle>
              </div>
              <CardDescription>
                Acceso autorizado para recepción de comandas en tiempo real y avance de estados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-sm text-amber-900 dark:text-amber-200">
                <p className="font-medium">Funciones habilitadas para tu rol:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                  <li>Recepción de nuevas órdenes emitidas desde salón vía WebSockets.</li>
                  <li>Avance de comanda de ABIERTO a EN_PREPARACION y ENTREGADO.</li>
                  <li>Emisión automática de alertas para el personal de meseros.</li>
                  <li>Consulta de recetarios escandallo e insumos disponibles.</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 pt-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Arquitectura base y sincronización de tablero de cocina activas.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
