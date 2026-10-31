import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
  textClassName?: string;
}

const sizeConfig = {
  sm: {
    container: 'w-8 h-8 rounded-sm',
    icon: 'w-4 h-4',
    title: 'text-sm font-serif tracking-widest',
    sub: 'text-[9px] tracking-wider',
  },
  md: {
    container: 'w-9 h-9 rounded-sm',
    icon: 'w-4.5 h-4.5',
    title: 'text-base font-serif tracking-widest',
    sub: 'text-[10px] tracking-wider',
  },
  lg: {
    container: 'w-11 h-11 rounded-sm',
    icon: 'w-5 h-5',
    title: 'text-lg font-serif tracking-widest',
    sub: 'text-[11px] tracking-wider',
  },
  xl: {
    container: 'w-14 h-14 rounded-sm',
    icon: 'w-7 h-7',
    title: 'text-2xl font-serif tracking-widest',
    sub: 'text-xs tracking-wider',
  },
};

export function BrandLogo({
  size = 'md',
  showText = false,
  subtitle = 'Alta Gastronomía',
  className = '',
  textClassName = '',
}: BrandLogoProps) {
  const config = sizeConfig[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Sello Monograma de Lujo */}
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-amber-700 via-amber-800 to-stone-950 text-amber-200 border border-amber-600/50 shadow-[0_0_15px_rgba(217,119,6,0.2)] shrink-0 select-none ${config.container}`}
        aria-hidden="true"
      >
        <UtensilsCrossed className={`${config.icon} stroke-[1.8] text-amber-300`} />
      </div>

      {showText && (
        <div className={`flex flex-col leading-tight ${textClassName}`}>
          <span className={`text-stone-100 font-semibold tracking-wide ${config.title}`}>
            Sabor & Gestión
          </span>
          {subtitle && (
            <span className={`text-amber-500/80 font-light uppercase ${config.sub}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
