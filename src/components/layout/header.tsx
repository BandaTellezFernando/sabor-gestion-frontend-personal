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
    <header className="h-16 border-b border-stone-200/90 dark:border-stone-800 bg-white/90 dark:bg-[#201E1B]/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
      {/* Lado Izquierdo: Con Sidebar vs Sin Sidebar (Adaptativo) */}
      {showSidebar ? (
        <div className="flex items-center gap-3">
          <IconButton
            variant="ghost"
            size="md"
            onClick={onOpenMobileMenu}
            className="lg:hidden"
            aria-label="Abrir menú de navegación"
            title="Abrir menú"
          >
            <Menu className="w-5 h-5 text-stone-700 dark:text-stone-300" />
          </IconButton>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
              <span className="font-semibold text-stone-700 dark:text-stone-300">Mishi-Food</span>
              <span>/</span>
              <span className="capitalize">{moduleTitle}</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
              {moduleTitle}
            </h1>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          {/* Logo del Restaurante */}
          <Link
            href={getDefaultRouteForRole(user.rol)}
            className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E05A36] rounded-xl shrink-0"
            title="Mishi-Food - Inicio"
          >
            <BrandLogo size="sm" showText={true} className="hidden md:inline-flex" subtitle="Gestión Gastronómica" />
            <BrandLogo size="sm" showText={false} className="md:hidden" />
          </Link>

          {/* Navegación horizontal adaptativa para roles con 1 o 2 módulos */}
          {allowedRoutes.length > 0 && allowedRoutes.length <= 2 && (
            <nav className="flex items-center gap-1 sm:gap-2" aria-label="Navegación de módulos">
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
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#C84B26] text-white shadow-xs'
                        : isImplemented
                        ? 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                        : 'text-stone-400 dark:text-stone-500 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{route.label}</span>
                    {!isImplemented && (
                      <span className="hidden sm:inline text-[10px] text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">
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

      {/* Lado Derecho: Estado Socket + Perfil + Salida */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Indicador de Conexión WebSockets */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
            isConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700'
          }`}
          title={isConnected ? 'Conectado a WebSockets en tiempo real' : 'Sin conexión WebSockets'}
        >
          <Radio
            className={`w-3 h-3 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-stone-400'}`}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">
            {isConnected ? 'En vivo' : 'Desconectado'}
          </span>
        </div>

        {/* Campanita de Notificaciones de Pedidos Listos (Solo Mesero y Administrador) */}
        {(user.rol === 'Mesero' || user.rol === 'Administrador') && <NotificacionesMesero />}

        {/* Separador vertical */}
        <div className="h-5 w-px bg-stone-200 dark:bg-stone-800 hidden sm:block" />

        {/* Perfil del Usuario */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full bg-[#C84B26]/10 dark:bg-[#C84B26]/20 text-[#C84B26] dark:text-[#E05A36] font-bold text-xs flex items-center justify-center shrink-0 border border-[#C84B26]/20 dark:border-[#C84B26]/40"
            title={`${user.nombre} ${user.apellido}`}
          >
            {getInitials(user.nombre, user.apellido)}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 leading-none truncate max-w-[140px]">
              {user.nombre} {user.apellido}
            </span>
            <div className="mt-0.5">
              <Badge variant={roleBadgeVariantMap[user.rol] || 'neutral'} className="text-[10px] px-1.5 py-0">
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
          className="text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          <LogOut className="w-4 h-4" />
        </IconButton>
      </div>
    </header>
  );
}
