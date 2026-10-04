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
      container: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    warning: {
      container: 'bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    info: {
      container: 'bg-sky-50 text-sky-800 border-sky-200/90 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
      dot: 'bg-sky-500',
    },
    danger: {
      container: 'bg-rose-50 text-rose-800 border-rose-200/90 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      dot: 'bg-rose-500',
    },
    neutral: {
      container: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
      dot: 'bg-stone-400',
    },
    // Roles de Usuario
    admin: {
      container: 'bg-[#C84B26]/10 text-[#C84B26] border-[#C84B26]/30 dark:bg-[#C84B26]/20 dark:text-[#E05A36] dark:border-[#C84B26]/40',
      dot: 'bg-[#C84B26]',
    },
    mesero: {
      container: 'bg-sky-50 text-sky-800 border-sky-200/90 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
      dot: 'bg-sky-500',
    },
    cajero: {
      container: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    cocinero: {
      container: 'bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    // Estados de Mesa (Backend)
    'mesa-libre': {
      container: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    'mesa-ocupada': {
      container: 'bg-rose-50 text-rose-800 border-rose-200/90 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      dot: 'bg-rose-500',
    },
    'mesa-cuenta-solicitada': {
      container: 'bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    // Estados de Pedido (Backend)
    'pedido-abierto': {
      container: 'bg-sky-50 text-sky-800 border-sky-200/90 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
      dot: 'bg-sky-500',
    },
    'pedido-en-preparacion': {
      container: 'bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    'pedido-entregado': {
      container: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    'pedido-cerrado': {
      container: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
      dot: 'bg-stone-400',
    },
    'pedido-cancelado': {
      container: 'bg-rose-50 text-rose-800 border-rose-200/90 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      dot: 'bg-rose-500',
    },
  };

  const current = variantClasses[variant] || variantClasses.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.container} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${current.dot} shrink-0`} aria-hidden="true" />}
      {children}
    </span>
  );
}
