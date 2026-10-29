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
  /** Borde y fondo de la tarjeta. */
  card: string;
  /** Barra superior y acento del número. */
  accent: string;
  /** Halo difuminado decorativo. */
  halo: string;
  /** Halo del badge de estado. */
  badgeGlow: string;
}

const ESTADO_VISUAL: Record<EstadoMesa, EstadoVisual> = {
  Libre: {
    card: 'border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-b from-emerald-50/50 via-white to-white dark:from-emerald-950/25 dark:via-[#1A1816] dark:to-[#1A1816] hover:border-emerald-400 dark:hover:border-emerald-600',
    accent: 'from-emerald-400 via-emerald-500/60 to-transparent',
    halo: 'bg-emerald-400/15',
    badgeGlow: 'bg-emerald-400/40',
  },
  Ocupada: {
    card: 'border-[#C84B26]/30 dark:border-[#C84B26]/40 bg-gradient-to-b from-[#FFF5EF]/70 via-white to-white dark:from-[#2A1E18]/60 dark:via-[#1A1816] dark:to-[#1A1816] hover:border-[#C84B26]/60 dark:hover:border-[#C84B26]/70',
    accent: 'from-[#C84B26] via-[#E05A36]/60 to-transparent',
    halo: 'bg-[#C84B26]/25',
    badgeGlow: 'bg-rose-500/40',
  },
  'Cuenta Solicitada': {
    card: 'border-amber-300 dark:border-amber-800/80 bg-gradient-to-b from-amber-50/70 via-white to-white dark:from-amber-950/30 dark:via-[#1A1816] dark:to-[#1A1816] hover:border-amber-400 dark:hover:border-amber-600',
    accent: 'from-amber-400 via-amber-500/60 to-transparent',
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
  // Solo una mesa fusionada y libre puede volver a separarse.
  const puedeDesunir =
    canManage && !!onSplit && mesa.estado === 'Libre' && esMesaFusionada(mesa);

  // Badge correspondiente al estado real del backend
  const formatBadge = (estado: EstadoMesa) => {
    switch (estado) {
      case 'Libre':
        return (
          <Badge variant="mesa-libre" dot className="px-3 py-1 text-xs font-bold">
            Disponible
          </Badge>
        );
      case 'Ocupada':
        return (
          <Badge variant="mesa-ocupada" dot className="px-3 py-1 text-xs font-bold">
            Ocupada
          </Badge>
        );
      case 'Cuenta Solicitada':
        return (
          <Badge variant="mesa-cuenta-solicitada" dot className="px-3 py-1 text-xs font-bold">
            Esperando pago
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
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-900/20 select-none ${
        canOperateComanda
          ? 'cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05A36]'
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

      {/* Halo decorativo: pulso muy suave mientras la mesa está en servicio */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full blur-2xl transition-opacity duration-500 ${visual.halo} ${
          enServicio
            ? 'animate-pulse opacity-90 [animation-duration:3.5s]'
            : 'opacity-60 group-hover:opacity-100'
        }`}
      />

      <div className="relative space-y-4">
        {/* Cabecera: Estado brillante + acciones de administración */}
        <div className="flex items-start justify-between gap-2">
          <span className="relative inline-flex shrink-0">
            {enServicio && (
              <span
                aria-hidden="true"
                className={`absolute inset-0 rounded-full blur-md animate-pulse [animation-duration:3s] ${visual.badgeGlow}`}
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
                  className="h-8 w-8 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
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
                  className="h-8 w-8 rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </IconButton>
              )}
            </div>
          )}
        </div>

        {/* Número de mesa como protagonista visual */}
        <h3
          className="truncate text-2xl font-black leading-tight tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50"
          title={mesa.numero}
        >
          {mesa.numero}
        </h3>

        {/* Metadatos: capacidad como badge y ubicación discreta */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200/90 bg-stone-100/80 px-2.5 py-1 text-xs font-bold text-stone-700 transition-colors duration-200 group-hover:border-stone-300 dark:border-stone-700 dark:bg-stone-800/80 dark:text-stone-200">
            <Users className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500" aria-hidden="true" />
            {mesa.capacidad} {mesa.capacidad === 1 ? 'silla' : 'sillas'}
          </span>

          {mesa.ubicacion && mesa.ubicacion.trim() !== '' && (
            <span
              className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400"
              title={mesa.ubicacion.trim()}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-stone-500" aria-hidden="true" />
              <span className="max-w-[140px] truncate">{mesa.ubicacion.trim()}</span>
            </span>
          )}
        </div>
      </div>

      {/* Acción Principal Única y Destacada (Mesero / Admin) */}
      {canOperateComanda && (
        <div className="relative mt-4 border-t border-stone-200/70 pt-4 dark:border-stone-800/80">
          {mesa.estado === 'Libre' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMesa?.(mesa);
                }}
                disabled={isProcessing}
                className="flex min-h-[42px] w-full flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all duration-200 hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-900/20 active:scale-[0.98] active:bg-emerald-800 disabled:opacity-50 sm:text-sm"
                title="Ocupar mesa temporalmente y abrir comanda"
              >
                {isProcessing ? (
                  <Spinner size="sm" className="text-white" />
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
                  className="flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-500 transition-all duration-200 hover:border-[#C84B26]/50 hover:bg-[#C84B26]/10 hover:text-[#C84B26] active:scale-[0.98] disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-400 dark:hover:bg-[#C84B26]/20 dark:hover:text-[#E05A36]"
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
                className="flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#C84B26] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all duration-200 hover:bg-[#B23D1B] hover:shadow-md hover:shadow-orange-900/25 active:scale-[0.98] active:bg-[#9B3214] disabled:opacity-50 sm:text-sm"
                title="Consultar comanda o continuar pedido en salón"
              >
                {isProcessing ? (
                  <Spinner size="sm" className="text-white" />
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
                  className="flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 transition-all duration-200 hover:bg-amber-100 hover:shadow-sm active:bg-amber-200 disabled:opacity-50 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/70 sm:text-sm"
                  title="Solicitar la cuenta de la comanda existente"
                >
                  {isAccountProcessing ? (
                    <Spinner size="sm" className="text-amber-800 dark:text-amber-200" />
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>Solicitar cuenta</span>
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
              className="flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 shadow-xs transition-all duration-200 hover:bg-amber-600 hover:shadow-md hover:shadow-amber-900/25 active:scale-[0.98] active:bg-amber-700 disabled:opacity-50 sm:text-sm"
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
