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
  Layers,
  Utensils,
  Apple,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Users,
  LucideIcon,
} from 'lucide-react';

import { getDefaultRouteForRole } from '@/lib/constants';

const ICON_MAP: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/dashboard/usuarios': Users,
  '/dashboard/mesas': Grid,
  '/dashboard/pedidos': Receipt,
  '/dashboard/cocina': ChefHat,
  '/dashboard/caja': CreditCard,
  '/dashboard/categorias': Layers,
  '/dashboard/platos': Utensils,
  '/dashboard/ingredientes': Apple,
  '/dashboard/recetas': ScrollText,
};

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  // Filtrar rutas autorizadas según rol
  const allowedRoutes = NAVIGATION_ROUTES.filter((r) => r.allowedRoles.includes(user.rol));

  // Grupos semánticos oficiales
  const generalRoutes = allowedRoutes.filter((r) => ['/dashboard', '/dashboard/usuarios'].includes(r.href));
  const operacionesRoutes = allowedRoutes.filter((r) =>
    ['/dashboard/mesas', '/dashboard/pedidos', '/dashboard/cocina', '/dashboard/caja'].includes(r.href)
  );
  const catalogoRoutes = allowedRoutes.filter((r) =>
    ['/dashboard/categorias', '/dashboard/platos', '/dashboard/ingredientes', '/dashboard/recetas'].includes(r.href)
  );

  const groups = [
    { title: 'General', routes: generalRoutes },
    { title: 'Operaciones', routes: operacionesRoutes },
    { title: 'Catálogo y Recetas', routes: catalogoRoutes },
  ].filter((g) => g.routes.length > 0);

  const getInitials = (name: string, lastName: string) => {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#201E1B] transition-all duration-200 ease-in-out shrink-0 select-none ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
      aria-label="Navegación principal"
    >
      {/* Cabecera de Marca */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-stone-100 dark:border-stone-800">
        <Link
          href={getDefaultRouteForRole(user.rol)}
          className="flex items-center gap-2 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E05A36] rounded-xl"
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
          className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </IconButton>
      </div>

      {/* Lista de Navegación */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {group.title}
              </h3>
            )}
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
                        }
                      }}
                      title={isCollapsed ? route.label : (!isImplemented ? `Módulo ${route.label} (Próximamente)` : undefined)}
                      className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 group relative ${
                        isActive
                          ? 'bg-[#C84B26]/10 dark:bg-[#C84B26]/20 text-[#C84B26] dark:text-[#E05A36] shadow-xs'
                          : isImplemented
                          ? 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                          : 'text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800/40 opacity-75 cursor-not-allowed'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-[#C84B26] dark:text-[#E05A36]'
                            : 'text-stone-500 group-hover:text-stone-700 dark:group-hover:text-stone-300'
                        }`}
                        aria-hidden="true"
                      />
                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between truncate">
                          <span className="truncate">{route.label}</span>
                          {!isImplemented && (
                            <span className="text-[10px] font-normal text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
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
      <div className="p-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-[#1A1816]/50">
        <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
          <div
            className="w-8 h-8 rounded-full bg-[#C84B26]/10 dark:bg-[#C84B26]/20 text-[#C84B26] dark:text-[#E05A36] font-bold text-xs flex items-center justify-center shrink-0 border border-[#C84B26]/20"
            title={`${user.nombre} ${user.apellido}`}
          >
            {getInitials(user.nombre, user.apellido)}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
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
