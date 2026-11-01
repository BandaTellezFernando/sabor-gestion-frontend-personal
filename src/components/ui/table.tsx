import React, { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

export function Table({ className = '', ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-sm border border-amber-700/20 bg-zinc-900/60 shadow-xs">
      <table className={`w-full text-sm text-left border-collapse ${className}`} {...props} />
    </div>
  );
}

export function TableHeader({ className = '', ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`text-[11px] uppercase tracking-wider bg-zinc-950/80 text-amber-500/80 border-b border-amber-900/30 ${className}`}
      {...props}
    />
  );
}

export function TableBody({ className = '', ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={`divide-y divide-stone-800/60 text-stone-200 ${className}`}
      {...props}
    />
  );
}

export function TableRow({ className = '', ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`hover:bg-zinc-800/40 transition-colors ${className}`}
      {...props}
    />
  );
}

export function TableHead({ className = '', ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`px-4 py-3 font-serif font-medium tracking-wide ${className}`} {...props} />;
}

export function TableCell({ className = '', ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3 align-middle font-light ${className}`} {...props} />;
}
