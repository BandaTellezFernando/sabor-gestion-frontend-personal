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
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer select-none';

    const variantClasses = {
      primary: 'bg-[#C84B26] text-white hover:bg-[#B23D1B] active:bg-[#9B3214] shadow-xs border border-transparent focus:ring-[#E05A36]',
      secondary: 'bg-stone-100 text-stone-900 hover:bg-stone-200 active:bg-stone-300 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 focus:ring-stone-400',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-xs border border-transparent focus:ring-emerald-500',
      outline: 'border border-stone-300 text-stone-800 hover:bg-stone-50 active:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800 focus:ring-stone-400',
      ghost: 'text-stone-700 hover:bg-stone-100 active:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800 border border-transparent focus:ring-stone-400',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs border border-transparent focus:ring-rose-500',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[34px]',
      md: 'px-4 py-2 text-sm gap-2 min-h-[40px]',
      lg: 'px-5 py-2.5 text-base gap-2.5 min-h-[46px]',
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
