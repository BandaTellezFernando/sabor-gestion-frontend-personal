'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { NAVIGATION_ROUTES, ROL_LABELS } from '@/lib/constants';
import { BrandLogo } from '@/components/ui/brand-logo';
import { IconButton } from '@/components/ui/icon-button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Grid,
  Receipt,
  ChefHat,
  CreditCard,
  X,
  LucideIcon,
} from 'lucide-react';

import { getDefaultRouteForRole } from '@/lib/constants';

const ICON_MAP: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/dashboard/mesas': Grid,
  '/dashboard/pedidos': Receipt,
  '/dashboard/cocina': ChefHat,
  '/dashboard/caja': CreditCard,
};

export interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Guardar elemento que activó el drawer al abrir y restaurar foco al cerrar
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;

      const focusTimer = setTimeout(() => {
        if (drawerRef.current) {
          const focusableSelector =
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
          const focusable = drawerRef.current.querySelectorAll<HTMLElement>(focusableSelector);
          if (focusable.length > 0) {
            focusable[0].focus();
          }
        }
      }, 50);

      return () => {
        clearTimeout(focusTimer);
        if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
          triggerRef.current.focus();
        }
      };
    }
  }, [isOpen]);

  // Cerrar al presionar la tecla Escape y atrapar foco con Tab / Shift+Tab (Focus Trap)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableSelector =
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(focusableSelector);
        const focusable = Array.from(focusableElements).filter(
          (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
        );

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !drawerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !drawerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevenir scroll en body cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const allowedRoutes = NAVIGATION_ROUTES.filter((r) => r.allowedRoles.includes(user.rol));

  const groups = [
    { title: 'General', routes: allowedRoutes.filter((r) => r.href === '/dashboard') },
    {
      title: 'Operaciones',
      routes: allowedRoutes.filter((r) =>
        ['/dashboard/mesas', '/dashboard/pedidos', '/dashboard/cocina', '/dashboard/caja'].includes(r.href)
      ),
    },
  ].filter((g) => g.routes.length > 0);

  const getInitials = (name: string, lastName: string) => {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú de navegación móvil">
      {/* Fondo atenudado con blur */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor del Drawer */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-zinc-900 shadow-2xl flex flex-col z-10 transition-transform duration-200 ease-out"
      >
        {/* Cabecera Móvil */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-100 dark:border-zinc-800">
          <Link href={getDefaultRouteForRole(user.rol)} onClick={onClose} className="flex items-center gap-2">
            <BrandLogo size="sm" showText={true} subtitle="Gestión Gastronómica" />
          </Link>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Cerrar menú lateral"
            title="Cerrar menú"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </IconButton>
        </div>

        {/* Lista de Navegación */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {groups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <h3 className="px-2.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {group.title}
              </h3>
              <ul className="space-y-0.5" role="list">
                {group.routes.map((route) => {
                  const Icon = ICON_MAP[route.href] || LayoutDashboard;
                  const isActive = pathname === route.href;
                  const isImplemented = route.isImplemented !== false;

                  return (
                    <li key={route.href}>
                      <Link
                        href={isImplemented ? route.href : '#'}
                        onClick={(e) => {
                          if (!isImplemented) {
                            e.preventDefault();
                          } else {
                            onClose();
                          }
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                          isActive
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold'
                            : isImplemented
                            ? 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            : 'text-zinc-400 dark:text-zinc-500 opacity-75 cursor-not-allowed'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="flex-1 truncate">{route.label}</span>
                        {!isImplemented && (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            Próx.
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Pie con Perfil de Usuario */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-semibold text-xs flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
              {getInitials(user.nombre, user.apellido)}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {user.nombre} {user.apellido}
              </span>
              <div className="mt-0.5">
                <Badge
                  variant={
                    user.rol === 'Administrador'
                      ? 'admin'
                      : user.rol === 'Mesero'
                      ? 'mesero'
                      : user.rol === 'Cajero'
                      ? 'cajero'
                      : 'cocinero'
                  }
                  className="text-[10px] px-1.5 py-0"
                >
                  {ROL_LABELS[user.rol]}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
