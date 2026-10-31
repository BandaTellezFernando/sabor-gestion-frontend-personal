//src/components/cocina/cocina-card.tsx
'use client';

import React from 'react';
import { Pedido, Mesa, DetallePedido } from '@/types';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, CheckCircle2, ChefHat, Flame } from 'lucide-react';

export interface CocinaCardProps {
  pedido: Pedido;
  onAdvance?: (pedido: Pedido) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

function getMesaLabel(mesa: string | Mesa | undefined): string {
  if (!mesa) return 'Mesa';
  if (typeof mesa === 'object' && mesa !== null && 'numero' in mesa) {
    return `Mesa ${mesa.numero}`;
  }
  if (typeof mesa === 'string') {
    if (/^[0-9a-fA-F]{24}$/.test(mesa)) return `Mesa (${mesa.slice(-4)})`;
    return mesa.toLowerCase().startsWith('mesa') ? mesa : `Mesa ${mesa}`;
  }
  return 'Mesa';
}

function getPlatoNombre(detalle: DetallePedido): string {
  if (detalle.nombrePlato) return detalle.nombrePlato;
  if (typeof detalle.plato === 'object' && detalle.plato !== null && 'nombre' in detalle.plato) {
    return detalle.plato.nombre;
  }
  return 'Plato';
}

export function CocinaCard({
  pedido,
  onAdvance,
  isLoading = false,
  disabled = false,
}: CocinaCardProps) {
  const isPendiente =
    pedido.estado === 'PENDIENTE' || pedido.estado === 'ABIERTO';

  const isEnPreparacion = pedido.estado === 'EN_PREPARACION';

  const isListo =
    pedido.estado === 'LISTO' || pedido.estado === 'ENTREGADO';

  const isInteractive =
    (isPendiente || isEnPreparacion) && !isLoading && !disabled;

  const handleClick = () => {
    if (!isInteractive || !onAdvance) return;
    onAdvance(pedido);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isInteractive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAdvance?.(pedido);
    }
  };

  const getContainerStyles = () => {
    if (isPendiente) {
      return 'border-amber-700/30 bg-zinc-900 hover:border-amber-500/70 hover:shadow-[0_0_15px_rgba(217,119,6,0.15)] active:scale-[0.99] cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-500';
    }
    if (isEnPreparacion) {
      return 'border-amber-600/60 bg-gradient-to-b from-amber-950/25 to-zinc-900 shadow-[0_0_15px_rgba(217,119,6,0.15)] hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] active:scale-[0.99] cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-500';
    }
    // LISTO
    return 'border-emerald-800/40 bg-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.12)] cursor-default';
  };

  return (
    <div
      role={isInteractive ? 'button' : 'region'}
      tabIndex={isInteractive ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={
        isPendiente
          ? `Comanda ${pedido.codigo} para ${getMesaLabel(pedido.mesa)}. Tocar para iniciar preparación.`
          : isEnPreparacion
          ? `Comanda ${pedido.codigo} para ${getMesaLabel(pedido.mesa)}. Tocar para marcar como listo.`
          : `Comanda ${pedido.codigo} para ${getMesaLabel(pedido.mesa)}. Listo para recoger.`
      }
      aria-disabled={isLoading || disabled}
      className={`relative rounded-sm border p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between select-none shadow-[0_4px_20px_rgba(0,0,0,0.6)] outline-none ${getContainerStyles()}`}
    >
      {/* Contenido Principal */}
      <div className="space-y-3.5">
        {/* Encabezado: Código y Mesa */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-amber-900/30">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg sm:text-xl font-bold text-amber-400 tracking-tight">
              {pedido.codigo}
            </span>
          </div>

          <div className="px-3 py-1 rounded-sm bg-zinc-950 border border-amber-600/40 text-stone-100 font-serif text-xs sm:text-sm font-semibold shadow-xs">
            {getMesaLabel(pedido.mesa)}
          </div>
        </div>

        {/* Lista de Platos y Cantidades */}
        <div className="space-y-2">
          {(pedido.detalles || []).map((detalle, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-2.5 rounded-sm bg-zinc-950/70 border border-amber-900/20"
            >
              {/* Badge de Cantidad destacada */}
              <div className="w-7 h-7 rounded-sm bg-amber-950/70 text-amber-300 border border-amber-700/40 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                {detalle.cantidad}
              </div>

              {/* Nombre y Observaciones Culinarias */}
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="font-serif text-sm sm:text-base font-medium text-stone-100 leading-snug">
                  {getPlatoNombre(detalle)}
                </p>

                {detalle.observacion && detalle.observacion.trim() !== '' && (
                  <div className="mt-1.5 flex items-start gap-1.5 p-1.5 rounded-sm bg-amber-950/40 border border-amber-800/40 text-amber-200 text-xs font-light">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                    <span>{detalle.observacion.trim()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicador de Acción o Estado al Pie */}
      <div className="pt-3.5 mt-3 border-t border-amber-900/30">
        {isPendiente && (
          <div className="flex items-center justify-between text-stone-300 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <ChefHat className="w-4 h-4 text-amber-500" />
              <span>Pendiente</span>
            </span>
            <span className="text-[11px] font-medium bg-zinc-950 text-amber-300 border border-amber-700/40 px-2 py-0.5 rounded-sm">
              Toca para cocinar →
            </span>
          </div>
        )}

        {isEnPreparacion && (
          <div className="flex items-center justify-between text-amber-300 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>En Preparación</span>
            </span>
            <span className="text-[11px] font-medium bg-amber-600 text-stone-950 px-2 py-0.5 rounded-sm font-semibold shadow-[0_0_10px_rgba(217,119,6,0.25)]">
              Marcar como listo ✓
            </span>
          </div>
        )}

        {isListo && (
          <div className="flex items-center justify-between text-emerald-300 text-xs font-medium bg-emerald-950/50 p-2 rounded-sm border border-emerald-800/50">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Listo para sala</span>
            </span>
            <span className="text-[11px] font-light text-stone-400">
              Avisado a sommelier/mesero
            </span>
          </div>
        )}
      </div>

      {/* Overlay de Carga */}
      {isLoading && (
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xs rounded-sm flex flex-col items-center justify-center gap-2 z-10 animate-in fade-in duration-100">
          <Spinner size="md" className="text-amber-500" />
          <span className="text-xs font-medium tracking-wide text-stone-200">
            Actualizando pase...
          </span>
        </div>
      )}
    </div>
  );
}
