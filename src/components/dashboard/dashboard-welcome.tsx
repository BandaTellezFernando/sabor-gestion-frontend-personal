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
 * Encabezado operativo de Alta Gastronomía para Mesero, Cajero y Cocinero.
 * Mantiene la conexión en vivo con Socket.IO y la estética Fine Dining.
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
      className="rounded-sm border border-amber-700/25 bg-gradient-to-r from-amber-950/30 via-zinc-900 to-zinc-950 p-5 sm:p-6 shadow-[0_4px_25px_rgba(0,0,0,0.6)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center flex-wrap gap-2.5">
            <span className={`p-2 rounded-sm border ${iconClassName}`} aria-hidden="true">
              <Icon className="w-4.5 h-4.5" />
            </span>
            <h1
              id="dashboard-welcome-title"
              className="font-serif text-xl sm:text-2xl font-semibold tracking-wide text-stone-100"
            >
              {title}
            </h1>
            <Badge variant={roleBadge} className="text-[10px] ml-1">
              {roleLabel}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 font-light">
            <span className="capitalize">{formatFechaLarga()}</span>
            <span className="mx-1.5 text-stone-600" aria-hidden="true">
              ·
            </span>
            {description}
          </p>
          <p className="text-[11px] font-mono text-amber-500/70">
            Canal Socket.IO: {room}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs font-medium tracking-wide ${
              isConnected
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40'
                : 'bg-zinc-900 text-stone-400 border-stone-800'
            }`}
            title={isConnected ? 'Conectado a Socket.IO en tiempo real' : 'Sin conexión WebSockets'}
          >
            <Radio
              className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-stone-500'}`}
              aria-hidden="true"
            />
            <span className="font-mono text-[11px]">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
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
