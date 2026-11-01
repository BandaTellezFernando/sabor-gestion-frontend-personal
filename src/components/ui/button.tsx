import React, { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Spinner } from './spinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-sm transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.99] cursor-pointer select-none tracking-wide';

    const variantClasses = {
      primary:
        'bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold border border-amber-500/50 shadow-[0_0_15px_rgba(217,119,6,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]',
      secondary:
        'bg-zinc-900 hover:bg-zinc-800 text-stone-200 border border-amber-700/30 hover:border-amber-600/50 shadow-xs',
      success:
        'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-800/50 shadow-xs',
      outline:
        'border border-amber-700/40 text-stone-200 hover:bg-amber-950/30 hover:border-amber-500/60 shadow-xs',
      ghost:
        'text-stone-300 hover:text-amber-400 hover:bg-zinc-900/60 border border-transparent',
      danger:
        'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/50 shadow-xs',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[32px]',
      md: 'px-4 py-2 text-sm gap-2 min-h-[38px]',
      lg: 'px-5 py-2.5 text-base gap-2.5 min-h-[44px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <>
            {leftIcon && <span className="shrink-0 inline-flex items-center" aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0 inline-flex items-center" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
