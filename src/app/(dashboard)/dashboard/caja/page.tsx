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
import { CuentaMesaDTO, ComprobantePago } from '@/types';
import { cuentaMesaService } from '@/services/cuenta-mesa.service';
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
  const [cuentas, setCuentas] = useState<CuentaMesaDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaMesaDTO | null>(null);
  const [isCobroModalOpen, setIsCobroModalOpen] = useState<boolean>(false);
  const [comprobanteActual, setComprobanteActual] = useState<ComprobantePago | null>(null);
  const [isComprobanteModalOpen, setIsComprobanteModalOpen] = useState<boolean>(false);

  const cargarCuentasPendientes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await cuentaMesaService.listarPendientes();
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
    queueMicrotask(() => void cargarCuentasPendientes());
  }, [cargarCuentasPendientes]);

  // La creación de una cuenta agrupada emite estos eventos sin enviar el token QR.
  useSocketEvent<Record<string, unknown>>(SOCKET_EVENTS.CAJA_NUEVA_CUENTA, () => {
    void cargarCuentasPendientes();
  });
  useSocketEvent<Record<string, unknown>>(SOCKET_EVENTS.CAJA_SOLICITUD_PAGO, () => {
    void cargarCuentasPendientes();
  });

  // La mesa cambia a Libre al pagarse la cuenta. Recargar evita depender de IDs de pedido.
  useSocketEvent(SOCKET_EVENTS.MESAS_UPDATED, () => {
    void cargarCuentasPendientes();
  });

  const handleAbrirCobro = (cuenta: CuentaMesaDTO) => {
    setSelectedCuenta(cuenta);
    setIsCobroModalOpen(true);
  };

  const handleCobroExitoso = (comprobante: ComprobantePago) => {
    if (selectedCuenta) {
      setCuentas((prev) => prev.filter((cuenta) => cuenta._id !== selectedCuenta._id));
    }
    setComprobanteActual(comprobante);
    setIsComprobanteModalOpen(true);
  };

  if (!user) return null;

  const totalPorCobrar = cuentas.reduce((sum, cuenta) => sum + Number(cuenta.total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Estación de Caja y Facturación
            </h1>
            <Badge variant="cajero" className="text-xs">{ROL_LABELS[user.rol]}</Badge>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Cobro consolidado de comandas por mesa, pago en efectivo, tarjeta o QR y emisión de comprobantes detallados.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void cargarCuentasPendientes()}
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-xs text-stone-500 dark:text-stone-400">Cajero en turno</span>
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">{user.nombre} {user.apellido}</p>
            <span className="text-[11px] font-mono text-stone-400">Canal: room:caja</span>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-xs text-stone-500 dark:text-stone-400">Cuentas por cobrar</span>
            <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{cuentas.length}</p>
            <span className="text-[11px] text-stone-400">
              {cuentas.length === 1 ? 'Mesa esperando pago' : 'Mesas esperando pago'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-xs text-stone-500 dark:text-stone-400">Total pendiente</span>
            <p className="text-xl font-bold text-[#C84B26] dark:text-[#E05A36]">Bs {totalPorCobrar.toFixed(2)}</p>
            <span className="text-[11px] text-stone-400">Subtotal más propina de las cuentas</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void cargarCuentasPendientes()}>Reintentar</Button>
          </div>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Cuentas pendientes de cobro</h2>
            <Badge variant="warning" className="text-xs">{cuentas.length}</Badge>
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400">Sincronizado en tiempo real</span>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            <Spinner size="lg" />
            <p className="text-xs text-stone-500 dark:text-stone-400">Consultando cuentas agrupadas pendientes...</p>
          </div>
        ) : cuentas.length === 0 ? (
          <EmptyState
            title="No hay cuentas pendientes de cobro"
            description="Cuando un mesero solicite la cuenta de una mesa, sus comandas elegibles se agruparán aquí."
            icon={Receipt}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {cuentas.map((cuenta) => (
              <CuentaCard key={cuenta._id} cuenta={cuenta} onCobrar={handleAbrirCobro} />
            ))}
          </div>
        )}
      </div>

      <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Arqueo y cierre de turno</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Resumen por método de pago, propinas y pagos procesados.</p>
            </div>
          </div>
          <Badge variant="neutral">Siguiente fase</Badge>
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 flex items-start gap-3 text-xs text-stone-600 dark:text-stone-400">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <p>
          El pago se registra para la cuenta completa. Al confirmarlo, las comandas se cierran y la mesa vuelve al estado Libre. Los pagos QR de esta versión son simulados y no constituyen confirmación bancaria real.
        </p>
      </div>

      <CobroModal
        isOpen={isCobroModalOpen}
        onClose={() => {
          setIsCobroModalOpen(false);
          setSelectedCuenta(null);
        }}
        cuenta={selectedCuenta}
        onSuccess={handleCobroExitoso}
      />

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
