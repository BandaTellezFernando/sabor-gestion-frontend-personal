'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSocketStatus } from '@/hooks/use-socket';
import { ROL_LABELS, NAVIGATION_ROUTES, getDefaultRouteForRole, RouteNavItem } from '@/lib/constants';
import { IconButton } from '@/components/ui/icon-button';
import { Badge } from '@/components/ui/badge';
import { BrandLogo } from '@/components/ui/brand-logo';
import { NotificacionesMesero } from './notificaciones-mesero';
import {
  Menu,
  Radio,
  LogOut,
  LayoutDashboard,
  Grid,
  Receipt,
  ChefHat,
  CreditCard,
  Layers,
  Utensils,
  Apple,
  ScrollText,
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/dashboard/mesas': Grid,
  '/dashboard/pedidos': Receipt,
  '/dashboard/cocina': ChefHat,
  '/dashboard/caja': CreditCard,
  '/dashboard/categorias': Layers,
  '/dashboard/platos': Utensils,
  '/dashboard/ingredientes': Apple,
  '/dashboard/recetas': ScrollText,
};

export interface HeaderProps {
  onOpenMobileMenu: () => void;
  showSidebar?: boolean;
  allowedRoutes?: RouteNavItem[];
}

export function Header({ onOpenMobileMenu, showSidebar = true, allowedRoutes = [] }: HeaderProps) {
  const { user, logout } = useAuth();
  const { isConnected } = useSocketStatus();
  const pathname = usePathname();

  if (!user) return null;

  // Encontrar el label del módulo actual
  const currentRoute = NAVIGATION_ROUTES.find((r) => r.href === pathname);
  const moduleTitle = currentRoute?.label || 'Dashboard';

  const getInitials = (name: string, lastName: string) => {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const roleBadgeVariantMap: Record<string, 'admin' | 'mesero' | 'cajero' | 'cocinero'> = {
    Administrador: 'admin',
    Mesero: 'mesero',
    Cajero: 'cajero',
    Cocinero: 'cocinero',
  };

  return (
    <header className="h-16 border-b border-amber-900/25 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
      {/* Lado Izquierdo: Con Sidebar vs Sin Sidebar (Adaptativo) */}
      {showSidebar ? (
        <div className="flex items-center gap-3">
          <IconButton
            variant="ghost"
            size="md"
            onClick={onOpenMobileMenu}
            className="lg:hidden text-stone-300 hover:text-amber-400"
            aria-label="Abrir menú de navegación"
            title="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </IconButton>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-amber-500/70 font-light tracking-wide">
              <span>Sabor & Gestión</span>
              <span className="text-stone-600">/</span>
              <span className="text-stone-300 font-normal">{moduleTitle}</span>
            </div>
            <h1 className="font-serif text-base sm:text-lg font-medium tracking-wide text-stone-100 leading-tight">
              {moduleTitle}
            </h1>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          {/* Logo del Restaurante */}
          <Link
            href={getDefaultRouteForRole(user.rol)}
            className="flex items-center gap-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded-sm shrink-0"
            title="Sabor & Gestión - Inicio"
          >
            <BrandLogo size="sm" showText={true} className="hidden md:inline-flex" subtitle="Alta Gastronomía" />
            <BrandLogo size="sm" showText={false} className="md:hidden" />
          </Link>

          {/* Navegación horizontal adaptativa para roles con 1 o 2 módulos */}
          {allowedRoutes.length > 0 && allowedRoutes.length <= 2 && (
            <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Navegación de módulos">
              {allowedRoutes.map((route) => {
                const Icon = ICON_MAP[route.href] || LayoutDashboard;
                const isActive = pathname === route.href;
                const isImplemented = route.isImplemented !== false;

                return (
                  <Link
                    key={route.href}
                    href={isImplemented ? route.href : '#'}
                    onClick={(e) => {
                      if (!isImplemented) e.preventDefault();
                    }}
                    title={!isImplemented ? `Módulo ${route.label} (Próximamente)` : route.label}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-sm text-xs sm:text-sm font-medium tracking-wide transition-all ${
                      isActive
                        ? 'bg-amber-600 text-stone-950 font-semibold shadow-[0_0_15px_rgba(217,119,6,0.25)] border border-amber-500/40'
                        : isImplemented
                        ? 'text-stone-300 hover:text-amber-300 hover:bg-zinc-900 border border-transparent'
                        : 'text-stone-600 opacity-60 cursor-not-allowed border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{route.label}</span>
                    {!isImplemented && (
                      <span className="hidden sm:inline text-[9px] text-stone-500 bg-zinc-900 px-1 py-0.5 rounded-sm">
                        Próx.
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      )}

      {/* Lado Derecho: Estado Socket + Notificaciones + Perfil + Salida */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Indicador de Conexión WebSockets */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium tracking-wide border transition-colors ${
            isConnected
              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40'
              : 'bg-zinc-900 text-stone-400 border-stone-800'
          }`}
          title={isConnected ? 'Conectado a WebSockets en tiempo real' : 'Sin conexión WebSockets'}
        >
          <Radio
            className={`w-3 h-3 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-stone-500'}`}
            aria-hidden="true"
          />
          <span className="hidden sm:inline font-mono text-[11px]">
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        {/* Campanita de Notificaciones de Pedidos Listos */}
        {(user.rol === 'Mesero' || user.rol === 'Administrador') && <NotificacionesMesero />}

        {/* Separador vertical */}
        <div className="h-5 w-px bg-amber-900/30 hidden sm:block" />

        {/* Perfil del Usuario */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-sm bg-gradient-to-br from-amber-800 to-stone-900 text-amber-300 font-serif font-bold text-xs flex items-center justify-center shrink-0 border border-amber-600/40 shadow-xs"
            title={`${user.nombre} ${user.apellido}`}
          >
            {getInitials(user.nombre, user.apellido)}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-medium text-stone-200 leading-none truncate max-w-[140px]">
              {user.nombre} {user.apellido}
            </span>
            <div className="mt-1">
              <Badge variant={roleBadgeVariantMap[user.rol] || 'neutral'} className="text-[9px] px-1.5 py-0">
                {ROL_LABELS[user.rol]}
              </Badge>
            </div>
          </div>
        </div>

        {/* Botón de Logout */}
        <IconButton
          variant="ghost"
          size="md"
          onClick={logout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="text-stone-400 hover:text-rose-400 hover:bg-rose-950/20"
        >
          <LogOut className="w-4 h-4" />
        </IconButton>
      </div>
    </header>
  );
}
