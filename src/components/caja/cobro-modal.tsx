'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PayloadCajaDTO, MetodoPago, ComprobantePago } from '@/types';
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
  Smartphone,
  User,
  Hash,
  Percent,
} from 'lucide-react';

interface CobroModalProps {
  isOpen: boolean;
  onClose: () => void;
  cuenta: PayloadCajaDTO | null;
  onSuccess: (comprobante: ComprobantePago) => void;
}

export function CobroModal({ isOpen, onClose, cuenta, onSuccess }: CobroModalProps) {
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Efectivo');
  const [montoDescuento, setMontoDescuento] = useState<string>('');
  const [montoPropina, setMontoPropina] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [clienteCI, setClienteCI] = useState<string>('');
  const [clienteNIT, setClienteNIT] = useState<string>('');

  // Efectivo
  const [montoRecibido, setMontoRecibido] = useState<string>('');

  // QR
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isLoadingQR, setIsLoadingQR] = useState<boolean>(false);
  const [qrConfirmado, setQrConfirmado] = useState<boolean>(false);
  const [isSimulatingQR, setIsSimulatingQR] = useState<boolean>(false);

  // Estado general y locks inmediatos de concurrencia
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const confirmarPagoLockRef = useRef<boolean>(false);
  const simularQRLockRef = useRef<boolean>(false);

  // Inicialización de campos al abrir con una cuenta
  useEffect(() => {
    if (cuenta) {
      queueMicrotask(() => {
        setMetodoPago('Efectivo');
        setMontoDescuento(cuenta.montoDescuento ? String(cuenta.montoDescuento) : '');
        setMontoPropina(cuenta.montoPropina ? String(cuenta.montoPropina) : '');
        setClienteNombre(cuenta.clienteNombre || '');
        setClienteCI(cuenta.clienteCI || '');
        setClienteNIT(cuenta.clienteNIT || '');
        setMontoRecibido('');
        setQrUrl(null);
        setQrConfirmado(false);
        setError(null);
      });
    }
  }, [cuenta]);

  // Listener WebSocket para confirmación de pago QR en tiempo real
  useSocketEvent<{ pedidoId: string; mensaje: string; fecha?: string }>(
    SOCKET_EVENTS.CAJA_PAGO_CONFIRMADO,
    (data) => {
      if (cuenta && String(data.pedidoId) === String(cuenta.pedidoId)) {
        setQrConfirmado(true);
      }
    }
  );

  if (!cuenta) return null;

  // Cálculos dinámicos
  const subtotalBase = Number(cuenta.subtotal || 0);
  const numDescuento = Math.max(0, Number(montoDescuento) || 0);
  const numPropina = Math.max(0, Number(montoPropina) || 0);
  const totalCalculado = Math.max(0, Number((subtotalBase - numDescuento + numPropina).toFixed(2)));

  const numMontoRecibido = Number(montoRecibido);
  const vuelto = montoRecibido !== '' ? Number((numMontoRecibido - totalCalculado).toFixed(2)) : null;
  const esMontoInsuficiente = vuelto !== null && vuelto < 0;

  // Manejador para generación de QR
  const handleSeleccionarMetodo = async (metodo: MetodoPago) => {
    setMetodoPago(metodo);
    setError(null);

    if (metodo === 'QR' && !qrUrl && cuenta.pedidoId) {
      setIsLoadingQR(true);
      try {
        const res = await pagoService.generarQR(cuenta.pedidoId);
        setQrUrl(res.qrUrl);
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setError(err.getUserMessage());
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error al generar el código QR.');
        }
      } finally {
        setIsLoadingQR(false);
      }
    }
  };

  // Simulación de escaneo QR desde celular
  const handleSimularQR = async () => {
    if (!cuenta.pedidoId || simularQRLockRef.current || isSimulatingQR || qrConfirmado) return;
    simularQRLockRef.current = true;
    setIsSimulatingQR(true);
    setError(null);
    try {
      await pagoService.simularPagoQR(cuenta.pedidoId);
      setQrConfirmado(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.getUserMessage());
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al simular la transferencia QR.');
      }
    } finally {
      simularQRLockRef.current = false;
      setIsSimulatingQR(false);
    }
  };

  // Procesamiento del Pago Final
  const handleProcesarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuenta.pedidoId || confirmarPagoLockRef.current || isSubmitting) return;

    if (metodoPago === 'Efectivo' && esMontoInsuficiente) {
      setError(`El monto recibido (Bs ${numMontoRecibido.toFixed(2)}) es menor al total a pagar (Bs ${totalCalculado.toFixed(2)}).`);
      return;
    }

    confirmarPagoLockRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await pagoService.procesarPago(cuenta.pedidoId, {
        metodoPago,
        montoDescuento: numDescuento > 0 ? numDescuento : undefined,
        montoPropina: numPropina > 0 ? numPropina : undefined,
        clienteNombre: clienteNombre.trim() || undefined,
        clienteCI: clienteCI.trim() || undefined,
        clienteNIT: clienteNIT.trim() || undefined,
      });

      onSuccess(response.comprobante);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.getUserMessage());
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('No se pudo procesar el pago. Por favor intente nuevamente.');
      }
    } finally {
      confirmarPagoLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cobro de Comanda ${cuenta.codigo}`}
      description={`${cuenta.mesaNombre || 'Mesa sin asignar'} • Mesero: ${cuenta.meseroNombre || 'Sin mesero'}`}
      maxWidth="lg"
    >
      <form onSubmit={handleProcesarPago} className="space-y-5">
        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {/* Detalle de Consumo */}
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-3 bg-stone-50/60 dark:bg-stone-900/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300 pb-1.5 border-b border-stone-200 dark:border-stone-800">
            <span>Ítems consumidos</span>
            <span>Subtotal</span>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {cuenta.items?.map((item, idx) => (
              <div
                key={`${item.platoId}-${idx}`}
                className="flex items-center justify-between text-xs text-stone-700 dark:text-stone-300"
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-stone-900 dark:text-stone-100 min-w-[24px] inline-block">
                    {item.cantidad}×
                  </span>
                  <span>{item.nombre}</span>
                  {item.observacion && (
                    <span className="text-[11px] text-stone-400 italic block pl-6">
                      Obs: {item.observacion}
                    </span>
                  )}
                </div>
                <span className="font-mono text-stone-600 dark:text-stone-400 shrink-0">
                  Bs {Number(item.subtotal || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ajustes Financieros: Descuentos y Propinas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Descuento (Bs)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={montoDescuento}
            onChange={(e) => setMontoDescuento(e.target.value)}
            leftIcon={<Percent className="w-4 h-4" />}
          />
          <Input
            label="Propina (Bs)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={montoPropina}
            onChange={(e) => setMontoPropina(e.target.value)}
            leftIcon={<Banknote className="w-4 h-4" />}
          />
        </div>

        {/* Resumen de Liquidación */}
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-3.5 bg-white dark:bg-stone-900 space-y-1.5 text-xs">
          <div className="flex justify-between text-stone-600 dark:text-stone-400">
            <span>Subtotal original:</span>
            <span className="font-mono">Bs {subtotalBase.toFixed(2)}</span>
          </div>
          {numDescuento > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Descuento aplicado:</span>
              <span className="font-mono">- Bs {numDescuento.toFixed(2)}</span>
            </div>
          )}
          {numPropina > 0 && (
            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>Propina voluntaria:</span>
              <span className="font-mono">+ Bs {numPropina.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-stone-100 dark:border-stone-800 text-sm font-bold text-stone-900 dark:text-stone-100">
            <span>Total Liquidación:</span>
            <span className="text-base text-[#C84B26] dark:text-[#E05A36]">
              Bs {totalCalculado.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Datos de Facturación / Cliente (Opcionales) */}
        <div className="space-y-3 pt-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Datos del Cliente (Opcional)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <Input
                label="Nombre / Razón Social"
                placeholder="Consumidor Final"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
              />
            </div>
            <div className="sm:col-span-1">
              <Input
                label="C.I."
                placeholder="Ej. 6543210"
                value={clienteCI}
                onChange={(e) => setClienteCI(e.target.value)}
                leftIcon={<Hash className="w-4 h-4" />}
              />
            </div>
            <div className="sm:col-span-1">
              <Input
                label="NIT"
                placeholder="Ej. 1023456023"
                value={clienteNIT}
                onChange={(e) => setClienteNIT(e.target.value)}
                leftIcon={<Hash className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>

        {/* Selector de Método de Pago */}
        <div className="space-y-3 pt-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Método de Pago
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSeleccionarMetodo('Efectivo')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                metodoPago === 'Efectivo'
                  ? 'border-[#C84B26] bg-[#C84B26]/5 text-[#C84B26] font-semibold dark:bg-[#C84B26]/10'
                  : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span className="text-xs">Efectivo</span>
            </button>

            <button
              type="button"
              onClick={() => handleSeleccionarMetodo('Tarjeta')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                metodoPago === 'Tarjeta'
                  ? 'border-[#C84B26] bg-[#C84B26]/5 text-[#C84B26] font-semibold dark:bg-[#C84B26]/10'
                  : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-xs">Tarjeta POS</span>
            </button>

            <button
              type="button"
              onClick={() => handleSeleccionarMetodo('QR')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                metodoPago === 'QR'
                  ? 'border-[#C84B26] bg-[#C84B26]/5 text-[#C84B26] font-semibold dark:bg-[#C84B26]/10'
                  : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span className="text-xs">Pago QR</span>
            </button>
          </div>
        </div>

        {/* Panel Específico según Método de Pago */}
        {metodoPago === 'Efectivo' && (
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <Input
                label="Monto Recibido del Cliente (Bs)"
                type="number"
                step="0.01"
                min="0"
                placeholder={`Mínimo: Bs ${totalCalculado.toFixed(2)}`}
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
                leftIcon={<Banknote className="w-4 h-4" />}
              />

              <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex flex-col justify-center">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                  Cambio / Vuelto
                </span>
                {vuelto !== null ? (
                  vuelto >= 0 ? (
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      Bs {vuelto.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Faltan Bs {Math.abs(vuelto).toFixed(2)}
                    </span>
                  )
                ) : (
                  <span className="text-xs text-stone-400 italic">
                    Ingrese el monto recibido
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {metodoPago === 'Tarjeta' && (
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-xs text-stone-600 dark:text-stone-400 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-stone-400 shrink-0" />
            <p>
              Procese la transacción por un total de{' '}
              <strong className="text-stone-900 dark:text-stone-100 font-bold">
                Bs {totalCalculado.toFixed(2)}
              </strong>{' '}
              en el terminal POS bancario. Al confirmar, el sistema registrará la comanda como pagada.
            </p>
          </div>
        )}

        {metodoPago === 'QR' && (
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 space-y-4">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              {isLoadingQR ? (
                <div className="py-8 flex flex-col items-center gap-2">
                  <Spinner size="md" />
                  <span className="text-xs text-stone-500">Generando código QR...</span>
                </div>
              ) : qrUrl ? (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="p-3 bg-white rounded-xl shadow-xs border border-stone-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrUrl}
                      alt="Código QR de Pago"
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  <p className="text-xs text-stone-500">
                    El cliente debe escanear este código desde su aplicación bancaria Simple / QR.
                  </p>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSeleccionarMetodo('QR')}
                >
                  Generar QR de Cobro
                </Button>
              )}
            </div>

            {/* Notificación de Confirmación en Tiempo Real */}
            {qrConfirmado ? (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>¡Transferencia confirmada!</strong> Se recibió la señal de pago QR correctamente.
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Esperando confirmación de transferencia bancaria...</span>
                </div>

                {/* Botón de Simulación de Prueba Móvil */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isSimulatingQR}
                  disabled={isSimulatingQR || qrConfirmado}
                  onClick={handleSimularQR}
                  leftIcon={<Smartphone className="w-3.5 h-3.5" />}
                  className="shrink-0 text-xs py-1 h-8"
                  title="Simula la señal enviada por la aplicación bancaria del cliente"
                >
                  {isSimulatingQR ? 'Simulando...' : 'Simular Pago Móvil'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Acciones de Cierre */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting || (metodoPago === 'Efectivo' && esMontoInsuficiente)}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {isSubmitting ? 'Procesando pago...' : 'Confirmar y Cerrar Comanda'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
