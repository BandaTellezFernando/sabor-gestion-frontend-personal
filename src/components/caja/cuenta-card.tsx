'use client';

import React from 'react';
import { CuentaMesaDTO } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Utensils, Receipt } from 'lucide-react';

interface CuentaCardProps {
  cuenta: CuentaMesaDTO;
  onCobrar: (cuenta: CuentaMesaDTO) => void;
}

function obtenerNombreMesa(cuenta: CuentaMesaDTO): string {
  return typeof cuenta.mesa === 'string'
    ? 'Mesa'
    : cuenta.mesa?.numero || 'Mesa sin asignar';
}

function obtenerNombreMesero(pedido: CuentaMesaDTO['pedidos'][number]): string {
  if (typeof pedido.usuario === 'string') return 'Mesero asignado';
  const nombre = pedido.usuario?.nombre?.trim() || '';
  const apellido = pedido.usuario?.apellido?.trim() || '';
  return `${nombre} ${apellido}`.trim() || 'Sin mesero';
}

function obtenerNombrePlato(detalle: CuentaMesaDTO['pedidos'][number]['detalles'][number]): string {
  if (detalle.nombrePlato?.trim()) return detalle.nombrePlato.trim();
  return typeof detalle.plato === 'string'
    ? 'Producto'
    : detalle.plato?.nombre?.trim() || 'Producto';
}

const subscribeMinute = (callback: () => void) => {
  const timer = setInterval(callback, 30000);
  return () => clearInterval(timer);
};

const getMinuteSnapshot = () => Math.floor(Date.now() / 60000);
const getServerMinuteSnapshot = () => 0;

export function CuentaCard({ cuenta, onCobrar }: CuentaCardProps) {
  const pedidos = cuenta.pedidos ?? [];
  const totalItems = pedidos.reduce(
    (acumulado, pedido) => acumulado + (pedido.detalles ?? []).reduce((suma, detalle) => suma + Number(detalle.cantidad || 0), 0),
    0,
  );
  const meseroNombre = pedidos.length ? obtenerNombreMesero(pedidos[0]) : 'Sin mesero';
  const currentMinute = React.useSyncExternalStore(subscribeMinute, getMinuteSnapshot, getServerMinuteSnapshot);
  const fechaSolicitud = new Date(cuenta.fechaSolicitud).getTime();
  const solicitudMinute = Number.isFinite(fechaSolicitud) ? Math.floor(fechaSolicitud / 60000) : null;
  const tiempoEspera = solicitudMinute !== null && currentMinute > 0
    ? Math.max(0, currentMinute - solicitudMinute)
    : undefined;

  return (
    <article className="bg-zinc-900 rounded-sm border border-amber-700/30 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.6)] hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(217,119,6,0.15)] transition-all duration-200 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-serif text-lg font-semibold tracking-wide text-stone-100">
                {obtenerNombreMesa(cuenta)}
              </span>
              <Badge variant="mesa-cuenta-solicitada" className="text-[10px]">
                Esperando Pago
              </Badge>
            </div>
            <p className="text-xs font-mono text-amber-500/80 mt-0.5">
              {cuenta.codigoCuenta}
            </p>
            <p className="text-[11px] text-stone-400 font-light mt-1">
              {pedidos.length} {pedidos.length === 1 ? 'comanda agrupada' : 'comandas agrupadas'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-light">Total a pagar</span>
            <span className="font-serif text-xl font-bold text-amber-400">
              Bs {Number(cuenta.total || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-400 font-light pt-2 pb-2.5 border-y border-amber-900/30">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-500/70" />
            <span>{meseroNombre}</span>
          </div>
          {tiempoEspera !== undefined && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500/70" />
              <span>Hace {tiempoEspera} min</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-amber-500/70" />
            <span>{totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}</span>
          </div>
        </div>

        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
          {pedidos.map((pedido) => (
            <section key={pedido._id} className="space-y-1.5">
              <p className="text-[11px] font-mono text-amber-500/70">
                Comanda {pedido.codigo}
              </p>
              {(pedido.detalles ?? []).map((detalle, index) => (
                <div
                  key={`${pedido._id}-${index}`}
                  className="flex items-start justify-between gap-2 text-xs text-stone-300 font-light"
                >
                  <div className="min-w-0 truncate pr-2">
                    <span className="font-mono font-medium text-amber-300 mr-1.5">
                      {Number(detalle.cantidad)}×
                    </span>
                    <span className="text-stone-200">{obtenerNombrePlato(detalle)}</span>
                    {detalle.observacion?.trim() && (
                      <span className="block pl-5 text-[10px] text-stone-500 italic truncate">
                        {detalle.observacion}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-stone-400 shrink-0">
                    Bs {Number(detalle.subtotal ?? Number(detalle.precioUnitario) * Number(detalle.cantidad)).toFixed(2)}
                  </span>
                </div>
              ))}
            </section>
          ))}
        </div>

        <div className="border-t border-amber-900/30 pt-2 space-y-1 text-xs font-light">
          <div className="flex justify-between text-stone-400">
            <span>Subtotal</span>
            <span className="font-mono">Bs {Number(cuenta.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-stone-400">
            <span>Propina de servicio</span>
            <span className="font-mono">Bs {Number(cuenta.montoPropina || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-3 border-t border-amber-900/30">
        <Button
          variant="primary"
          className="w-full justify-center"
          onClick={() => onCobrar(cuenta)}
          leftIcon={<Receipt className="w-4 h-4" />}
        >
          Cobrar Cuenta Completa
        </Button>
      </div>
    </article>
  );
}
