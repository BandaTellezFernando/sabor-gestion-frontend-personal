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
  History,
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
  '/dashboard/movimientos-inventario': History,
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

  // Grupos semánticos de Alta Gastronomía
  const generalRoutes = allowedRoutes.filter((r) => ['/dashboard', '/dashboard/usuarios'].includes(r.href));
  const operacionesRoutes = allowedRoutes.filter((r) =>
    ['/dashboard/mesas', '/dashboard/pedidos', '/dashboard/cocina', '/dashboard/caja'].includes(r.href)
  );
  const catalogoRoutes = allowedRoutes.filter((r) =>
    ['/dashboard/categorias', '/dashboard/platos', '/dashboard/ingredientes', '/dashboard/recetas', '/dashboard/movimientos-inventario'].includes(r.href)
  );

  const groups = [
    { title: 'General', routes: generalRoutes },
    { title: 'Servicio & Sala', routes: operacionesRoutes },
    { title: 'Cava & Menú', routes: catalogoRoutes },
  ].filter((g) => g.routes.length > 0);

  const getInitials = (name: string, lastName: string) => {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-amber-900/25 bg-zinc-950 transition-all duration-200 ease-in-out shrink-0 select-none ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
      aria-label="Navegación de Alta Gastronomía"
    >
      {/* Cabecera de Marca */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-amber-900/25 bg-zinc-950/80">
        <Link
          href={getDefaultRouteForRole(user.rol)}
          className="flex items-center gap-2 overflow-hidden focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded-sm"
          title="Sabor & Gestión - Haute Cuisine"
        >
          <BrandLogo size={isCollapsed ? 'sm' : 'md'} showText={!isCollapsed} subtitle="Haute Cuisine" />
        </Link>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expandir carta de navegación' : 'Colapsar navegación'}
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          className="text-stone-400 hover:text-amber-400"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </IconButton>
      </div>

      {/* Lista de Navegación Fine Dining */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-2.5 mb-2 text-[10px] font-medium uppercase tracking-widest text-amber-500/70">
                {group.title}
              </h3>
            )}
            <ul className="space-y-1" role="list">
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
                      className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-sm transition-all duration-150 group relative ${
                        isActive
                          ? 'bg-amber-950/40 text-amber-300 border-l-2 border-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.12)] font-semibold'
                          : isImplemented
                          ? 'text-stone-400 hover:text-stone-100 hover:bg-zinc-900/70 border-l-2 border-transparent'
                          : 'text-stone-600 hover:bg-zinc-900/30 opacity-60 cursor-not-allowed border-l-2 border-transparent'
                      } ${isCollapsed ? 'justify-center border-l-0' : ''}`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-amber-400'
                            : 'text-stone-500 group-hover:text-amber-400/80'
                        }`}
                        aria-hidden="true"
                      />
                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between truncate">
                          <span className="truncate tracking-wide">{route.label}</span>
                          {!isImplemented && (
                            <span className="text-[9px] font-light text-stone-500 bg-zinc-900 px-1.5 py-0.5 rounded-sm border border-stone-800">
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
      <div className="p-3 border-t border-amber-900/25 bg-zinc-950/90">
        <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
          <div
            className="w-8 h-8 rounded-sm bg-gradient-to-br from-amber-800 to-stone-900 text-amber-300 font-serif font-bold text-xs flex items-center justify-center shrink-0 border border-amber-600/40 shadow-xs"
            title={`${user.nombre} ${user.apellido}`}
          >
            {getInitials(user.nombre, user.apellido)}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-stone-200 truncate">
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
                  className="text-[9px] px-1.5 py-0"
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
