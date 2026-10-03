import React from 'react';
import { Cat } from 'lucide-react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
  textClassName?: string;
}

const sizeConfig = {
  sm: {
    container: 'w-8 h-8 rounded-lg',
    icon: 'w-4 h-4',
    title: 'text-sm font-bold tracking-tight',
    sub: 'text-[10px]',
  },
  md: {
    container: 'w-10 h-10 rounded-xl',
    icon: 'w-5 h-5',
    title: 'text-base font-bold tracking-tight',
    sub: 'text-xs',
  },
  lg: {
    container: 'w-12 h-12 rounded-xl',
    icon: 'w-6 h-6',
    title: 'text-lg font-bold tracking-tight',
    sub: 'text-xs',
  },
  xl: {
    container: 'w-14 h-14 rounded-2xl',
    icon: 'w-8 h-8',
    title: 'text-xl font-bold tracking-tight',
    sub: 'text-xs',
  },
};

export function BrandLogo({
  size = 'md',
  showText = false,
  subtitle = 'Sistema de Gestión Gastronómica',
  className = '',
  textClassName = '',
}: BrandLogoProps) {
  const config = sizeConfig[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Contenedor del Emblema Felino Terracota */}
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-xs shrink-0 select-none ${config.container}`}
        aria-hidden="true"
      >
        <Cat className={`${config.icon} stroke-[2.2]`} />
      </div>

      {showText && (
        <div className={`flex flex-col leading-tight ${textClassName}`}>
          <span className={`text-zinc-900 dark:text-zinc-50 ${config.title}`}>
            Mishi-Food
          </span>
          {subtitle && (
            <span className={`text-zinc-500 dark:text-zinc-400 font-medium ${config.sub}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
