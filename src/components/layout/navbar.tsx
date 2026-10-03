'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSocketStatus } from '@/hooks/use-socket';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, LogOut, Radio } from 'lucide-react';
import { ROL_LABELS } from '@/lib/constants';

export function Navbar() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocketStatus();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const roleVariant = user?.rol
    ? (user.rol.toLowerCase() as 'admin' | 'mesero' | 'cajero' | 'cocinero')
    : 'neutral';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / Identidad Institucional */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-xs">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100 block leading-tight">
              SABOR &amp; GESTIÓN
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
              Sistema Operativo Gastronómico
            </span>
          </div>
        </div>

        {/* Estado en tiempo real y Datos del Usuario */}
        <div className="flex items-center gap-4">
          {/* Indicador de WebSockets */}
          <div
            className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
            }`}
            title={isConnected ? 'Conectado al servidor en tiempo real' : 'Sin conexión de Socket.IO'}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isConnected ? 'En vivo' : 'Desconectado'}</span>
          </div>

          {/* Información del Usuario */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-zinc-200 dark:border-zinc-800">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-none">
                  {user.nombre} {user.apellido}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{user.email}</p>
              </div>

              <Badge variant={roleVariant}>{ROL_LABELS[user.rol]}</Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
