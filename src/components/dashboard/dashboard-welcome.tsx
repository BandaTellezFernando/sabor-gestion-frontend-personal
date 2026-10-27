'use client';

import React from 'react';
import { LucideIcon, Radio, RefreshCw } from 'lucide-react';
import { Badge, BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatFechaLarga } from '@/lib/dashboard-format';

export interface DashboardWelcomeProps {
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  description: string;
  roleLabel: string;
  roleBadge: BadgeVariant;
  room: string;
  isConnected: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

/**
 * Encabezado operativo común a los paneles de Mesero, Cajero y Cocinero.
 * Identifica al operador, su canal de Socket.IO y el estado del turno.
 */
export function DashboardWelcome({
  icon: Icon,
  iconClassName,
  title,
  description,
  roleLabel,
  roleBadge,
  room,
  isConnected,
  isRefreshing,
  onRefresh,
}: DashboardWelcomeProps) {
  return (
    <section
      aria-labelledby="dashboard-welcome-title"
      className="rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-gradient-to-r from-[#FFF5EF] via-white to-stone-50 dark:from-[#2A1E18] dark:via-[#201E1B] dark:to-[#171614] p-5 sm:p-6 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center flex-wrap gap-2">
            <span className={`p-1.5 rounded-lg border ${iconClassName}`} aria-hidden="true">
              <Icon className="w-5 h-5" />
            </span>
            <h1
              id="dashboard-welcome-title"
              className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-50"
            >
              {title}
            </h1>
            <Badge variant={roleBadge} className="text-xs ml-1">
              {roleLabel}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            <span className="capitalize">{formatFechaLarga()}</span>
            <span className="mx-1.5 text-stone-300 dark:text-stone-600" aria-hidden="true">
              ·
            </span>
            {description}
          </p>
          <p className="text-[11px] font-mono text-stone-500 dark:text-stone-500">
            Canal en vivo: {room}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              isConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700'
            }`}
            title={isConnected ? 'Conectado a Socket.IO' : 'Sin conexión WebSockets'}
          >
            <Radio
              className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-stone-400'}`}
              aria-hidden="true"
            />
            <span>{isConnected ? 'En tiempo real' : 'Sin conexión'}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            isLoading={isRefreshing}
            title="Actualizar datos del panel"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Actualizar
          </Button>
        </div>
      </div>
    </section>
  );
}
