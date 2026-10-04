'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getDefaultRouteForRole } from '@/lib/constants';
import { Spinner } from '@/components/ui/spinner';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        router.replace(getDefaultRouteForRole(user.rol));
      } else if (!isAuthenticated) {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Spinner size="lg" className="text-amber-600 dark:text-amber-500" />
      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Cargando Mishi-Food...</p>
    </div>
  );
}
