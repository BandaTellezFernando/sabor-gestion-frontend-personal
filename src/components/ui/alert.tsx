import React, { HTMLAttributes } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'error' | 'success' | 'info' | 'warning';
  title?: string;
}

export function Alert({ className = '', variant = 'info', title, children, ...props }: AlertProps) {
  const config = {
    error: {
      container: 'bg-rose-950/40 border-rose-900/60 text-rose-200',
      icon: AlertCircle,
      iconColor: 'text-rose-400',
    },
    success: {
      container: 'bg-emerald-950/40 border-emerald-900/60 text-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
    },
    info: {
      container: 'bg-zinc-900/80 border-amber-800/40 text-stone-200',
      icon: Info,
      iconColor: 'text-amber-400',
    },
    warning: {
      container: 'bg-amber-950/40 border-amber-800/50 text-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    },
  };

  const { container, icon: IconComponent, iconColor } = config[variant];

  return (
    <div
      role="alert"
      className={`p-4 rounded-sm border flex items-start gap-3 text-sm ${container} ${className}`}
      {...props}
    >
      <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1">
        {title && <h5 className="font-serif font-semibold tracking-wide mb-1">{title}</h5>}
        <div className="font-light">{children}</div>
      </div>
    </div>
  );
}
