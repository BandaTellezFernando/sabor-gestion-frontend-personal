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

export function CuentaCard({ cuenta, onCobrar }: CuentaCardProps) {
  const pedidos = cuenta.pedidos ?? [];
  const totalItems = pedidos.reduce(
    (acumulado, pedido) => acumulado + (pedido.detalles ?? []).reduce((suma, detalle) => suma + Number(detalle.cantidad || 0), 0),
    0,
  );
  const meseroNombre = pedidos.length ? obtenerNombreMesero(pedidos[0]) : 'Sin mesero';
  const fechaSolicitud = new Date(cuenta.fechaSolicitud).getTime();
  const tiempoEspera = Number.isFinite(fechaSolicitud)
    ? Math.max(0, Math.floor((Date.now() - fechaSolicitud) / 60000))
    : undefined;

  return (
    <article className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-stone-900 dark:text-stone-100">
                {obtenerNombreMesa(cuenta)}
              </span>
              <Badge variant="mesa-cuenta-solicitada" className="text-xs">
                Pendiente
              </Badge>
            </div>
            <p className="text-xs font-mono text-stone-500 dark:text-stone-400 mt-0.5">
              {cuenta.codigoCuenta}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              {pedidos.length} {pedidos.length === 1 ? 'comanda agrupada' : 'comandas agrupadas'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs text-stone-500 dark:text-stone-400 block">Total a pagar</span>
            <span className="text-lg font-bold text-[#C84B26] dark:text-[#E05A36]">
              Bs {Number(cuenta.total || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-600 dark:text-stone-400 pt-1 pb-2 border-y border-stone-100 dark:border-stone-800/80">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-stone-400" />
            <span>{meseroNombre}</span>
          </div>
          {tiempoEspera !== undefined && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>Hace {tiempoEspera} min</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-stone-400" />
            <span>{totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}</span>
          </div>
        </div>

        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
          {pedidos.map((pedido) => (
            <section key={pedido._id} className="space-y-1.5">
              <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                Comanda {pedido.codigo}
              </p>
              {(pedido.detalles ?? []).map((detalle, index) => (
                <div
                  key={`${pedido._id}-${index}`}
                  className="flex items-start justify-between gap-2 text-xs text-stone-700 dark:text-stone-300"
                >
                  <div className="min-w-0 truncate pr-2">
                    <span className="font-semibold text-stone-900 dark:text-stone-100 mr-1">
                      {Number(detalle.cantidad)}×
                    </span>
                    <span>{obtenerNombrePlato(detalle)}</span>
                    {detalle.observacion?.trim() && (
                      <span className="block pl-5 text-[10px] text-stone-400 italic truncate">
                        {detalle.observacion}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-stone-500 dark:text-stone-400 shrink-0">
                    Bs {Number(detalle.subtotal ?? Number(detalle.precioUnitario) * Number(detalle.cantidad)).toFixed(2)}
                  </span>
                </div>
              ))}
            </section>
          ))}
        </div>

        <div className="border-t border-stone-100 dark:border-stone-800 pt-2 space-y-1 text-xs">
          <div className="flex justify-between text-stone-500 dark:text-stone-400">
            <span>Subtotal</span>
            <span>Bs {Number(cuenta.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-stone-500 dark:text-stone-400">
            <span>Propina incluida</span>
            <span>Bs {Number(cuenta.montoPropina || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-2 border-t border-stone-100 dark:border-stone-800">
        <Button
          variant="primary"
          className="w-full justify-center"
          onClick={() => onCobrar(cuenta)}
          leftIcon={<Receipt className="w-4 h-4" />}
        >
          Cobrar cuenta completa
        </Button>
      </div>
    </article>
  );
}
