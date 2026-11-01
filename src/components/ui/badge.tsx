import React, { HTMLAttributes } from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'info'
  | 'danger'
  | 'neutral'
  | 'admin'
  | 'mesero'
  | 'cajero'
  | 'cocinero'
  | 'mesa-libre'
  | 'mesa-ocupada'
  | 'mesa-cuenta-solicitada'
  | 'pedido-abierto'
  | 'pedido-en-preparacion'
  | 'pedido-entregado'
  | 'pedido-cerrado'
  | 'pedido-cancelado';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({ className = '', variant = 'neutral', dot = false, children, ...props }: BadgeProps) {
  const variantClasses: Record<BadgeVariant, { container: string; dot: string }> = {
    // Genéricos
    success: {
      container: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/40',
      dot: 'bg-emerald-400',
    },
    warning: {
      container: 'bg-amber-950/70 text-amber-300 border-amber-700/40',
      dot: 'bg-amber-400',
    },
    info: {
      container: 'bg-zinc-900 text-stone-200 border-amber-700/30',
      dot: 'bg-amber-400',
    },
    danger: {
      container: 'bg-rose-950/70 text-rose-300 border-rose-800/40',
      dot: 'bg-rose-400',
    },
    neutral: {
      container: 'bg-zinc-900 text-stone-300 border-stone-800',
      dot: 'bg-stone-500',
    },
    // Roles de Usuario Fine Dining
    admin: {
      container: 'bg-amber-950/60 text-amber-300 border-amber-600/40 shadow-[0_0_10px_rgba(217,119,6,0.15)]',
      dot: 'bg-amber-400',
    },
    mesero: {
      container: 'bg-zinc-900 text-stone-200 border-amber-700/30',
      dot: 'bg-stone-400',
    },
    cajero: {
      container: 'bg-stone-900 text-amber-200 border-amber-700/40',
      dot: 'bg-amber-400',
    },
    cocinero: {
      container: 'bg-stone-900 text-stone-300 border-stone-700',
      dot: 'bg-amber-600',
    },
    // Estados de Mesa
    'mesa-libre': {
      container: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
      dot: 'bg-emerald-400',
    },
    'mesa-ocupada': {
      container: 'bg-amber-950/70 text-amber-300 border-amber-600/50 shadow-[0_0_12px_rgba(217,119,6,0.2)]',
      dot: 'bg-amber-400',
    },
    'mesa-cuenta-solicitada': {
      container: 'bg-amber-900/60 text-amber-200 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
      dot: 'bg-amber-300',
    },
    // Estados de Pedido
    'pedido-abierto': {
      container: 'bg-zinc-900 text-stone-300 border-amber-700/30',
      dot: 'bg-stone-400',
    },
    'pedido-en-preparacion': {
      container: 'bg-amber-950/60 text-amber-300 border-amber-600/40',
      dot: 'bg-amber-400',
    },
    'pedido-entregado': {
      container: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
      dot: 'bg-emerald-400',
    },
    'pedido-cerrado': {
      container: 'bg-zinc-950 text-stone-400 border-stone-800',
      dot: 'bg-stone-500',
    },
    'pedido-cancelado': {
      container: 'bg-rose-950/50 text-rose-300 border-rose-900/40',
      dot: 'bg-rose-400',
    },
  };

  const current = variantClasses[variant] || variantClasses.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-[11px] font-medium tracking-wide border ${current.container} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${current.dot} shrink-0`} aria-hidden="true" />}
      {children}
    </span>
  );
}
