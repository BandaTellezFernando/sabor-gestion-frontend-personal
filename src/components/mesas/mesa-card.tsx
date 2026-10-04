'use client';

import React, { useState } from 'react';
import { Mesa, EstadoMesa, RolUsuario } from '@/types';
import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/ui/icon-button';
import { Users, MapPin, Pencil, Trash2, Check, Clock, UtensilsCrossed, Plus } from 'lucide-react';
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
  onStateChange,
  onSelectMesa,
  isProcessing = false,
}: MesaCardProps) {
  const [isChangingState, setIsChangingState] = useState(false);

  const canChangeState = userRole === 'Administrador' || userRole === 'Mesero';
  const canManage = userRole === 'Administrador';
  const canOperateComanda = userRole === 'Mesero' || userRole === 'Administrador';

  const handleStateSelect = async (nuevoEstado: EstadoMesa, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!onStateChange || nuevoEstado === mesa.estado || isChangingState) return;
    setIsChangingState(true);
    try {
      await onStateChange(mesa, nuevoEstado);
    } finally {
      setIsChangingState(false);
    }
  };

  const formatBadge = (estado: EstadoMesa) => {
    switch (estado) {
      case 'Libre':
        return (
          <Badge variant="mesa-libre" dot className="px-2.5 py-0.5 text-xs font-semibold">
            Disponible
          </Badge>
        );
      case 'Ocupada':
        return (
          <Badge variant="mesa-ocupada" dot className="px-2.5 py-0.5 text-xs font-semibold">
            Ocupada
          </Badge>
        );
      case 'Cuenta Solicitada':
        return (
          <Badge variant="mesa-cuenta-solicitada" dot className="px-2.5 py-0.5 text-xs font-semibold">
            Esperando pago
          </Badge>
        );
      default:
        return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  // Estilos de borde y superficie según estado
  const getCardStyle = () => {
    switch (mesa.estado) {
      case 'Libre':
        return 'border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-800/60 bg-white dark:bg-zinc-900';
      case 'Ocupada':
        return 'border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/30 to-white dark:from-amber-950/20 dark:to-zinc-900';
      case 'Cuenta Solicitada':
        return 'border-sky-200 dark:border-sky-900/50 bg-gradient-to-br from-sky-50/30 to-white dark:from-sky-950/20 dark:to-zinc-900';
      default:
        return 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900';
    }
  };

  return (
    <div
      onClick={() => {
        if (canOperateComanda && onSelectMesa && !isProcessing) {
          onSelectMesa(mesa);
        }
      }}
      className={`rounded-xl border shadow-xs transition-all duration-200 flex flex-col justify-between p-4 relative group ${
        canOperateComanda ? 'cursor-pointer hover:shadow-md' : ''
      } ${getCardStyle()}`}
      data-mesa-id={mesa._id}
    >
      {/* Cabecera de la Tarjeta */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-50 truncate" title={mesa.numero}>
              {mesa.numero}
            </h3>
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            {formatBadge(mesa.estado)}

            {canManage && (
              <div className="flex items-center ml-1">
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
                    className="h-7 w-7 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
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
                    className="h-7 w-7 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </IconButton>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metadatos: Capacidad y Ubicación */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
            <span>Capacidad: <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{mesa.capacidad}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
            <span className="truncate max-w-[130px]">{mesa.ubicacion || 'Salón principal'}</span>
          </div>
        </div>

        {/* Acción Operativa Principal de Comanda (Mesero / Admin) */}
        {canOperateComanda && (
          <div className="mb-3">
            {mesa.estado === 'Libre' ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMesa?.(mesa);
                }}
                disabled={isProcessing}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50 min-h-[38px]"
                title="Ocupar mesa temporalmente y abrir comanda"
              >
                {isProcessing ? (
                  <Spinner size="sm" className="text-white" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
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
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50 min-h-[38px]"
                title="Consultar comanda o pedido en curso"
              >
                {isProcessing ? (
                  <Spinner size="sm" className="text-amber-600" />
                ) : (
                  <>
                    <UtensilsCrossed className="w-3.5 h-3.5" />
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
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50 min-h-[38px]"
                title="Consultar comanda con cuenta solicitada"
              >
                {isProcessing ? (
                  <Spinner size="sm" className="text-sky-600" />
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Ver Pedido (Cuenta)</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Control Operativo de Estado (Mesero / Administrador) */}
      {canChangeState && (
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Cambiar Estado:
            </span>
            {isChangingState && <Spinner size="sm" className="text-amber-600" />}
          </div>

          <div className="grid grid-cols-3 gap-1" role="group" aria-label={`Cambiar estado de ${mesa.numero}`}>
            <button
              type="button"
              disabled={isChangingState || mesa.estado === 'Libre'}
              onClick={(e) => handleStateSelect('Libre', e)}
              className={`py-1.5 px-2 text-[11px] font-medium rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                mesa.estado === 'Libre'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 disabled:opacity-50'
              }`}
              title="Marcar como Disponible"
            >
              <Check className="w-3 h-3" />
              <span>Libre</span>
            </button>

            <button
              type="button"
              disabled={isChangingState || mesa.estado === 'Ocupada'}
              onClick={(e) => handleStateSelect('Ocupada', e)}
              className={`py-1.5 px-2 text-[11px] font-medium rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                mesa.estado === 'Ocupada'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 disabled:opacity-50'
              }`}
              title="Marcar como Ocupada"
            >
              <UtensilsCrossed className="w-3 h-3" />
              <span>Ocupada</span>
            </button>

            <button
              type="button"
              disabled={isChangingState || mesa.estado === 'Cuenta Solicitada'}
              onClick={(e) => handleStateSelect('Cuenta Solicitada', e)}
              className={`py-1.5 px-2 text-[11px] font-medium rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                mesa.estado === 'Cuenta Solicitada'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-700 disabled:opacity-50'
              }`}
              title="Marcar como Esperando Pago"
            >
              <Clock className="w-3 h-3" />
              <span>Cuenta</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
