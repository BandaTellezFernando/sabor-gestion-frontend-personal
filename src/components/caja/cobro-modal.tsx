
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CuentaMesaDTO,
  MetodoPago,
  ComprobantePago,
  DatosQRCuentaResponse,
  DetallePedido,
  Pedido,
  DatosTarjetaSimuladaDTO,
} from '@/types';
import { pagoService } from '@/services/pago.service';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { ApiError } from '@/lib/api-error';
import { useSocketEvent } from '@/hooks/use-socket';
import { SOCKET_EVENTS } from '@/lib/socket';
import {
  Banknote,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  User,
  Hash,
  Percent,
  Smartphone,
} from 'lucide-react';

interface CobroModalProps {
  isOpen: boolean;
  onClose: () => void;
  cuenta: CuentaMesaDTO | null;
  onSuccess: (comprobante: ComprobantePago) => void;
}

function obtenerNombrePlato(detalle: DetallePedido): string {
  if (detalle.nombrePlato?.trim()) return detalle.nombrePlato.trim();
  return typeof detalle.plato === 'string'
    ? 'Producto'
    : detalle.plato?.nombre?.trim() || 'Producto';
}

function obtenerNombreMesero(pedido: Pedido | undefined): string {
  if (!pedido) return 'No identificado';
  if (typeof pedido.usuario === 'string') return 'Mesero asignado';
  const nombre = pedido.usuario?.nombre?.trim() || '';
  const apellido = pedido.usuario?.apellido?.trim() || '';
  return `${nombre} ${apellido}`.trim() || 'No identificado';
}

function fechaBolivia(fecha: string | Date): string {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return new Date().toLocaleString('es-BO');
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: 'America/La_Paz',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(valor);
}

