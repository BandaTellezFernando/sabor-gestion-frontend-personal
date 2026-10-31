import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  isHoverable?: boolean;
}

export function Card({ className = '', isHoverable = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-zinc-900 border border-amber-700/25 rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-200 ${
        isHoverable
          ? 'hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(217,119,6,0.15)]'
          : ''
      } ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 sm:p-5 border-b border-amber-900/30 ${className}`} {...props} />;
}

export function CardTitle({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`font-serif text-base sm:text-lg font-semibold text-stone-100 tracking-wide ${className}`}
      {...props}
    />
  );
}

export function CardDescription({ className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-xs sm:text-sm text-stone-400 font-light mt-1 ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 sm:p-5 ${className}`} {...props} />;
}

export function CardFooter({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`p-4 sm:p-5 border-t border-amber-900/30 bg-zinc-950/60 ${className}`}
      {...props}
    />
  );
}
