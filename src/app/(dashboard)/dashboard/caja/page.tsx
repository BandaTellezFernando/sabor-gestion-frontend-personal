'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ROL_LABELS } from '@/lib/constants';
import { ApiError } from '@/lib/api-error';
import { PayloadCajaDTO, ComprobantePago } from '@/types';
import { pedidoService } from '@/services/pedido.service';
import { CuentaCard } from '@/components/caja/cuenta-card';
import { CobroModal } from '@/components/caja/cobro-modal';
import { ComprobanteModal } from '@/components/caja/comprobante-modal';
import { useSocketEvent } from '@/hooks/use-socket';
import { SOCKET_EVENTS } from '@/lib/socket';
import {
  CreditCard,
  Receipt,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  Clock,
  ShieldAlert,
} from 'lucide-react';

function CajaPageContent() {
  const { user } = useAuth();

  const [cuentas, setCuentas] = useState<PayloadCajaDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [selectedCuenta, setSelectedCuenta] = useState<PayloadCajaDTO | null>(null);
  const [isCobroModalOpen, setIsCobroModalOpen] = useState<boolean>(false);

  const [comprobanteActual, setComprobanteActual] = useState<ComprobantePago | null>(null);
  const [isComprobanteModalOpen, setIsComprobanteModalOpen] = useState<boolean>(false);

  // Carga inicial de cuentas pendientes
  const cargarCuentasPendientes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await pedidoService.getPedidosPendientesCobro();
      setCuentas(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.getUserMessage());
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al cargar las cuentas pendientes de cobro.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void cargarCuentasPendientes();
    });
  }, [cargarCuentasPendientes]);

  // Socket: Nueva comanda con cuenta solicitada
  useSocketEvent<PayloadCajaDTO>(SOCKET_EVENTS.CAJA_NUEVA_CUENTA, (nuevaCuenta) => {
    if (!nuevaCuenta || !nuevaCuenta.pedidoId) return;
    setCuentas((prev) => {
      const index = prev.findIndex((c) => c.pedidoId === nuevaCuenta.pedidoId);
      if (index >= 0) {
        const next = [...prev];
        next[index] = nuevaCuenta;
        return next;
      }
      return [nuevaCuenta, ...prev];
    });
  });

  // Socket: Solicitud de pago alternativa
  useSocketEvent<PayloadCajaDTO>(SOCKET_EVENTS.CAJA_SOLICITUD_PAGO, (solicitud) => {
    if (!solicitud || !solicitud.pedidoId) return;
    setCuentas((prev) => {
      const index = prev.findIndex((c) => c.pedidoId === solicitud.pedidoId);
      if (index >= 0) {
        const next = [...prev];
        next[index] = solicitud;
        return next;
      }
      return [solicitud, ...prev];
    });
  });

  // Socket: Pago completado (liberación de mesa y cierre de pedido)
  useSocketEvent<{ pedidoId: string }>(SOCKET_EVENTS.MESAS_PAGO_COMPLETADO, (data) => {
    if (!data || !data.pedidoId) return;
    setCuentas((prev) => prev.filter((c) => c.pedidoId !== data.pedidoId));
  });

  // Socket: Cambio de estado de mesa (por si se reabre o cancela)
  useSocketEvent(SOCKET_EVENTS.MESAS_UPDATED, () => {
    cargarCuentasPendientes();
  });

  const handleAbrirCobro = (cuenta: PayloadCajaDTO) => {
    setSelectedCuenta(cuenta);
    setIsCobroModalOpen(true);
  };

  const handleCobroExitoso = (comprobante: ComprobantePago) => {
    if (selectedCuenta) {
      setCuentas((prev) => prev.filter((c) => c.pedidoId !== selectedCuenta.pedidoId));
    }
    setComprobanteActual(comprobante);
    setIsComprobanteModalOpen(true);
  };

  if (!user) return null;

  const totalPorCobrar = cuentas.reduce((sum, c) => sum + Number(c.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Estación de Caja y Facturación
            </h1>
            <Badge variant="cajero" className="text-xs">
              {ROL_LABELS[user.rol]}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Punto de control financiero para liquidación de comandas, cobro multicanal y emisión de comprobantes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={cargarCuentasPendientes}
            isLoading={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Actualizar
          </Button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Caja Operativa
          </span>
        </div>
      </div>

      {/* Métricas Rápidas de la Estación */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Turno */}
        <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-xs text-stone-500 dark:text-stone-400">Cajero en Turno</span>
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {user.nombre} {user.apellido}
            </p>
            <span className="text-[11px] font-mono text-stone-400">Canal: room:caja</span>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Cuentas Pendientes */}
        <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-xs text-stone-500 dark:text-stone-400">Cuentas por Cobrar</span>
            <p className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {cuentas.length}
            </p>
            <span className="text-[11px] text-stone-400">
              {cuentas.length === 1 ? 'Mesa esperando pago' : 'Mesas esperando pago'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Monto Total Pendiente */}
        <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-xs text-stone-500 dark:text-stone-400">Monto Total en Espera</span>
            <p className="text-xl font-bold text-[#C84B26] dark:text-[#E05A36]">
              Bs {totalPorCobrar.toFixed(2)}
            </p>
            <span className="text-[11px] text-stone-400">Sujeto a propinas/descuentos</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Alerta de Error si ocurre */}
      {error && (
        <Alert variant="error">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={cargarCuentasPendientes}>
              Reintentar
            </Button>
          </div>
        </Alert>
      )}

      {/* Sección Principal: Cuentas Pendientes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Cuentas Pendientes de Cobro
            </h2>
            <Badge variant="warning" className="text-xs">
              {cuentas.length}
            </Badge>
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            Sincronizado en tiempo real vía WebSocket
          </span>
        </div>

        {/* Estado de Carga */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            <Spinner size="lg" />
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Consultando órdenes pendientes de cobro...
            </p>
          </div>
        ) : cuentas.length === 0 ? (
          <EmptyState
            title="No hay cuentas pendientes de cobro"
            description="Las comandas con cuenta solicitada por los meseros desde el salón aparecerán automáticamente aquí en tiempo real."
            icon={Receipt}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {cuentas.map((cuenta) => (
              <CuentaCard
                key={cuenta.pedidoId}
                cuenta={cuenta}
                onCobrar={handleAbrirCobro}
              />
            ))}
          </div>
        )}
      </div>

      {/* Módulo Secundario Informativo: Arqueo y Cierre */}
      <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Arqueo y Cierre de Turno
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Conciliación de caja física, vouchers y cierres de jornada.
              </p>
            </div>
          </div>
          <Badge variant="neutral">Próxima fase</Badge>
        </div>
      </div>

      {/* Nota de Seguridad y RBAC */}
      <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 flex items-start gap-3 text-xs text-stone-600 dark:text-stone-400">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <p>
          Las transacciones procesadas desde esta estación son atómicas y definitivas. Al confirmar el pago, la orden pasa a estado <span className="font-semibold text-stone-800 dark:text-stone-200">CERRADO</span> y la mesa asociada retorna automáticamente a estado <span className="font-semibold text-stone-800 dark:text-stone-200">Libre</span> en salón.
        </p>
      </div>

      {/* Modal de Cobro */}
      <CobroModal
        isOpen={isCobroModalOpen}
        onClose={() => {
          setIsCobroModalOpen(false);
          setSelectedCuenta(null);
        }}
        cuenta={selectedCuenta}
        onSuccess={handleCobroExitoso}
      />

      {/* Modal de Comprobante */}
      <ComprobanteModal
        isOpen={isComprobanteModalOpen}
        onClose={() => {
          setIsComprobanteModalOpen(false);
          setComprobanteActual(null);
        }}
        comprobante={comprobanteActual}
      />
    </div>
  );
}

export default function CajaPage() {
  return (
    <RoleGuard allowedRoles={['Cajero', 'Administrador']}>
      <CajaPageContent />
    </RoleGuard>
  );
}
