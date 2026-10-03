import React from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { AppShell } from '@/components/layout/app-shell';

export const metadata = {
  title: 'Dashboard | Mishi-Food',
  description: 'Panel de control operativo y gerencial para el personal gastronómico de Mishi-Food',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
