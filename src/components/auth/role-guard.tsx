'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { RolUsuario } from '@/types';
import { getDefaultRouteForRole } from '@/lib/constants';
import { Spinner } from '@/components/ui/spinner';

export interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: RolUsuario[];
  fallback?: React.ReactNode;
}

/**
 * Guardián de autorización estricto por rol.
 *
 * Flujo garantizado:
 * 1. Si auth está cargando (resolviendo sesión en localStorage), no monta children y muestra spinner.
 * 2. Si no está autenticado, no monta children y redirige a /login.
 * 3. Si está autenticado pero el rol no está en allowedRoles:
 *    - NUNCA monta children (evitando que se ejecuten hooks y useEffect de páginas no autorizadas).
 *    - Redirige de inmediato a la ruta autorizada por defecto del rol.
 * 4. Solo cuando el usuario está autenticado y su rol está expresamente en allowedRoles, monta children.
 */
export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const isAuthorized = !isLoading && isAuthenticated && !!user && allowedRoles.includes(user.rol);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (user && !allowedRoles.includes(user.rol)) {
      const destination = getDefaultRouteForRole(user.rol);
      router.replace(destination);
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <Spinner size="lg" className="text-amber-600 dark:text-amber-500" />
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Verificando autorización...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
        <Spinner size="md" className="text-zinc-400 mb-3" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Redirigiendo a tu espacio de trabajo autorizado...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
