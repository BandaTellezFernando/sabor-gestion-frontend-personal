'use client';

import React from 'react';
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
  DollarSign,
  Utensils,
  Layers,
  Apple,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/dashboard/mesas': Grid,
  '/mesas': Grid,
  '/dashboard/pedidos': Receipt,
  '/pedidos': Receipt,
  '/cocina': ChefHat,
  '/caja': CreditCard,
  '/pagos': DollarSign,
  '/platos': Utensils,
  '/categorias': Layers,
  '/ubicaciones': MapPin,
  '/ingredientes': Apple,
  '/usuarios': Users,
};

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  // Filtrar rutas según rol
  const allowedRoutes = NAVIGATION_ROUTES.filter((r) => r.allowedRoles.includes(user.rol));

  // Grupos semánticos
  const generalRoutes = allowedRoutes.filter((r) => r.href === '/dashboard');
  const salonRoutes = allowedRoutes.filter((r) =>
    ['/dashboard/mesas', '/mesas', '/dashboard/pedidos', '/pedidos', '/cocina', '/caja', '/pagos'].includes(r.href)
  );
  const catalogRoutes = allowedRoutes.filter((r) =>
    ['/platos', '/categorias', '/ubicaciones', '/ingredientes'].includes(r.href)
  );
  const adminRoutes = allowedRoutes.filter((r) => r.href === '/usuarios');

  const groups = [
    { title: 'General', routes: generalRoutes },
    { title: 'Atención y Salón', routes: salonRoutes },
    { title: 'Menú y Cocina', routes: catalogRoutes },
    { title: 'Administración', routes: adminRoutes },
  ].filter((g) => g.routes.length > 0);

  const getInitials = (name: string, lastName: string) => {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-200 ease-in-out shrink-0 select-none ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
      aria-label="Navegación principal"
    >
      {/* Cabecera de Marca */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-100 dark:border-zinc-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg"
          title="Mishi-Food - Inicio"
        >
          <BrandLogo size={isCollapsed ? 'sm' : 'md'} showText={!isCollapsed} subtitle="Gestión Gastronómica" />
        </Link>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
          title={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </IconButton>
      </div>

      {/* Lista de Navegación */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {group.title}
              </h3>
            )}
            <ul className="space-y-0.5" role="list">
              {group.routes.map((route) => {
                const Icon = ICON_MAP[route.href] || LayoutDashboard;
                const isActive = pathname === route.href;
                const isImplemented =
                  route.href === '/dashboard' ||
                  route.href === '/dashboard/mesas' ||
                  route.href === '/mesas' ||
                  route.href === '/dashboard/pedidos' ||
                  route.href === '/pedidos';

                return (
                  <li key={route.href}>
                    <Link
                      href={isImplemented ? route.href : '#'}
                      onClick={(e) => {
                        if (!isImplemented) {
                          e.preventDefault();
                        }
                      }}
                      title={isCollapsed ? route.label : (!isImplemented ? `Módulo ${route.label} (Próximamente)` : undefined)}
                      className={`flex items-center gap-3 px-2.5 py-2 text-xs font-medium rounded-lg transition-all duration-150 group relative ${
                        isActive
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold shadow-xs'
                          : isImplemented
                          ? 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          : 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 opacity-75 cursor-not-allowed'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'
                        }`}
                        aria-hidden="true"
                      />
                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between truncate">
                          <span className="truncate">{route.label}</span>
                          {!isImplemented && (
                            <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                              Próx.
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Pie del Menú con Mini-Perfil */}
      <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
          <div
            className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-semibold text-xs flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800"
            title={`${user.nombre} ${user.apellido}`}
          >
            {getInitials(user.nombre, user.apellido)}
          </div>
          {!isCollapsed && (
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
          )}
        </div>
      </div>
    </aside>
  );
}
