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
  const isAbierto = pedido.estado === 'ABIERTO';
  const isEnPreparacion = pedido.estado === 'EN_PREPARACION';
  const isListo = pedido.estado === 'ENTREGADO';

  const isInteractive = (isAbierto || isEnPreparacion) && !isLoading && !disabled;

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
    if (isAbierto) {
      return 'border-sky-300 dark:border-sky-800 bg-white dark:bg-stone-900 hover:border-sky-500 dark:hover:border-sky-400 hover:shadow-md active:scale-[0.99] cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500';
    }
    if (isEnPreparacion) {
      return 'border-amber-300 dark:border-amber-800 bg-gradient-to-b from-amber-50/30 to-white dark:from-amber-950/20 dark:to-stone-900 hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-md active:scale-[0.99] cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500';
    }
    // LISTO (inerte)
    return 'border-emerald-300 dark:border-emerald-800 bg-gradient-to-b from-emerald-50/30 to-white dark:from-emerald-950/20 dark:to-stone-900 cursor-default';
  };

  return (
    <div
      role={isInteractive ? 'button' : 'region'}
      tabIndex={isInteractive ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={
        isAbierto
          ? `Comanda ${pedido.codigo} para ${getMesaLabel(pedido.mesa)}. Tocar para iniciar preparación.`
          : isEnPreparacion
          ? `Comanda ${pedido.codigo} para ${getMesaLabel(pedido.mesa)}. Tocar para marcar como listo.`
          : `Comanda ${pedido.codigo} para ${getMesaLabel(pedido.mesa)}. Listo para recoger.`
      }
      aria-disabled={isLoading || disabled}
      className={`relative rounded-3xl border-2 p-4 sm:p-5 transition-all duration-150 flex flex-col justify-between select-none shadow-xs outline-hidden ${getContainerStyles()}`}
    >
      {/* Contenido Principal */}
      <div className="space-y-3.5">
        {/* Encabezado: Código y Mesa */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800/80">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              {pedido.codigo}
            </span>
          </div>

          <div className="px-3 py-1 rounded-xl bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-xs sm:text-sm font-bold shadow-xs">
            {getMesaLabel(pedido.mesa)}
          </div>
        </div>

        {/* Lista de Platos y Cantidades */}
        <div className="space-y-2.5">
          {(pedido.detalles || []).map((detalle, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-2.5 rounded-2xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800/60"
            >
              {/* Badge de Cantidad destacada */}
              <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary border border-primary/30 font-black text-base flex items-center justify-center shrink-0">
                {detalle.cantidad}
              </div>

              {/* Nombre y Observaciones Culinarias */}
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {getPlatoNombre(detalle)}
                </p>

                {detalle.observacion && detalle.observacion.trim() !== '' && (
                  <div className="mt-1 flex items-start gap-1.5 p-1.5 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>{detalle.observacion.trim()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicador de Acción o Estado al Pie */}
      <div className="pt-4 mt-3 border-t border-stone-100 dark:border-stone-800/80">
        {isAbierto && (
          <div className="flex items-center justify-between text-sky-700 dark:text-sky-300 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <ChefHat className="w-4 h-4" />
              <span>Pendiente</span>
            </span>
            <span className="text-[11px] font-medium bg-sky-100 dark:bg-sky-950/60 px-2 py-0.5 rounded-md">
              Toca para cocinar
            </span>
          </div>
        )}

        {isEnPreparacion && (
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>En Preparación</span>
            </span>
            <span className="text-[11px] font-medium bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
              Toca para marcar listo
            </span>
          </div>
        )}

        {isListo && (
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs font-bold bg-emerald-100/60 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Listo para recoger</span>
            </span>
            <span className="text-[11px] font-medium opacity-75">
              Avisado a mesero
            </span>
          </div>
        )}
      </div>

      {/* Overlay de Carga mientras se procesa la transición */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/75 dark:bg-zinc-900/75 backdrop-blur-2xs rounded-2xl flex flex-col items-center justify-center gap-2 z-10 animate-in fade-in duration-100">
          <Spinner size="md" className="text-amber-600" />
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
            Actualizando...
          </span>
        </div>
      )}
    </div>
  );
}
