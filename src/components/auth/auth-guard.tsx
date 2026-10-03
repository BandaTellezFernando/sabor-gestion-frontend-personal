'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { RolUsuario } from '@/types';
import { Spinner } from '@/components/ui/spinner';

export interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: RolUsuario[];
}

/**
 * Componente cliente para protección de rutas y layouts.
 * 1. Espera a que useAuth termine la verificación inicial en localStorage.
 * 2. Si no hay sesión, redirige inmediatamente a /login.
 * 3. Si se especifican roles y el usuario no tiene permiso, muestra mensaje de acceso restringido.
 * 4. Si la sesión es válida, renderiza los hijos.
 */
export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Spinner size="lg" className="text-amber-600 dark:text-amber-500" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Verificando sesión...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center">
        <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">Acceso Denegado</h2>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            Tu rol actual ({role}) no tiene permisos para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
