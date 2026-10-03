'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { BrandLogo } from '@/components/ui/brand-logo';
import { IconButton } from '@/components/ui/icon-button';
import { ApiError } from '@/lib/api-error';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redirigir al dashboard si ya tiene sesión activa
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: email.trim(),
        password,
      });
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.getUserMessage());
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Error inesperado al conectar con el servidor.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        {/* Identidad Institucional Mishi-Food */}
        <div className="text-center mb-8 flex flex-col items-center">
          <BrandLogo size="xl" showText={false} className="mb-4" />
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Mishi-Food
          </h1>
          <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Sistema de Gestión Gastronómica
          </p>
        </div>

        {/* Tarjeta de Formulario */}
        <Card className="shadow-lg border-zinc-200 dark:border-zinc-800">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Portal de Acceso Operativo</CardTitle>
            <CardDescription>
              Introduce tus credenciales autorizadas para acceder a tu panel de trabajo.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {errorMessage && (
                <Alert variant="error" title="Error de autenticación">
                  {errorMessage}
                </Alert>
              )}

              <Input
                label="Correo Electrónico"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="usuario@mishi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
                leftIcon={<Lock className="w-4 h-4" />}
                rightElement={
                  <IconButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-zinc-500" />
                    )}
                  </IconButton>
                }
              />
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Ingresando al sistema...' : 'Ingresar al Sistema'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Leyenda de Seguridad Operativa y Vigencia */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Sistema de uso exclusivo para personal autorizado de Mishi-Food. Las sesiones tienen una vigencia máxima de 8 horas.
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
            Acceso habilitado para Administrador, Mesero, Cajero y Cocinero.
          </p>
        </div>
      </div>
    </div>
  );
}
