'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { NAVIGATION_ROUTES } from '@/lib/constants';
import { Sidebar } from './sidebar';
import { MobileSidebar } from './mobile-sidebar';
import { Header } from './header';

const STORAGE_KEY = 'mishi_sidebar_collapsed';

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Calcular rutas autorizadas para el usuario activo
  const allowedRoutes = user
    ? NAVIGATION_ROUTES.filter((r) => r.allowedRoles.includes(user.rol))
    : [];
  const showSidebar = allowedRoutes.length >= 3;

  // Cargar preferencia de colapso desde localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        queueMicrotask(() => {
          setIsCollapsed(Boolean(parsed));
        });
      }
    } catch {
      // Ignorar si localStorage no está disponible
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignorar
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen flex bg-[#FBF9F5] dark:bg-[#171614] text-stone-900 dark:text-stone-100">
      {/* Sidebar Desktop y Drawer Móvil solo si tiene 3 o más módulos */}
      {showSidebar && (
        <>
          <Sidebar isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
          <MobileSidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
        </>
      )}

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          showSidebar={showSidebar}
          allowedRoutes={allowedRoutes}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
