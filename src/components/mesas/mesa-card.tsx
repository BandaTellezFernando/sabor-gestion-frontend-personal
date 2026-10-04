'use client';

import React from 'react';
import { Mesa, EstadoMesa, RolUsuario } from '@/types';
import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/ui/icon-button';
import { Users, MapPin, Pencil, Trash2, Plus, UtensilsCrossed, Receipt } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

export interface MesaCardProps {
  mesa: Mesa;
  userRole: RolUsuario;
  onEdit?: (mesa: Mesa) => void;
  onDelete?: (mesa: Mesa) => void;
  onStateChange?: (mesa: Mesa, nuevoEstado: EstadoMesa) => Promise<void>;
  onSelectMesa?: (mesa: Mesa) => void;
  isProcessing?: boolean;
}

export function MesaCard({
  mesa,
  userRole,
  onEdit,
  onDelete,
  onSelectMesa,
  isProcessing = false,
}: MesaCardProps) {
  const canManage = userRole === 'Administrador';
  const canOperateComanda = userRole === 'Mesero' || userRole === 'Administrador';

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

  // Contenedor según estado del backend
  const getCardStyle = () => {
    switch (mesa.estado) {
      case 'Libre':
        return 'border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-b from-[#F0FDF4]/30 via-white to-white dark:from-emerald-950/20 dark:via-[#201E1B] dark:to-[#201E1B] hover:border-emerald-400 dark:hover:border-emerald-700';
      case 'Ocupada':
        return 'border-[#C84B26]/30 dark:border-[#C84B26]/40 bg-gradient-to-b from-[#FFF5EF]/50 via-white to-white dark:from-[#2A1E18]/40 dark:via-[#201E1B] dark:to-[#201E1B] hover:border-[#C84B26]/60 dark:hover:border-[#C84B26]/70';
      case 'Cuenta Solicitada':
        return 'border-amber-300 dark:border-amber-800 bg-gradient-to-b from-amber-50/50 via-white to-white dark:from-amber-950/30 dark:via-[#201E1B] dark:to-[#201E1B] hover:border-amber-400 dark:hover:border-amber-700';
      default:
        return 'border-stone-200 dark:border-stone-800 bg-white dark:bg-[#201E1B]';
    }
  };

  return (
    <div
      onClick={() => {
        if (canOperateComanda && onSelectMesa && !isProcessing) {
          onSelectMesa(mesa);
        }
      }}
      role={canOperateComanda ? 'button' : 'region'}
      tabIndex={canOperateComanda ? 0 : -1}
      onKeyDown={(e) => {
        if (canOperateComanda && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelectMesa?.(mesa);
        }
      }}
      aria-label={`${mesa.numero}. Estado: ${
        mesa.estado === 'Libre' ? 'Disponible' : mesa.estado === 'Ocupada' ? 'Ocupada' : 'Esperando pago'
      }. Capacidad: ${mesa.capacidad} personas.`}
      className={`rounded-2xl border-2 shadow-xs transition-all duration-200 flex flex-col justify-between p-5 relative select-none ${
        canOperateComanda
          ? 'cursor-pointer hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05A36]'
          : ''
      } ${getCardStyle()}`}
      data-mesa-id={mesa._id}
    >
      {/* Contenido Superior */}
      <div className="space-y-3.5">
        {/* Cabecera: Nombre de Mesa y Badge de Estado */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800/80">
          <div className="min-w-0">
            <h3
              className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-50 truncate tracking-tight"
              title={mesa.numero}
            >
              {mesa.numero}
            </h3>
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            {formatBadge(mesa.estado)}

            {/* Acciones de Administrador (Editar y Eliminar discretos) */}
            {canManage && (
              <div className="flex items-center ml-1" onClick={(e) => e.stopPropagation()}>
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
                    className="h-8 w-8 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
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
                    className="h-8 w-8 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </IconButton>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metadatos Claros y Discretos: Capacidad y Ubicación Real */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-1.5 font-medium">
            <Users className="w-4 h-4 text-stone-400 dark:text-stone-500" aria-hidden="true" />
            <span>
              Capacidad:{' '}
              <strong className="text-stone-800 dark:text-stone-200 font-bold">
                {mesa.capacidad} {mesa.capacidad === 1 ? 'persona' : 'personas'}
              </strong>
            </span>
          </div>

          {mesa.ubicacion && mesa.ubicacion.trim() !== '' && (
            <div className="flex items-center gap-1.5 font-medium min-w-0">
              <MapPin className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[140px]" title={mesa.ubicacion}>
                {mesa.ubicacion.trim()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Acción Principal Única y Destacada (Mesero / Admin) */}
      {canOperateComanda && (
        <div className="pt-4 mt-3 border-t border-stone-100 dark:border-stone-800/80">
          {mesa.estado === 'Libre' ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectMesa?.(mesa);
              }}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 min-h-[42px] cursor-pointer"
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
          ) : mesa.estado === 'Ocupada' ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectMesa?.(mesa);
              }}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#C84B26] hover:bg-[#B23D1B] active:bg-[#9B3214] text-white shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 min-h-[42px] cursor-pointer"
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
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectMesa?.(mesa);
              }}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 min-h-[42px] cursor-pointer"
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
