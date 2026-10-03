'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { NAVIGATION_ROUTES } from '@/lib/constants';

export function RoleNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  // Filtrar rutas permitidas para el rol activo según RBAC
  const allowedRoutes = NAVIGATION_ROUTES.filter((route) => route.allowedRoles.includes(user.rol));

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 py-2">
          {allowedRoutes.map((route) => {
            const isActive = pathname === route.href;
            const isImplemented = route.href === '/dashboard';

            return (
              <Link
                key={route.href}
                href={isImplemented ? route.href : '#'}
                onClick={(e) => {
                  if (!isImplemented) {
                    e.preventDefault();
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xs'
                    : isImplemented
                    ? 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800'
                    : 'text-zinc-400 dark:text-zinc-500 cursor-not-allowed opacity-80'
                }`}
                title={!isImplemented ? `Módulo ${route.label} (Fase siguiente)` : undefined}
              >
                <span>{route.label}</span>
                {!isImplemented && (
                  <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                    Fase 2
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
