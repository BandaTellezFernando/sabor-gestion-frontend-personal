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
  iconColor = 'text-amber-600 dark:text-amber-400',
  iconBgColor = 'bg-amber-50 dark:bg-amber-950/40',
  className = '',
}: StatCardProps) {
  return (
    <Card className={`overflow-hidden transition-all duration-150 hover:border-zinc-300 dark:hover:border-zinc-700 ${className}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {label}
          </span>
          <div className={`p-2 rounded-lg ${iconBgColor} ${iconColor} shrink-0`} aria-hidden="true">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-50">
            {value}
          </span>
        </div>
        {description && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
