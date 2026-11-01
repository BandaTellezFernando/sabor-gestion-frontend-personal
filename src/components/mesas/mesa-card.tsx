//src/components/mesas/mesa-card.tsx
'use client';

import React from 'react';
import { Mesa, EstadoMesa, RolUsuario } from '@/types';
import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/ui/icon-button';
import { Users, MapPin, Pencil, Trash2, Plus, UtensilsCrossed, Receipt, Unlink2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { esMesaFusionada } from '@/services/mesa.service';

export interface MesaCardProps {
  mesa: Mesa;
  userRole: RolUsuario;
  onEdit?: (mesa: Mesa) => void;
  onDelete?: (mesa: Mesa) => void;
  onStateChange?: (mesa: Mesa, nuevoEstado: EstadoMesa) => Promise<void>;
  onSelectMesa?: (mesa: Mesa) => void;
  onRequestAccount?: (mesa: Mesa) => Promise<void>;
  onSplit?: (mesa: Mesa) => void;
  canRequestAccount?: boolean;
  isProcessing?: boolean;
  isAccountProcessing?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface EstadoVisual {
  card: string;
  accent: string;
  halo: string;
  badgeGlow: string;
}

const ESTADO_VISUAL: Record<EstadoMesa, EstadoVisual> = {
  Libre: {
    card: 'border-amber-900/25 bg-zinc-900 hover:border-emerald-600/60 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    accent: 'from-emerald-500 via-emerald-600/60 to-transparent',
    halo: 'bg-emerald-500/10',
    badgeGlow: 'bg-emerald-500/20',
  },
  Ocupada: {
    card: 'border-amber-700/40 bg-zinc-900 hover:border-amber-500/70 shadow-[0_0_15px_rgba(217,119,6,0.15)] hover:shadow-[0_0_20px_rgba(217,119,6,0.25)]',
    accent: 'from-amber-500 via-amber-600/60 to-transparent',
    halo: 'bg-amber-500/15',
    badgeGlow: 'bg-amber-500/30',
  },
  'Cuenta Solicitada': {
    card: 'border-amber-500/60 bg-zinc-900 hover:border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.25)]',
    accent: 'from-amber-400 via-yellow-500/60 to-transparent',
    halo: 'bg-amber-400/20',
    badgeGlow: 'bg-amber-400/40',
  },
};

export function MesaCard({
  mesa,
  userRole,
  onEdit,
  onDelete,
  onSelectMesa,
  onRequestAccount,
  onSplit,
  canRequestAccount = false,
  isProcessing = false,
  isAccountProcessing = false,
  className = '',
  style,
}: MesaCardProps) {
  const canManage = userRole === 'Administrador';
  const canOperateComanda = userRole === 'Mesero' || userRole === 'Administrador';
  const visual = ESTADO_VISUAL[mesa.estado] ?? ESTADO_VISUAL.Libre;
  const enServicio = mesa.estado === 'Ocupada' || mesa.estado === 'Cuenta Solicitada';
  const puedeDesunir =
    canManage && !!onSplit && mesa.estado === 'Libre' && esMesaFusionada(mesa);

  const formatBadge = (estado: EstadoMesa) => {
    switch (estado) {
      case 'Libre':
        return (
          <Badge variant="mesa-libre" dot className="px-2.5 py-0.5 text-[11px] font-medium">
            Disponible
          </Badge>
        );
      case 'Ocupada':
        return (
          <Badge variant="mesa-ocupada" dot className="px-2.5 py-0.5 text-[11px] font-medium">
            Ocupada
          </Badge>
        );
      case 'Cuenta Solicitada':
        return (
          <Badge variant="mesa-cuenta-solicitada" dot className="px-2.5 py-0.5 text-[11px] font-medium">
            Esperando Pago
          </Badge>
        );
      default:
        return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  return (
    <div
      onClick={() => {
        if (canOperateComanda && onSelectMesa && !isProcessing && !isAccountProcessing) {
          onSelectMesa(mesa);
        }
      }}
      role={canOperateComanda ? 'button' : 'region'}
      tabIndex={canOperateComanda ? 0 : -1}
      onKeyDown={(e) => {
        if (canOperateComanda && !isProcessing && !isAccountProcessing && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelectMesa?.(mesa);
        }
      }}
      aria-label={`${mesa.numero}. Estado: ${
        mesa.estado === 'Libre' ? 'Disponible' : mesa.estado === 'Ocupada' ? 'Ocupada' : 'Esperando pago'
      }. Capacidad: ${mesa.capacidad} personas.`}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-sm border p-5 shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-0.5 select-none ${
        canOperateComanda
          ? 'cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500'
          : ''
      } ${visual.card} ${className}`}
      style={style}
      data-mesa-id={mesa._id}
    >
      {/* Barra de acento superior por estado */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${visual.accent}`}
      />

      {/* Halo decorativo tenue */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full blur-2xl transition-opacity duration-500 ${visual.halo} ${
          enServicio
            ? 'animate-pulse opacity-80 [animation-duration:3.5s]'
            : 'opacity-40 group-hover:opacity-75'
        }`}
      />

      <div className="relative space-y-4">
        {/* Cabecera: Estado + acciones */}
        <div className="flex items-start justify-between gap-2">
          <span className="relative inline-flex shrink-0">
            {enServicio && (
              <span
                aria-hidden="true"
                className={`absolute inset-0 rounded-sm blur-md animate-pulse [animation-duration:3s] ${visual.badgeGlow}`}
              />
            )}
            <span className="relative">{formatBadge(mesa.estado)}</span>
          </span>

          {canManage && (
            <div
              className="-mr-1.5 -mt-1.5 flex items-center opacity-70 transition-opacity duration-200 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              {onEdit && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(mesa);
                  }}
                  aria-label={`Editar ${mesa.numero}`}
                  title="Editar mesa"
                  className="h-7 w-7 rounded-sm text-stone-400 hover:text-amber-400"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </IconButton>
              )}
              {onDelete && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(mesa);
                  }}
                  aria-label={`Eliminar ${mesa.numero}`}
                  title="Eliminar mesa"
                  className="h-7 w-7 rounded-sm text-stone-400 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </IconButton>
              )}
            </div>
          )}
        </div>

        {/* Número de mesa */}
        <h3
          className="truncate font-serif text-2xl sm:text-3xl font-semibold tracking-wide text-stone-100"
          title={mesa.numero}
        >
          {mesa.numero}
        </h3>

        {/* Metadatos: capacidad y salón */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-amber-900/30 bg-zinc-950 px-2.5 py-0.5 text-xs font-light text-stone-300">
            <Users className="h-3.5 w-3.5 text-amber-500/70" aria-hidden="true" />
            {mesa.capacidad} {mesa.capacidad === 1 ? 'silla' : 'sillas'}
          </span>

          {mesa.ubicacion && mesa.ubicacion.trim() !== '' && (
            <span
              className="inline-flex min-w-0 items-center gap-1.5 text-xs font-light text-stone-400"
              title={mesa.ubicacion.trim()}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-500/60" aria-hidden="true" />
              <span className="max-w-[140px] truncate">{mesa.ubicacion.trim()}</span>
            </span>
          )}
        </div>
      </div>

      {/* Acción Principal */}
      {canOperateComanda && (
        <div className="relative mt-4 border-t border-amber-900/30 pt-4">
          {mesa.estado === 'Libre' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMesa?.(mesa);
                }}
                disabled={isProcessing}
                className="flex min-h-[40px] w-full flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm bg-amber-600 px-4 py-2 text-xs font-semibold tracking-wide text-stone-950 shadow-[0_0_15px_rgba(217,119,6,0.2)] transition-all duration-200 hover:bg-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-[0.98] disabled:opacity-50 sm:text-sm border border-amber-500/40"
                title="Abrir comanda de alta cocina"
              >
                {isProcessing ? (
                  <Spinner size="sm" className="text-stone-950" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Tomar Pedido</span>
                  </>
                )}
              </button>

              {puedeDesunir && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSplit?.(mesa);
                  }}
                  disabled={isProcessing}
                  aria-label={`Desunir ${mesa.numero}`}
                  title="Desunir mesa fusionada"
                  className="flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-sm border border-rose-800/60 bg-rose-950/40 text-rose-300 transition-all duration-200 hover:bg-rose-900/50 active:scale-[0.98] disabled:opacity-50"
                >
                  <Unlink2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          ) : mesa.estado === 'Ocupada' ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMesa?.(mesa);
                }}
                disabled={isProcessing || isAccountProcessing}
                className="flex min-h-[40px] w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-zinc-950 px-4 py-2 text-xs font-medium tracking-wide text-amber-300 shadow-xs transition-all duration-200 hover:bg-zinc-850 hover:border-amber-500/60 active:scale-[0.98] disabled:opacity-50 sm:text-sm border border-amber-700/40"
                title="Consultar comanda o continuar pedido en sala"
              >
                {isProcessing ? (
                  <Spinner size="sm" className="text-amber-400" />
                ) : (
                  <>
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>Ver / Continuar Comanda</span>
                  </>
                )}
              </button>
              {onRequestAccount && canRequestAccount && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void onRequestAccount(mesa);
                  }}
                  disabled={isProcessing || isAccountProcessing}
                  className="flex min-h-[40px] w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-amber-700/50 bg-amber-950/40 px-4 py-2 text-xs font-medium tracking-wide text-amber-200 transition-all duration-200 hover:bg-amber-900/50 active:scale-[0.98] disabled:opacity-50 sm:text-sm shadow-xs"
                  title="Solicitar la cuenta de la comanda"
                >
                  {isAccountProcessing ? (
                    <Spinner size="sm" className="text-amber-200" />
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>Solicitar Cuenta</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectMesa?.(mesa);
              }}
              disabled={isProcessing}
              className="flex min-h-[40px] w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-amber-600 px-4 py-2 text-xs font-semibold tracking-wide text-stone-950 shadow-[0_0_15px_rgba(217,119,6,0.3)] transition-all duration-200 hover:bg-amber-500 active:scale-[0.98] disabled:opacity-50 sm:text-sm border border-amber-500/40"
              title="Consultar comanda con cuenta solicitada"
            >
              {isProcessing ? (
                <Spinner size="sm" className="text-stone-950" />
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Ver Cuenta</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
