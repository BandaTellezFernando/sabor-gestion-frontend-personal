'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROL_LABELS } from '@/lib/constants';
import {
  CreditCard,
  Receipt,
  DollarSign,
  Clock,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

function CajaPageContent() {
  const { user } = useAuth();

  if (!user) return null;

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
            Punto de control financiero para cobro de comandas, emisión de comprobantes y cierre de turno.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Estación Habilitada
          </span>
        </div>
      </div>

      {/* Banner Informativo de Turno */}
      <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Turno Activo: {user.nombre} {user.apellido}
            </h2>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Espacio de trabajo asignado al rol de Caja. Las operaciones se registran con firma transaccional de usuario.
          </p>
        </div>
        <div className="text-xs text-stone-500 font-mono">
          Sala: room:caja
        </div>
      </div>

      {/* Tarjetas de Áreas Funcionales en Standby */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Cuentas Pendientes */}
        <Card className="flex flex-col justify-between rounded-2xl border-stone-200 dark:border-stone-800">
          <CardHeader>
            <div className="p-2.5 w-fit rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mb-2">
              <Receipt className="w-5 h-5" />
            </div>
            <CardTitle className="text-base text-stone-900 dark:text-stone-100">Cuentas por Cobrar</CardTitle>
            <CardDescription className="text-stone-500 dark:text-stone-400">
              Liquidación de comandas con cuenta solicitada desde salón:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 text-xs text-stone-600 dark:text-stone-400">
            <p>• Consulta de órdenes emitidas por los meseros.</p>
            <p>• Desglose de subtotales, descuentos y propinas.</p>
            <p>• Liberación automática de la mesa física al liquidar.</p>
          </CardContent>
          <div className="p-4 pt-0">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs text-stone-500">
              <span>Módulo transaccional</span>
              <Badge variant="neutral">Próximamente</Badge>
            </div>
          </div>
        </Card>

        {/* 2. Métodos de Pago */}
        <Card className="flex flex-col justify-between rounded-2xl border-stone-200 dark:border-stone-800">
          <CardHeader>
            <div className="p-2.5 w-fit rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-2">
              <DollarSign className="w-5 h-5" />
            </div>
            <CardTitle className="text-base text-stone-900 dark:text-stone-100">Métodos de Cobro</CardTitle>
            <CardDescription className="text-stone-500 dark:text-stone-400">
              Modalidades transaccionales habilitadas en el sistema:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex flex-wrap gap-1.5 text-xs font-medium">
              <span className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                Efectivo
              </span>
              <span className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                Tarjeta
              </span>
              <span className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                QR
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Validación y registro conforme al contrato backend de pagos.
            </p>
          </CardContent>
          <div className="p-4 pt-0">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs text-stone-500">
              <span>Integración financiera</span>
              <Badge variant="neutral">Próximamente</Badge>
            </div>
          </div>
        </Card>

        {/* 3. Cierre y Balance */}
        <Card className="flex flex-col justify-between rounded-2xl border-stone-200 dark:border-stone-800">
          <CardHeader>
            <div className="p-2.5 w-fit rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <CardTitle className="text-base text-stone-900 dark:text-stone-100">Cierre y Arqueo</CardTitle>
            <CardDescription className="text-stone-500 dark:text-stone-400">
              Balance de turno y conciliación monetaria:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 text-xs text-stone-600 dark:text-stone-400">
            <p>• Cuadre de efectivo físico contra ventas del sistema.</p>
            <p>• Consolidación de vouchers y transacciones QR.</p>
            <p>• Generación de reporte de cierre de jornada.</p>
          </CardContent>
          <div className="p-4 pt-0">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs text-stone-500">
              <span>Arqueo de caja</span>
              <Badge variant="neutral">Próximamente</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Nota de Arquitectura */}
      <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 flex items-start gap-3 text-xs text-stone-600 dark:text-stone-400">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <p>
          Esta estación de trabajo está restringida exclusivamente para personal de <span className="font-semibold text-stone-800 dark:text-stone-200">Caja</span> y <span className="font-semibold text-stone-800 dark:text-stone-200">Administrador</span>. No se realizan llamadas a servicios no autorizados durante esta fase preparatoria.
        </p>
      </div>
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
