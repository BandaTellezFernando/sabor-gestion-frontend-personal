'use client';

import React from 'react';
import { AuthContextProvider } from '@/context/auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}
