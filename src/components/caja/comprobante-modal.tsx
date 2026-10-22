'use client';

import React, { useState, useRef } from 'react';
import { ComprobantePago, ComprobantePdfDTO } from '@/types';
import { pagoService } from '@/services/pago.service';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ApiError } from '@/lib/api-error';
import { CheckCircle2, Mail, Printer, Check, Download, FileText } from 'lucide-react';

interface ComprobanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  comprobante: ComprobantePago | null;
}

function convertirPdfABlob(pdf: ComprobantePdfDTO): Blob {
  const binario = window.atob(pdf.contenidoBase64);
  const bytes = new Uint8Array(binario.length);
  for (let indice = 0; indice < binario.length; indice += 1) {
    bytes[indice] = binario.charCodeAt(indice);
  }
  return new Blob([bytes], { type: pdf.tipoContenido });
}

export function ComprobanteModal({ isOpen, onClose, comprobante }: ComprobanteModalProps) {
  const [email, setEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [reciboEnviado, setReciboEnviado] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const enviarCorreoLockRef = useRef<boolean>(false);

  if (!comprobante) return null;

  const handleEnviarCorreo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !comprobante.pedidoId || comprobante.cuentaId || enviarCorreoLockRef.current || isSendingEmail) return;

    enviarCorreoLockRef.current = true;
    setIsSendingEmail(true);
    setEmailSuccess(null);
    setEmailError(null);

    try {
      const respuesta = await pagoService.enviarRecibo(comprobante.pedidoId, {
        email: email.trim(),
        clienteNombre: comprobante.clienteNombre,
        clienteCI: comprobante.clienteCI,
      });
      setEmailSuccess(respuesta.mensaje || 'Recibo enviado correctamente por correo electrónico.');
      setReciboEnviado(true);
      setEmail('');
    } catch (err: unknown) {
      if (err instanceof ApiError) setEmailError(err.getUserMessage());
      else if (err instanceof Error) setEmailError(err.message);
      else setEmailError('Error al enviar el recibo por correo.');
    } finally {
      enviarCorreoLockRef.current = false;
      setIsSendingEmail(false);
    }
  };

  const descargarPdf = () => {
    if (!comprobante.comprobantePdf) return;
    const blob = convertirPdfABlob(comprobante.comprobantePdf);
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = comprobante.comprobantePdf.nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleImprimir = () => {
    if (comprobante.comprobantePdf) {
      const url = URL.createObjectURL(convertirPdfABlob(comprobante.comprobantePdf));
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      return;
    }
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comprobante de pago"
      description={comprobante.codigoCuenta ? `Cuenta ${comprobante.codigoCuenta} · pago registrado y mesa liberada` : 'Pago registrado correctamente'}
      maxWidth="md"
    >
      <div className="space-y-5">
        <div className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">¡Pago procesado exitosamente!</h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
            {comprobante.cuentaId ? 'Las comandas agrupadas fueron cerradas y la mesa quedó libre.' : 'La comanda fue cerrada y la mesa quedó libre.'}
          </p>
          {comprobante.codigoPago && <p className="text-xs font-mono mt-2 text-emerald-800 dark:text-emerald-300">Pago: {comprobante.codigoPago}</p>}
        </div>

        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900 space-y-3 text-xs">
          <div className="flex justify-between items-center gap-3 pb-2 border-b border-stone-200 dark:border-stone-800">
            <span className="text-stone-500 dark:text-stone-400">Fecha y hora (BO)</span>
            <span className="font-semibold text-right text-stone-800 dark:text-stone-200">{comprobante.fechaBolivia}</span>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-stone-500 dark:text-stone-400">Método de pago</span>
            <Badge variant="cajero" className="text-xs">{comprobante.metodoPago}</Badge>
          </div>
          {comprobante.codigoCuenta && (
            <div className="flex justify-between items-center gap-3">
              <span className="text-stone-500 dark:text-stone-400">Código de cuenta</span>
              <span className="font-mono text-stone-800 dark:text-stone-200">{comprobante.codigoCuenta}</span>
            </div>
          )}
          <div className="flex justify-between items-center gap-3">
            <span className="text-stone-500 dark:text-stone-400">Mesero responsable</span>
            <span className="font-semibold text-right text-stone-800 dark:text-stone-200">{comprobante.meseroNombre || 'No identificado'}</span>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-stone-500 dark:text-stone-400">Cliente / razón social</span>
            <span className="font-semibold text-right text-stone-800 dark:text-stone-200">{comprobante.clienteNombre || 'Consumidor Final'}</span>
          </div>
          {(comprobante.clienteCI || comprobante.clienteNIT) && (
            <div className="flex justify-between items-center gap-3">
              <span className="text-stone-500 dark:text-stone-400">C.I. / NIT</span>
              <span className="font-mono text-stone-800 dark:text-stone-200">{comprobante.clienteCI || comprobante.clienteNIT}</span>
            </div>
          )}

          <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-1">
            <div className="flex justify-between text-stone-600 dark:text-stone-400"><span>Subtotal</span><span className="font-mono">Bs {Number(comprobante.subtotal || 0).toFixed(2)}</span></div>
            {Number(comprobante.montoDescuento || 0) > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400"><span>Descuento aplicado</span><span className="font-mono">- Bs {Number(comprobante.montoDescuento).toFixed(2)}</span></div>
            )}
            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>Propina</span><span className="font-mono">{Number(comprobante.montoPropina || 0) > 0 ? `Bs ${Number(comprobante.montoPropina).toFixed(2)}` : 'No añadida'}</span>
            </div>
            {comprobante.metodoPago === 'Efectivo' && comprobante.montoRecibido !== undefined && (
              <div className="flex justify-between text-stone-600 dark:text-stone-400"><span>Importe recibido</span><span className="font-mono">Bs {Number(comprobante.montoRecibido).toFixed(2)}</span></div>
            )}
            {comprobante.metodoPago === 'Efectivo' && comprobante.cambio !== undefined && (
              <div className="flex justify-between text-stone-600 dark:text-stone-400"><span>Cambio</span><span className="font-mono">Bs {Number(comprobante.cambio).toFixed(2)}</span></div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-stone-200 dark:border-stone-800 text-sm font-bold text-stone-900 dark:text-stone-100">
              <span>Total pagado</span>
              <span className="text-base text-[#C84B26] dark:text-[#E05A36]">Bs {Number(comprobante.totalPagado || comprobante.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {comprobante.comprobantePdf && (
          <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
              <FileText className="w-4 h-4 text-primary" />
              <span>Comprobante PDF detallado de Mishi-Food</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">Incluye todas las comandas, productos, cantidades, precios unitarios, subtotales, observaciones y resumen del pago.</p>
            <Button type="button" variant="outline" size="sm" onClick={descargarPdf} className="w-full justify-center" leftIcon={<Download className="w-4 h-4" />}>
              Descargar comprobante PDF
            </Button>
          </div>
        )}

        {!comprobante.cuentaId && (
          <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300"><Mail className="w-4 h-4 text-primary" /><span>Enviar comprobante digital por correo</span></div>
            {emailSuccess && <Alert variant="success" className="text-xs py-2">{emailSuccess}</Alert>}
            {emailError && <Alert variant="error" className="text-xs py-2">{emailError}</Alert>}
            <form onSubmit={handleEnviarCorreo} className="flex gap-2">
              <Input type="email" placeholder="correo@ejemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} className="text-xs py-1.5" required />
              <Button type="submit" variant="outline" size="sm" isLoading={isSendingEmail} disabled={isSendingEmail || !email.trim()} className="shrink-0 text-xs">
                {isSendingEmail ? 'Enviando...' : reciboEnviado ? 'Reenviar' : 'Enviar'}
              </Button>
            </form>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-200 dark:border-stone-800">
          <Button type="button" variant="outline" size="sm" onClick={handleImprimir} leftIcon={<Printer className="w-4 h-4" />}>Abrir / imprimir PDF</Button>
          <Button type="button" variant="primary" size="md" onClick={onClose} leftIcon={<Check className="w-4 h-4" />}>Aceptar y finalizar</Button>
        </div>
      </div>
    </Modal>
  );
}
