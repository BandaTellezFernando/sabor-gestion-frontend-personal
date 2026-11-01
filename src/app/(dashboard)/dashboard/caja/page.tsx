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

  useSocketEvent<Record<string, unknown>>(SOCKET_EVENTS.CAJA_NUEVA_CUENTA, () => {
    void cargarCuentasPendientes();
  });
  useSocketEvent<Record<string, unknown>>(SOCKET_EVENTS.CAJA_SOLICITUD_PAGO, () => {
    void cargarCuentasPendientes();
  });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-900/30">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-xl sm:text-2xl font-semibold tracking-wide text-stone-100">
              Estación de Facturación & Cobro
            </h1>
            <Badge variant="cajero" className="text-[10px]">{ROL_LABELS[user.rol]}</Badge>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 font-light mt-1">
            Cobro consolidado por mesa, transacciones con tarjeta, efectivo o QR y emisión de comprobantes de alta gastronomía.
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-medium bg-emerald-950/50 text-emerald-300 border border-emerald-800/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Caja Activa
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-sm border border-amber-700/25 bg-zinc-900 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-light">Responsable en turno</span>
            <p className="text-sm font-serif font-medium text-stone-100">{user.nombre} {user.apellido}</p>
            <span className="text-[11px] font-mono text-amber-500/70">Socket.IO: room:caja</span>
          </div>
          <div className="p-2 rounded-sm bg-amber-950/60 text-amber-400 border border-amber-800/30">
            <CreditCard className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="p-4 rounded-sm border border-amber-700/25 bg-zinc-900 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-light">Cuentas por cobrar</span>
            <p className="font-serif text-xl sm:text-2xl font-semibold text-stone-100">{cuentas.length}</p>
            <span className="text-[11px] text-stone-400 font-light">
              {cuentas.length === 1 ? 'Mesa esperando pago' : 'Mesas esperando pago'}
            </span>
          </div>
          <div className="p-2 rounded-sm bg-amber-950/60 text-amber-400 border border-amber-800/30">
            <Receipt className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="p-4 rounded-sm border border-amber-700/25 bg-zinc-900 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-light">Total pendiente</span>
            <p className="font-serif text-xl sm:text-2xl font-bold text-amber-400">Bs {totalPorCobrar.toFixed(2)}</p>
            <span className="text-[11px] text-stone-400 font-light">Subtotal más propina de sala</span>
          </div>
          <div className="p-2 rounded-sm bg-amber-950/60 text-amber-400 border border-amber-800/30">
            <DollarSign className="w-4.5 h-4.5" />
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
            <h2 className="font-serif text-base font-semibold text-stone-100 tracking-wide">Cuentas Pendientes de Cobro</h2>
            <Badge variant="warning" className="text-[10px]">{cuentas.length}</Badge>
          </div>
          <span className="text-xs text-amber-500/70 font-mono">Sincronizado en tiempo real</span>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 bg-zinc-900 rounded-sm border border-amber-700/25 shadow-xs">
            <Spinner size="lg" className="text-amber-500" />
            <p className="text-xs text-stone-400 font-light">Consultando comandas pendientes en sala...</p>
          </div>
        ) : cuentas.length === 0 ? (
          <EmptyState
            title="No hay cuentas pendientes de cobro"
            description="Cuando el sommelier o mesero solicite la cuenta de una mesa, se consolidará aquí inmediatamente."
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

      <div className="p-5 rounded-sm border border-amber-700/25 bg-zinc-900 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-sm bg-zinc-950 text-amber-500/80 border border-amber-900/30">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-medium text-stone-200">Arqueo y Cierre de Turno</h3>
              <p className="text-xs text-stone-400 font-light">Auditoría consolidada por métodos de pago, propinas y recaudación.</p>
            </div>
          </div>
          <Badge variant="neutral">Alta Gastronomía</Badge>
        </div>
      </div>

      <div className="p-4 rounded-sm border border-amber-800/30 bg-zinc-950/80 flex items-start gap-3 text-xs text-stone-400 font-light">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p>
          El pago se confirma para la totalidad de la cuenta agrupada. Al completarse, la mesa regresa automáticamente a estado Disponible en el mapa 3D y en sala.
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
