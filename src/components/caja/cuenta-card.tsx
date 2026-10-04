'use client';

import React from 'react';
import { PayloadCajaDTO } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Utensils, Receipt } from 'lucide-react';

interface CuentaCardProps {
  cuenta: PayloadCajaDTO;
  onCobrar: (cuenta: PayloadCajaDTO) => void;
}

export function CuentaCard({ cuenta, onCobrar }: CuentaCardProps) {
  const totalItems = cuenta.items?.reduce((acc, item) => acc + item.cantidad, 0) || 0;

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Encabezado: Mesa y Código */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-stone-900 dark:text-stone-100">
                {cuenta.mesaNombre || 'Mesa sin asignar'}
              </span>
              <Badge variant="mesa-cuenta-solicitada" className="text-xs">
                Cuenta Solicitada
              </Badge>
            </div>
            <p className="text-xs font-mono text-stone-500 dark:text-stone-400 mt-0.5">
              {cuenta.codigo}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-stone-500 dark:text-stone-400 block">Total a Pagar</span>
            <span className="text-lg font-bold text-[#C84B26] dark:text-[#E05A36]">
              Bs {Number(cuenta.total || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Metadatos: Mesero y Tiempo */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-600 dark:text-stone-400 pt-1 pb-2 border-y border-stone-100 dark:border-stone-800/80">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-stone-400" />
            <span>{cuenta.meseroNombre || 'Sin mesero'}</span>
          </div>
          {cuenta.tiempoEsperaMinutos !== undefined && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>Hace {cuenta.tiempoEsperaMinutos} min</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-stone-400" />
            <span>{totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}</span>
          </div>
        </div>

        {/* Resumen de ítems */}
        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
          {cuenta.items?.map((item, idx) => (
            <div
              key={`${item.platoId}-${idx}`}
              className="flex items-center justify-between text-xs py-0.5 text-stone-700 dark:text-stone-300"
            >
              <div className="flex items-center gap-1.5 truncate pr-2">
                <span className="font-semibold text-stone-900 dark:text-stone-100 min-w-[20px]">
                  {item.cantidad}×
                </span>
                <span className="truncate">{item.nombre}</span>
              </div>
              <span className="font-mono text-stone-500 dark:text-stone-400 shrink-0">
                Bs {Number(item.subtotal || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Acción de Cobro */}
      <div className="pt-4 mt-2 border-t border-stone-100 dark:border-stone-800">
        <Button
          variant="primary"
          className="w-full justify-center"
          onClick={() => onCobrar(cuenta)}
          leftIcon={<Receipt className="w-4 h-4" />}
        >
          Cobrar
        </Button>
      </div>
    </div>
  );
}
