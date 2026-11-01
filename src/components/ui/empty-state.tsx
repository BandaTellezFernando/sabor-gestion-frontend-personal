import React, { ReactNode } from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-sm border border-dashed border-amber-900/30 bg-zinc-900/30 ${className}`}
    >
      <div
        className="flex items-center justify-center w-12 h-12 rounded-sm bg-zinc-950 border border-amber-800/30 text-amber-500/70 mb-3"
        aria-hidden="true"
      >
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="font-serif text-base font-medium tracking-wide text-stone-200">{title}</h4>
      {description && (
        <p className="mt-1 text-xs text-stone-400 font-light max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
