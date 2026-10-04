import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  isHoverable?: boolean;
}

export function Card({ className = '', isHoverable = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-xs overflow-hidden transition-all duration-150 ${
        isHoverable
          ? 'hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm'
          : ''
      } ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800/80 ${className}`} {...props} />;
}

export function CardTitle({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight ${className}`}
      {...props}
    />
  );
}

export function CardDescription({ className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 sm:p-5 ${className}`} {...props} />;
}

export function CardFooter({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`p-4 sm:p-5 border-t border-stone-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/50 ${className}`}
      {...props}
    />
  );
}
