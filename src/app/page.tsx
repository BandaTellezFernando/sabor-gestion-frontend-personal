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
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-stone-200">
      <Spinner size="lg" className="text-amber-500" />
      <p className="mt-4 font-serif text-sm tracking-widest text-amber-500/80 uppercase font-light">
        Sabor & Gestión
      </p>
    </div>
  );
}
