'use client';

import React, { useState, useRef } from 'react';
import { ComprobantePago } from '@/types';
import { pagoService } from '@/services/pago.service';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ApiError } from '@/lib/api-error';
import { CheckCircle2, Mail, Printer, Check } from 'lucide-react';

interface ComprobanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  comprobante: ComprobantePago | null;
}

export function ComprobanteModal({ isOpen, onClose, comprobante }: ComprobanteModalProps) {
  const [email, setEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [reciboEnviado, setReciboEnviado] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const enviarCorreoLockRef = useRef<boolean>(false);

  if (!comprobante) return null;

  const handleEnviarCorreo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !comprobante.pedidoId || enviarCorreoLockRef.current || isSendingEmail) return;

    enviarCorreoLockRef.current = true;
    setIsSendingEmail(true);
    setEmailSuccess(null);
    setEmailError(null);

    try {
      const res = await pagoService.enviarRecibo(comprobante.pedidoId, {
        email: email.trim(),
        clienteNombre: comprobante.clienteNombre,
        clienteCI: comprobante.clienteCI,
      });
      setEmailSuccess(res.mensaje || 'Recibo enviado correctamente por correo electrónico.');
      setReciboEnviado(true);
      setEmail('');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setEmailError(err.getUserMessage());
      } else if (err instanceof Error) {
        setEmailError(err.message);
      } else {
        setEmailError('Error al enviar el recibo por correo.');
      }
    } finally {
      enviarCorreoLockRef.current = false;
      setIsSendingEmail(false);
    }
  };

  const handleImprimir = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comprobante de Pago"
      description="Liquidación registrada y mesa liberada"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Cabecera de Éxito */}
        <div className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
            ¡Pago Procesado Exitosamente!
          </h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
            La comanda ha sido cerrada y la mesa se encuentra libre en el salón.
          </p>
        </div>

        {/* Detalles del Comprobante */}
        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900 space-y-3 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-stone-200 dark:border-stone-800">
            <span className="text-stone-500 dark:text-stone-400">Fecha y Hora (BO):</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {comprobante.fechaBolivia}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-stone-500 dark:text-stone-400">Método de Pago:</span>
            <Badge variant="cajero" className="text-xs">
              {comprobante.metodoPago}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-stone-500 dark:text-stone-400">Mesero responsable:</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {comprobante.meseroNombre}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-stone-500 dark:text-stone-400">Cliente / Razón Social:</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {comprobante.clienteNombre || 'Consumidor Final'}
            </span>
          </div>

          {(comprobante.clienteCI || comprobante.clienteNIT) && (
            <div className="flex justify-between items-center">
              <span className="text-stone-500 dark:text-stone-400">C.I. / NIT:</span>
              <span className="font-mono text-stone-800 dark:text-stone-200">
                {comprobante.clienteCI || comprobante.clienteNIT}
              </span>
            </div>
          )}

          {/* Desglose Financiero */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-1">
            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>Subtotal:</span>
              <span className="font-mono">Bs {Number(comprobante.subtotal || 0).toFixed(2)}</span>
            </div>
            {Number(comprobante.montoDescuento || 0) > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Descuento aplicado:</span>
                <span className="font-mono">- Bs {Number(comprobante.montoDescuento).toFixed(2)}</span>
              </div>
            )}
            {Number(comprobante.montoPropina || 0) > 0 && (
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Propina:</span>
                <span className="font-mono">+ Bs {Number(comprobante.montoPropina).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-stone-200 dark:border-stone-800 text-sm font-bold text-stone-900 dark:text-stone-100">
              <span>Total Pagado:</span>
              <span className="text-base text-[#C84B26] dark:text-[#E05A36]">
                Bs {Number(comprobante.totalPagado || comprobante.total || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Formulario de Envío por Correo */}
        <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <Mail className="w-4 h-4 text-primary" />
            <span>Enviar comprobante digital por correo</span>
          </div>

          {emailSuccess && (
            <Alert variant="success" className="text-xs py-2">
              {emailSuccess}
            </Alert>
          )}

          {emailError && (
            <Alert variant="error" className="text-xs py-2">
              {emailError}
            </Alert>
          )}

          <form onSubmit={handleEnviarCorreo} className="flex gap-2">
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-xs py-1.5"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              isLoading={isSendingEmail}
              disabled={isSendingEmail || !email.trim()}
              className="shrink-0 text-xs"
            >
              {isSendingEmail ? 'Enviando...' : reciboEnviado ? 'Reenviar' : 'Enviar'}
            </Button>
          </form>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-200 dark:border-stone-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleImprimir}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Imprimir
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onClose}
            leftIcon={<Check className="w-4 h-4" />}
          >
            Aceptar y Finalizar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