export function CobroModal({ isOpen, onClose, cuenta, onSuccess }: CobroModalProps) {
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Efectivo');
  const [montoPropina, setMontoPropina] = useState<string>('0');
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [clienteCI, setClienteCI] = useState<string>('');
  const [clienteNIT, setClienteNIT] = useState<string>('');
  const [montoRecibido, setMontoRecibido] = useState<string>('');
  const [tarjetaTitular, setTarjetaTitular] = useState<string>('');
  const [tarjetaNumero, setTarjetaNumero] = useState<string>('');
  const [tarjetaVencimiento, setTarjetaVencimiento] = useState<string>('');
  const [tarjetaCVV, setTarjetaCVV] = useState<string>('');
  const [qrData, setQrData] = useState<DatosQRCuentaResponse | null>(null);
  const [isLoadingQR, setIsLoadingQR] = useState<boolean>(false);
  const [qrConfirmado, setQrConfirmado] = useState<boolean>(false);
  const [emailRecibo, setEmailRecibo] = useState<string>('');
  const [isSendingRecibo, setIsSendingRecibo] = useState<boolean>(false);
  const [reciboEmailSuccess, setReciboEmailSuccess] = useState<string | null>(null);
  const [reciboEmailError, setReciboEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const confirmarPagoLockRef = useRef<boolean>(false);
  const generarQRLockRef = useRef<boolean>(false);
  const enviarReciboLockRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen || !cuenta) return;
    queueMicrotask(() => {
      setMetodoPago('Efectivo');
      setMontoPropina(String(cuenta.montoPropina ?? 0));
      setClienteNombre(cuenta.clienteNombre || '');
      setClienteCI(cuenta.clienteCI || '');
      setClienteNIT(cuenta.clienteNIT || '');
      setMontoRecibido('');
      setTarjetaTitular('');
      setTarjetaNumero('');
      setTarjetaVencimiento('');
      setTarjetaCVV('');
      setQrData(null);
      setQrConfirmado(false);
      setEmailRecibo('');
      setIsSendingRecibo(false);
      setReciboEmailSuccess(null);
      setReciboEmailError(null);
      setError(null);
    });
  }, [isOpen, cuenta]);

  useSocketEvent<{ cuentaId?: string; pedidoId?: string }>(
    SOCKET_EVENTS.CAJA_PAGO_CONFIRMADO,
    (data) => {
      if (cuenta && data?.cuentaId === cuenta._id) {
        setQrConfirmado(true);
        setError(null);
      }
    },
  );

  const handleEnviarReciboEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !cuenta?._id ||
      !qrConfirmado ||
      !emailRecibo.trim() ||
      enviarReciboLockRef.current ||
      isSendingRecibo
    ) {
      return;
    }

    enviarReciboLockRef.current = true;
    setIsSendingRecibo(true);
    setReciboEmailSuccess(null);
    setReciboEmailError(null);

    try {
      const respuesta = await pagoService.enviarReciboCuenta(cuenta._id, {
        email: emailRecibo.trim(),
      });
      setReciboEmailSuccess(
        respuesta.mensaje || 'Recibo enviado correctamente por correo electrónico.',
      );
      setEmailRecibo('');
    } catch (err: unknown) {
      if (err instanceof ApiError) setReciboEmailError(err.getUserMessage());
      else if (err instanceof Error) setReciboEmailError(err.message);
      else setReciboEmailError('No se pudo enviar el recibo por correo.');
    } finally {
      enviarReciboLockRef.current = false;
      setIsSendingRecibo(false);
    }
  };

  if (!cuenta) return null;

  const subtotal = Number(cuenta.subtotal || 0);
  const propina = Math.max(0, Number(montoPropina) || 0);
  const total = Number((subtotal + propina).toFixed(2));
  const recibido = montoRecibido === '' ? null : Number(montoRecibido);
  const vuelto = recibido === null ? null : Number((recibido - total).toFixed(2));
  const montoInsuficiente = metodoPago === 'Efectivo' && (recibido === null || !Number.isFinite(recibido) || vuelto === null || vuelto < 0);
  const requiereDatosCliente = metodoPago === 'Tarjeta';
  const mesaNombre = typeof cuenta.mesa === 'string' ? 'Mesa' : cuenta.mesa?.numero || 'Mesa sin asignar';
  const imagenQR = qrData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrData.urlPago)}`
    : null;

  const handleSeleccionarMetodo = async (metodo: MetodoPago) => {
    setMetodoPago(metodo);
    setError(null);

    // El QR debe reflejar los importes ya persistidos en la cuenta.
    if (metodo === 'QR') setMontoPropina(String(cuenta.montoPropina ?? 0));

    if (metodo === 'QR' && !qrData && !generarQRLockRef.current) {
      generarQRLockRef.current = true;
      setIsLoadingQR(true);
      try {
        const respuesta = await pagoService.generarQRCuenta(cuenta._id);
        setQrData(respuesta);
      } catch (err: unknown) {
        if (err instanceof ApiError) setError(err.getUserMessage());
        else if (err instanceof Error) setError(err.message);
        else setError('No se pudo generar el QR para esta cuenta.');
      } finally {
        generarQRLockRef.current = false;
        setIsLoadingQR(false);
      }
    }
  };

  const handleProcesarPago = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cuenta._id || confirmarPagoLockRef.current || isSubmitting || metodoPago === 'QR') return;

    if (metodoPago === 'Efectivo' && montoInsuficiente) {
      setError(`El monto recibido debe ser igual o superior a Bs ${total.toFixed(2)}.`);
      return;
    }

    if (metodoPago === 'Tarjeta' && (!clienteNombre.trim() || !clienteCI.trim())) {
      setError('Para pagar con tarjeta debes introducir el nombre del cliente y su CI.');
      return;
    }

    confirmarPagoLockRef.current = true;
    setIsSubmitting(true);
    setError(null);

    const tarjeta: DatosTarjetaSimuladaDTO | undefined = metodoPago === 'Tarjeta'
      ? {
          titular: tarjetaTitular.trim(),
          numero: tarjetaNumero.trim(),
          vencimiento: tarjetaVencimiento.trim(),
          cvv: tarjetaCVV.trim(),
        }
      : undefined;

    try {
      const respuesta = await pagoService.procesarPagoCuenta(cuenta._id, {
        metodoPago,
        montoPropina: propina,
        montoRecibido: metodoPago === 'Efectivo' ? recibido ?? undefined : undefined,
        clienteNombre: clienteNombre.trim() || undefined,
        clienteCI: clienteCI.trim() || undefined,
        clienteNIT: clienteNIT.trim() || undefined,
        tarjeta,
      });

      const pago = respuesta.pago;
      const primerPedidoId = pago.pedidosIds[0] || cuenta.pedidos[0]?._id || '';
      const comprobante: ComprobantePago = {
        pedidoId: primerPedidoId,
        pedidosIds: pago.pedidosIds,
        cuentaId: pago.cuentaId,
        codigoCuenta: pago.codigoCuenta,
        codigoPago: pago.codigoPago,
        meseroNombre: obtenerNombreMesero(cuenta.pedidos[0]),
        subtotal: pago.subtotal,
        montoDescuento: 0,
        montoPropina: pago.propina,
        descuentoAplicado: 0,
        propinaAplicada: pago.propina,
        total: pago.totalPagado,
        totalPagado: pago.totalPagado,
        metodoPago: pago.metodoPago,
        clienteNombre: clienteNombre.trim() || 'Consumidor Final',
        clienteCI: clienteCI.trim() || undefined,
        clienteNIT: clienteNIT.trim() || undefined,
        fechaBolivia: fechaBolivia(pago.fechaPago),
        fecha: pago.fechaPago,
        montoRecibido: pago.montoRecibido,
        cambio: pago.cambio,
        comprobantePdf: respuesta.comprobantePdf,
      };

      onSuccess(comprobante);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) setError(err.getUserMessage());
      else if (err instanceof Error) setError(err.message);
      else setError('No se pudo procesar el pago. Intenta nuevamente.');
    } finally {
      confirmarPagoLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cobro de ${cuenta.codigoCuenta}`}
      description={`${mesaNombre} · ${cuenta.pedidos.length} ${cuenta.pedidos.length === 1 ? 'comanda' : 'comandas'} agrupadas`}
      maxWidth="lg"
    >
      <form onSubmit={handleProcesarPago} className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-3 bg-stone-50/60 dark:bg-stone-900/60 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300 pb-1.5 border-b border-stone-200 dark:border-stone-800">
            <span>Detalle de todas las comandas</span>
            <span>Importe</span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
            {cuenta.pedidos.map((pedido) => (
              <section key={pedido._id} className="space-y-1.5">
                <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">Comanda {pedido.codigo}</p>
                {(pedido.detalles ?? []).map((detalle, index) => (
                  <div key={`${pedido._id}-${index}`} className="flex items-start justify-between gap-2 text-xs text-stone-700 dark:text-stone-300">
                    <div className="min-w-0 pr-2">
                      <span className="font-semibold mr-1">{detalle.cantidad}×</span>
                      <span>{obtenerNombrePlato(detalle)}</span>
                      {detalle.observacion?.trim() && (
                        <span className="block pl-5 text-[10px] text-stone-400 italic">Obs: {detalle.observacion}</span>
                      )}
                    </div>
                    <span className="font-mono shrink-0">Bs {Number(detalle.subtotal ?? detalle.precioUnitario * detalle.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Propina total (Bs)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={montoPropina}
            onChange={(event) => setMontoPropina(event.target.value)}
            leftIcon={<Percent className="w-4 h-4" />}
            disabled={metodoPago === 'QR' || isSubmitting || qrConfirmado}
          />
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-3 bg-white dark:bg-stone-900 space-y-1 text-xs">
            <div className="flex justify-between text-stone-500 dark:text-stone-400">
              <span>Subtotal</span><span>Bs {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-500 dark:text-stone-400">
              <span>Propina</span><span>{propina > 0 ? `Bs ${propina.toFixed(2)}` : 'No añadida'}</span>
            </div>
            <div className="flex justify-between items-center pt-2 mt-1 border-t border-stone-100 dark:border-stone-800 font-bold text-stone-900 dark:text-stone-100">
              <span>Total</span><span className="text-base text-[#C84B26] dark:text-[#E05A36]">Bs {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {metodoPago !== 'QR' && (
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Datos del cliente {metodoPago === 'Tarjeta' ? '(obligatorios para tarjeta)' : '(opcionales)'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Nombre / razón social"
                placeholder="Consumidor Final"
                value={clienteNombre}
                onChange={(event) => setClienteNombre(event.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required={requiereDatosCliente}
              />
              <Input
                label="C.I."
                placeholder="Ej. 6543210"
                value={clienteCI}
                onChange={(event) => setClienteCI(event.target.value)}
                leftIcon={<Hash className="w-4 h-4" />}
                required={requiereDatosCliente}
              />
              <Input
                label="NIT (opcional)"
                placeholder="Ej. 1023456023"
                value={clienteNIT}
                onChange={(event) => setClienteNIT(event.target.value)}
                leftIcon={<Hash className="w-4 h-4" />}
              />
            </div>
          </div>
        )}

        <div className="space-y-3 pt-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Método de pago</h4>
          <div className="grid grid-cols-3 gap-2">
            {(['Efectivo', 'Tarjeta', 'QR'] as const).map((metodo) => {
              const Icono = metodo === 'Efectivo' ? Banknote : metodo === 'Tarjeta' ? CreditCard : QrCode;
              return (
                <button
                  key={metodo}
                  type="button"
                  disabled={qrConfirmado || isSubmitting}
                  onClick={() => void handleSeleccionarMetodo(metodo)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${metodoPago === metodo ? 'border-[#C84B26] bg-[#C84B26]/5 text-[#C84B26] font-semibold dark:bg-[#C84B26]/10' : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                >
                  <Icono className="w-5 h-5" />
                  <span className="text-xs">{metodo === 'Tarjeta' ? 'Tarjeta POS' : metodo === 'QR' ? 'Pago QR' : metodo}</span>
                </button>
              );
            })}
          </div>
        </div>

        {metodoPago === 'Efectivo' && (
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <Input
                label="Monto recibido (Bs)"
                type="number"
                step="0.01"
                min="0"
                placeholder={`Mínimo: Bs ${total.toFixed(2)}`}
                value={montoRecibido}
                onChange={(event) => setMontoRecibido(event.target.value)}
                leftIcon={<Banknote className="w-4 h-4" />}
                required
              />
              <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex flex-col justify-center">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block">Cambio / vuelto</span>
                {vuelto !== null && Number.isFinite(vuelto) ? vuelto >= 0 ? (
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">Bs {vuelto.toFixed(2)}</span>
                ) : (
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" />Faltan Bs {Math.abs(vuelto).toFixed(2)}</span>
                ) : (
                  <span className="text-xs text-stone-400 italic">Ingresa el monto recibido</span>
                )}
              </div>
            </div>
          </div>
        )}

        {metodoPago === 'Tarjeta' && (
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 space-y-3">
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Simulación local de POS. Usa datos ficticios; no introduzcas datos de una tarjeta real. El sistema no guarda estos campos.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Titular de prueba" value={tarjetaTitular} onChange={(event) => setTarjetaTitular(event.target.value)} required />
              <Input label="Número de tarjeta de prueba" value={tarjetaNumero} onChange={(event) => setTarjetaNumero(event.target.value)} required />
              <Input label="Vencimiento (MM/AA)" placeholder="12/30" value={tarjetaVencimiento} onChange={(event) => setTarjetaVencimiento(event.target.value)} required />
              <Input label="CVV de prueba" value={tarjetaCVV} onChange={(event) => setTarjetaCVV(event.target.value)} required />
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Se registrará un pago simulado por Bs {total.toFixed(2)}.</span>
            </div>
          </div>
        )}

        {metodoPago === 'QR' && (
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 space-y-4">
            <div className="text-center space-y-2">
              {isLoadingQR ? (
                <div className="py-8 flex flex-col items-center gap-2"><Spinner size="md" /><span className="text-xs text-stone-500">Preparando enlace de pago...</span></div>
              ) : qrData && imagenQR ? (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="p-3 bg-white rounded-xl shadow-xs border border-stone-200">
                    {/* QR visual del enlace público. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagenQR} alt="Código QR para abrir la cuenta de pago" className="w-52 h-52 object-contain" />
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400">El cliente debe escanearlo y confirmar la simulación desde su teléfono.</p>
                  <a className="text-xs text-[#C84B26] underline inline-flex items-center gap-1" href={qrData.urlPago} target="_blank" rel="noreferrer">
                    <Smartphone className="w-3.5 h-3.5" /> Abrir enlace de pago para probar
                  </a>
                  <p className="text-[11px] font-mono text-stone-500">{qrData.codigoCuenta} · Bs {Number(qrData.total).toFixed(2)}</p>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => void handleSeleccionarMetodo('QR')}>
                  Generar QR de la cuenta
                </Button>
              )}
            </div>

            {qrConfirmado ? (
              <>
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span><strong>Pago QR registrado.</strong> La cuenta fue pagada y la mesa se liberó.</span>
                </div>

                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-200">
                    <Smartphone className="w-4 h-4 text-[#C84B26]" />
                    Enviar recibo por correo
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    El pago ya está confirmado. Introduce el correo del cliente para enviar el recibo completo de la cuenta.
                  </p>
                  {reciboEmailSuccess && <Alert variant="success">{reciboEmailSuccess}</Alert>}
                  {reciboEmailError && <Alert variant="error">{reciboEmailError}</Alert>}
                  <form onSubmit={handleEnviarReciboEmail} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="email"
                      label="Correo electrónico"
                      placeholder="correo@ejemplo.com"
                      value={emailRecibo}
                      onChange={(event) => setEmailRecibo(event.target.value)}
                      autoComplete="email"
                      required
                      disabled={isSendingRecibo}
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      className="shrink-0 self-end"
                      isLoading={isSendingRecibo}
                      disabled={isSendingRecibo || !emailRecibo.trim()}
                    >
                      {isSendingRecibo ? 'Enviando...' : 'Enviar recibo'}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
                El cobro se confirma desde la página pública abierta al escanear el QR. No se debe confirmar aquí desde Caja.
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-200 dark:border-stone-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting || isSendingRecibo}>
            {metodoPago === 'QR' && qrConfirmado ? 'Cerrar' : 'Cancelar'}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting || (metodoPago === 'Efectivo' && montoInsuficiente) || metodoPago === 'QR' || qrConfirmado}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {isSubmitting ? 'Procesando pago...' : metodoPago === 'QR' ? (qrConfirmado ? 'Pago QR registrado' : 'Esperando pago del cliente') : 'Confirmar pago de la cuenta'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

