import React, { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Spinner } from './spinner';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className = '',
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      icon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-sm transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-amber-500/60 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97] cursor-pointer shrink-0';

    const variantClasses = {
      primary:
        'bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold shadow-[0_0_12px_rgba(217,119,6,0.25)] border border-amber-500/40',
      secondary:
        'bg-zinc-900 text-stone-200 hover:bg-zinc-800 border border-amber-700/30',
      outline:
        'border border-amber-700/30 text-stone-300 hover:bg-amber-950/20 hover:border-amber-600/50 hover:text-amber-300',
      ghost:
        'text-stone-400 hover:text-amber-400 hover:bg-zinc-900/60 border border-transparent',
      danger:
        'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 border border-transparent',
    };

    const sizeClasses = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-9 h-9 text-sm',
      lg: 'w-10 h-10 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {isLoading ? <Spinner size="sm" /> : icon || children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
