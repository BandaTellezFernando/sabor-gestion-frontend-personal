'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ApiError } from '@/lib/api-error';
import { pagoService } from '@/services/pago.service';
import { ComprobantePdfDTO, EstadoQRCuentaResponse } from '@/types';
import { CheckCircle2, Download, FileText, Mail, Utensils } from 'lucide-react';
function descargarPdf(pdf: ComprobantePdfDTO): void {
  const binario = window.atob(pdf.contenidoBase64);
  const bytes = new Uint8Array(binario.length);
  for (let indice = 0; indice < binario.length; indice += 1) {
    bytes[indice] = binario.charCodeAt(indice);
  }
  const blob = new Blob([bytes], { type: pdf.tipoContenido });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = pdf.nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function formatearDinero(valor: number): string {
  return `Bs ${Number(valor || 0).toFixed(2)}`;
}
function validarDatosCliente(
  nombreOriginal: string,
  ciOriginal: string,
  nitOriginal: string,
  datosObligatorios: boolean,
): string | null {
  const nombre = nombreOriginal.trim().replace(/\s+/g, ' ');
  const ci = ciOriginal.trim().replace(/\s+/g, '').toUpperCase();
  const nit = nitOriginal.trim().replace(/\s+/g, '');

  if (!datosObligatorios && !nombre && !ci && !nit) {
    return null;
  }

  if (datosObligatorios && !nombre) {
    return 'El nombre o razón social es obligatorio.';
  }

  // Acepta nombres personales y razones sociales, incluidos signos comunes.
  const patronNombre = /^(?=.*[\p{L}\p{M}])[\p{L}\p{M}\d .,'’&/-]+$/u;
  const longitudNombre = Array.from(nombre).length;

  if (
    nombre &&
    (longitudNombre < 2 || longitudNombre > 80 || !patronNombre.test(nombre))
  ) {
    return 'El nombre o razón social debe tener entre 2 y 80 caracteres y usar caracteres válidos.';
  }

  if (datosObligatorios && !ci) {
    return 'La CI es obligatoria para confirmar el pago.';
  }

  const patronCI = /^(?:\d{5,11}|\d{10}[A-Z0-9]{2})$/;

  if (ci && !patronCI.test(ci)) {
    return 'La CI debe tener entre 5 y 11 dígitos, o 12 caracteres con los últimos 2 alfanuméricos.';
  }

  if (nit && !/^\d{5,12}$/.test(nit)) {
    return 'El NIT debe contener entre 5 y 12 dígitos numéricos.';
  }

  return null;
}

export default function PagarCuentaQRPage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const [estadoCuenta, setEstadoCuenta] = useState<EstadoQRCuentaResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [clienteCI, setClienteCI] = useState<string>('');
  const [clienteNIT, setClienteNIT] = useState<string>('');
  const [comprobantePdf, setComprobantePdf] = useState<ComprobantePdfDTO | null>(null);
  const [email, setEmail] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const enviarEmailLockRef = useRef<boolean>(false);
  const confirmarLockRef = useRef<boolean>(false);
  const detenerConsultaRef = useRef<boolean>(false);
  const consultarEstado = useCallback(async () => {
    if (!token || detenerConsultaRef.current) return;
    try {
      const respuesta = await pagoService.consultarEstadoQRCuenta(token);
      setEstadoCuenta(respuesta);
      setError(null);
      if (respuesta.yaPagada) detenerConsultaRef.current = true;
    } catch (err: unknown) {
      if (err instanceof ApiError) setError(err.getUserMessage());
      else if (err instanceof Error) setError(err.message);
      else setError('No se pudo consultar esta cuenta. Verifica el enlace QR.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);
  useEffect(() => {
    detenerConsultaRef.current = false;
    queueMicrotask(() => void consultarEstado());
    const identificador = window.setInterval(() => void consultarEstado(), 5000);
    return () => window.clearInterval(identificador);
  }, [consultarEstado]);
  const handleConfirmarPago = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || confirmarLockRef.current || isConfirming || estadoCuenta?.yaPagada) return;
    const nombre = clienteNombre.trim().replace(/\s+/g, ' ');
    const ci = clienteCI.trim().replace(/\s+/g, '').toUpperCase();
    const nit = clienteNIT.trim().replace(/\s+/g, '');
    const errorDatosCliente = validarDatosCliente(nombre, ci, nit, true);

    if (errorDatosCliente) {
      setError(errorDatosCliente);
      return;
    }
    confirmarLockRef.current = true;
    setIsConfirming(true);
    setError(null);
    setMensaje(null);
    try {
      const respuesta = await pagoService.confirmarPagoQRCuenta(token, {
        clienteNombre: nombre,
        clienteCI: ci,
        clienteNIT: nit || undefined,
      });
      setMensaje(respuesta.mensaje);
      if (respuesta.comprobantePdf) setComprobantePdf(respuesta.comprobantePdf);
      if (respuesta.yaPagada) {
        detenerConsultaRef.current = true;
        setEstadoCuenta((actual) => actual ? {
          ...actual,
          estado: 'PAGADA',
          yaPagada: true,
          metodoPago: respuesta.pago?.metodoPago || respuesta.metodoPago || 'QR',
          total: respuesta.pago?.totalPagado ?? respuesta.total ?? actual.total,
          fechaPago: respuesta.pago?.fechaPago ?? respuesta.fechaPago ?? actual.fechaPago,
        } : actual);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) setError(err.getUserMessage());
      else if (err instanceof Error) setError(err.message);
      else setError('No se pudo confirmar el pago QR. Intenta nuevamente.');
    } finally {
      confirmarLockRef.current = false;
      setIsConfirming(false);
    }
  };
  const handleEnviarReciboEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !email.trim() || !estadoCuenta?.yaPagada || enviarEmailLockRef.current || isSendingEmail) return;
    enviarEmailLockRef.current = true;
    setIsSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(null);
    try {
      const respuesta = await pagoService.enviarReciboQR(token, { email: email.trim() });
      setEmailSuccess(respuesta.mensaje || 'Recibo enviado por correo correctamente.');
      setEmail('');
    } catch (err: unknown) {
      if (err instanceof ApiError) setEmailError(err.getUserMessage());
      else if (err instanceof Error) setEmailError(err.message);
      else setEmailError('No se pudo enviar el recibo por correo.');
    } finally {
      enviarEmailLockRef.current = false;
      setIsSendingEmail(false);
    }
  };
  if (isLoading && !estadoCuenta) {
    return (
      <main className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-stone-600 dark:text-stone-300">
          <Spinner size="lg" />
          <p className="text-sm">Consultando cuenta de pago...</p>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-white">
            <Utensils className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Mishi-Food</h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">Consulta y confirmación de pago QR</p>
        </header>
        {error && <Alert variant="error">{error}</Alert>}
        {mensaje && <Alert variant="success">{mensaje}</Alert>}
        {!estadoCuenta ? (
          <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 text-center space-y-3">
            <p className="font-semibold text-stone-900 dark:text-stone-100">No se pudo cargar la cuenta</p>
            <Button variant="outline" onClick={() => { detenerConsultaRef.current = false; setIsLoading(true); void consultarEstado(); }}>
              Volver a intentar
            </Button>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
                <div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Código de cuenta</p>
                  <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">{estadoCuenta.codigoCuenta}</h2>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${estadoCuenta.yaPagada ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                  {estadoCuenta.yaPagada ? 'Pagada' : 'Pendiente de pago'}
                </span>
              </div>
              <div className="space-y-5">
                {estadoCuenta.pedidos.map((pedido, indicePedido) => (
                  <section key={`${pedido.codigo}-${indicePedido}`} className="space-y-2">
                    <div className="flex justify-between gap-3 text-sm font-semibold text-stone-800 dark:text-stone-200">
                      <span>Comanda {pedido.codigo}</span>
                      <span>{formatearDinero(pedido.subtotal)}</span>
                    </div>
                    <div className="space-y-2">
                      {pedido.detalles.map((detalle, indiceDetalle) => (
                        <div key={`${pedido.codigo}-${indiceDetalle}`} className="rounded-lg bg-stone-50 dark:bg-stone-950/60 p-3 text-sm">
                          <div className="flex justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-stone-900 dark:text-stone-100">{detalle.cantidad}× {detalle.nombre}</p>
                              <p className="text-xs text-stone-500 dark:text-stone-400">Unitario: {formatearDinero(detalle.precioUnitario)}</p>
                            </div>
                            <p className="shrink-0 font-mono text-stone-800 dark:text-stone-200">{formatearDinero(detalle.subtotal)}</p>
                          </div>
                          {detalle.observacion && detalle.observacion !== 'Sin observaciones' && (
                            <p className="mt-1 text-xs italic text-stone-500 dark:text-stone-400">Observación: {detalle.observacion}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              <div className="border-t border-stone-200 dark:border-stone-800 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-stone-600 dark:text-stone-400"><span>Subtotal</span><span>{formatearDinero(estadoCuenta.subtotal)}</span></div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400"><span>Propina</span><span>{estadoCuenta.propinaAnadida ? formatearDinero(estadoCuenta.propina) : 'No añadida'}</span></div>
                <div className="flex justify-between items-center border-t border-stone-100 dark:border-stone-800 pt-3 text-base font-bold text-stone-900 dark:text-stone-100">
                  <span>Total a pagar</span><span className="text-xl text-orange-700 dark:text-orange-400">{formatearDinero(estadoCuenta.total)}</span>
                </div>
              </div>
            </section>
            {estadoCuenta.yaPagada ? (
              <section className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-5 text-center space-y-3">
                <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-emerald-900 dark:text-emerald-200">Esta cuenta ya fue pagada</h3>
                <p className="text-sm text-emerald-800 dark:text-emerald-300">No se registrará un segundo cobro para esta cuenta.</p>
                {estadoCuenta.metodoPago && <p className="text-xs text-emerald-700 dark:text-emerald-400">Método registrado: {estadoCuenta.metodoPago}</p>}
                {comprobantePdf ? (
                  <Button variant="primary" onClick={() => descargarPdf(comprobantePdf)} leftIcon={<Download className="h-4 w-4" />}>
                    Descargar comprobante PDF
                  </Button>
                ) : (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">Si el pago se confirmó desde otro dispositivo, el comprobante PDF no está disponible en esta sesión.</p>
                )}
                <div className="mt-3 space-y-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-stone-900 p-4 text-left">
                  <div className="flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-200">
                    <Mail className="h-4 w-4" /> Recibir comprobante por correo
                  </div>
                  {emailSuccess && <Alert variant="success">{emailSuccess}</Alert>}
                  {emailError && <Alert variant="error">{emailError}</Alert>}
                  <form onSubmit={handleEnviarReciboEmail} className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="email"
                      label="Correo electrónico"
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      required
                    />
                    <Button type="submit" variant="outline" className="shrink-0 self-end" isLoading={isSendingEmail} disabled={isSendingEmail || !email.trim()}>
                      {isSendingEmail ? 'Enviando...' : 'Enviar recibo'}
                    </Button>
                  </form>
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-stone-100">Datos para el comprobante</h3>
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">El nombre y la CI son obligatorios. El NIT es opcional.</p>
                </div>
                <form onSubmit={handleConfirmarPago} className="space-y-3">
                  <Input label="Nombre completo / razón social" value={clienteNombre} onChange={(event) => setClienteNombre(event.target.value)} required autoComplete="name" />
                  <Input
                    label="Cédula de identidad (CI)"
                    value={clienteCI}
                    onChange={(event) =>
                      setClienteCI(
                        event.target.value
                          .replace(/[^a-zA-Z0-9]/g, '')
                          .toUpperCase()
                          .slice(0, 12),
                      )
                    }
                    required
                    autoComplete="off"
                  />
                  <Input
                    label="NIT (opcional)"
                    value={clienteNIT}
                    onChange={(event) =>
                      setClienteNIT(event.target.value.replace(/\D/g, '').slice(0, 12))
                    }
                    autoComplete="off"
                  />
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-300">
                    Esta aplicación registra una simulación de pago QR. No comprueba ni recibe confirmaciones de una entidad bancaria real.
                  </div>
                  <Button type="submit" variant="primary" className="w-full justify-center" isLoading={isConfirming} disabled={isConfirming} leftIcon={<CheckCircle2 className="h-4 w-4" />}>
                    {isConfirming ? 'Registrando pago...' : `Confirmar pago simulado · ${formatearDinero(estadoCuenta.total)}`}
                  </Button>
                </form>
              </section>
            )}
          </>
        )}
        <footer className="text-center text-xs text-stone-500 dark:text-stone-400 flex items-center justify-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Conserva el comprobante PDF después de finalizar el pago.
        </footer>
      </div>
    </main>
  );
}
