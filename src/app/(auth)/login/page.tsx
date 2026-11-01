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
import { getDefaultRouteForRole } from '@/lib/constants';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redirigir según rol si ya tiene sesión activa
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user) {
      router.replace(getDefaultRouteForRole(user.rol));
    }
  }, [isAuthenticated, isAuthLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Por favor introduce tus credenciales autorizadas.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login({
        email: email.trim(),
        password,
      });
      router.replace(getDefaultRouteForRole(res.usuario.rol));
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
    <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-2 bg-gradient-to-br from-zinc-950 via-stone-900 to-black text-stone-200 relative overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Resplandores decorativos de fondo sutiles */}
      <div
        className="absolute top-1/4 left-10 w-96 h-96 bg-amber-600/10 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      {/* ========================================================
          FASE 2: SECCIÓN DE PRESENTACIÓN (RESPONSIVA)
         ======================================================== */}
      <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-12 xl:p-16 relative z-10 border-b lg:border-b-0 lg:border-r border-amber-900/20 bg-gradient-to-b from-transparent via-zinc-950/20 to-black/40">
        <div className="w-full max-w-xl mx-auto lg:mx-0">
          {/* Cabecera de Marca */}
          <div className="flex items-center gap-3 mb-8">
            <BrandLogo size="md" showText={false} />
            <div>
              <span className="font-serif text-xl sm:text-2xl tracking-wider text-stone-100 font-semibold block">
                Sabor & Gestión
              </span>
              <span className="text-[10px] uppercase tracking-widest text-amber-500/80 font-light block">
                Haute Cuisine & Fine Dining
              </span>
            </div>
          </div>

          {/* Badge Decorativo Minimalista */}
          <div className="inline-flex items-center gap-2 border border-amber-700/50 text-amber-500 text-xs tracking-widest px-3 py-1 rounded-full mb-6 bg-amber-950/20 backdrop-blur-xs font-medium uppercase shadow-[0_0_15px_rgba(217,119,6,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Excelencia Gastronómica
          </div>

          {/* Titular Principal Escalable */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif text-stone-100 font-semibold tracking-tight leading-[1.08] mb-6">
            El arte de gestionar la{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">
              alta cocina
            </span>
          </h1>

          {/* Subtítulo Descriptivo */}
          <p className="text-sm md:text-base text-stone-400 font-light max-w-md leading-relaxed mb-8">
            Una plataforma integral para el control de sala, comandas en tiempo real y excelencia operativa en restaurantes de primer nivel.
          </p>

          {/* Pilares Distintivos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-amber-900/30">
            <div className="space-y-1">
              <span className="font-serif text-sm sm:text-base text-amber-400 font-semibold block">
                Salón 3D
              </span>
              <p className="text-xs text-stone-400 font-light leading-snug">
                Plano isométrico interactivo en tiempo real.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-serif text-sm sm:text-base text-amber-400 font-semibold block">
                Cocina KDS
              </span>
              <p className="text-xs text-stone-400 font-light leading-snug">
                Pase de platos sincronizado vía WebSockets.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-serif text-sm sm:text-base text-amber-400 font-semibold block">
                Caja & Cuentas
              </span>
              <p className="text-xs text-stone-400 font-light leading-snug">
                Cobro agrupado, QR dinámico y propinas.
              </p>
            </div>
          </div>

          {/* Pie de Marca sutil */}
          <div className="hidden lg:flex items-center justify-between text-xs text-stone-500 font-light pt-10">
            <span>Sistema de Gestión Restaurantera Fine Dining</span>
            <span className="text-amber-500/60 font-mono text-[11px]">v2.0 Alta Gama</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          FASE 3: INTEGRACIÓN DEL PANEL DE LOGIN
         ======================================================== */}
      <div className="flex items-center justify-center p-6 sm:p-8 lg:p-12 w-full relative z-10 lg:bg-transparent">
        <div className="w-full max-w-md mx-auto">
          {/* Tarjeta de Acceso Fine Dining con Backdrop Blur */}
          <Card className="backdrop-blur-md bg-zinc-900/80 border border-amber-700/30 shadow-[0_15px_50px_rgba(0,0,0,0.85)] rounded-sm overflow-hidden w-full max-w-md mx-auto">
            <CardHeader className="text-center pb-3 border-b border-amber-900/30 bg-zinc-950/40">
              <div className="lg:hidden flex justify-center mb-3">
                <BrandLogo size="lg" showText={false} />
              </div>
              <CardTitle className="font-serif text-2xl tracking-wide text-stone-100 font-bold">
                Acceso al Sistema
              </CardTitle>
              <CardDescription className="text-stone-400 font-light text-xs mt-1.5">
                Introduce tus credenciales autorizadas para ingresar a sala, cocina o administración.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6 pb-5">
                {errorMessage && (
                  <Alert variant="error" title="Fallo de autenticación">
                    {errorMessage}
                  </Alert>
                )}

                <Input
                  label="Correo Electrónico"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="sommelier@saborygestion.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  leftIcon={<Mail className="w-4 h-4 text-amber-500/70" />}
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
                  leftIcon={<Lock className="w-4 h-4 text-amber-500/70" />}
                  rightElement={
                    <IconButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-stone-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-stone-400" />
                      )}
                    </IconButton>
                  }
                />
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-3 pb-5 border-t border-amber-900/30 bg-zinc-950/60">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-[0_0_15px_rgba(217,119,6,0.2)] font-semibold"
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? 'Ingresando...' : 'Iniciar Sesión'}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Leyenda de Seguridad */}
          <div className="mt-6 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs text-stone-400 font-light">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500/70" />
              <span>Conexión cifrada y sesión protegida con JWT tokenizado</span>
            </div>
            <p className="text-[11px] text-amber-500/60 uppercase tracking-widest font-mono">
              Admin · Sala · Caja · Cocina
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
