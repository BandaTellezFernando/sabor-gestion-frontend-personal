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
  iconColor = 'text-[#C84B26] dark:text-[#E05A36]',
  iconBgColor = 'bg-[#C84B26]/10 dark:bg-[#C84B26]/20',
  className = '',
}: StatCardProps) {
  return (
    <Card className={`overflow-hidden transition-all duration-150 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900 ${className}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400 tracking-wide uppercase">
            {label}
          </span>
          <div className={`p-2.5 rounded-xl ${iconBgColor} ${iconColor} shrink-0`} aria-hidden="true">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-stone-900 dark:text-stone-50">
            {value}
          </span>
        </div>
        {description && (
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 leading-normal">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
