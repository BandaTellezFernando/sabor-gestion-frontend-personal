'use client';

import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/context/auth-context';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
