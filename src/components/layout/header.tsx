'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSocketStatus } from '@/hooks/use-socket';
import { ROL_LABELS, NAVIGATION_ROUTES } from '@/lib/constants';
import { IconButton } from '@/components/ui/icon-button';
import { Badge } from '@/components/ui/badge';
import { Menu, Radio, LogOut } from 'lucide-react';

export interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
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
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
      {/* Lado Izquierdo: Botón Hamburguesa Móvil + Contexto */}
      <div className="flex items-center gap-3">
        <IconButton
          variant="ghost"
          size="md"
          onClick={onOpenMobileMenu}
          className="lg:hidden"
          aria-label="Abrir menú de navegación"
          title="Abrir menú"
        >
          <Menu className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
        </IconButton>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Mishi-Food</span>
            <span>/</span>
            <span className="capitalize">{moduleTitle}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
            {moduleTitle}
          </h1>
        </div>
      </div>

      {/* Lado Derecho: Estado Socket + Perfil + Salida */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Indicador de Conexión WebSockets */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
          }`}
          title={isConnected ? 'Conectado a WebSockets en tiempo real' : 'Sin conexión WebSockets'}
        >
          <Radio
            className={`w-3 h-3 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-zinc-400'}`}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">
            {isConnected ? 'En vivo' : 'Desconectado'}
          </span>
        </div>

        {/* Separador vertical */}
        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

        {/* Perfil del Usuario */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-semibold text-xs flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800"
            title={`${user.nombre} ${user.apellido}`}
          >
            {getInitials(user.nombre, user.apellido)}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-none truncate max-w-[140px]">
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
          className="text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          <LogOut className="w-4 h-4" />
        </IconButton>
      </div>
    </header>
  );
}
