'use client';

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Usuario, RolUsuario, LoginRequest, LoginResponse, UsuarioTokenPayload } from '@/types';
import { STORAGE_KEYS, AUTH_UNAUTHORIZED_EVENT } from '@/lib/constants';
import { authService } from '@/services/auth.service';
import { initSocket, disconnectSocket } from '@/lib/socket';

export interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  role: RolUsuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): UsuarioTokenPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as UsuarioTokenPayload;
  } catch {
    return null;
  }
}

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {
      // Ignorar errores de acceso a almacenamiento
    }
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  // Carga inicial de sesión desde localStorage (solo en cliente)
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

        if (storedToken && storedUser) {
          const payload = parseJwt(storedToken);
          // Validar expiración si el token tiene claim exp
          if (payload && payload.exp && payload.exp * 1000 < Date.now()) {
            logout();
          } else {
            setToken(storedToken);
            setUser(JSON.parse(storedUser) as Usuario);
            initSocket(storedToken);
          }
        }
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    });
  }, [logout]);

  // Sincronización desacoplada con 401 Unauthorized emitido por ApiClient
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      router.replace('/login');
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [logout, router]);

  const login = useCallback(async (credentials: LoginRequest): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      const { token: receivedToken, usuario } = response;

      localStorage.setItem(STORAGE_KEYS.TOKEN, receivedToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(usuario));

      setToken(receivedToken);
      setUser(usuario);

      initSocket(receivedToken);

      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const role = user?.rol || null;
  const isAuthenticated = !!token && !!user;

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      role,
      isAuthenticated,
      isLoading,
      login,
      logout,
    }),
    [user, token, role, isAuthenticated, isLoading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
