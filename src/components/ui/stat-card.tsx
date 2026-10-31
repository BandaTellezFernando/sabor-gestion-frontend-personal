import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './card';

export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconColor = 'text-amber-500',
  iconBgColor = 'bg-amber-950/40 border border-amber-800/40',
  className = '',
}: StatCardProps) {
  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:border-amber-600/40 hover:shadow-[0_0_15px_rgba(217,119,6,0.12)] bg-zinc-900 ${className}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-stone-400 tracking-widest uppercase">
            {label}
          </span>
          <div className={`p-2 rounded-sm ${iconBgColor} ${iconColor} shrink-0`} aria-hidden="true">
            <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline">
          <span className="font-serif text-2xl sm:text-3xl font-semibold tracking-wide text-stone-100">
            {value}
          </span>
        </div>
        {description && (
          <p className="mt-1 text-xs text-stone-400 font-light leading-normal">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
