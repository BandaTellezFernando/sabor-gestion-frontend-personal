'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSocketEvent } from '@/hooks/use-socket';
import { SOCKET_EVENTS } from '@/lib/socket';
import { pedidoService } from '@/services/pedido.service';
import { Pedido, Mesa, DetallePedido, CocinaPedidoRecogidoPayload, MesasAlertaListoPayload } from '@/types';
import { Bell, ChefHat, CheckCircle2, ArrowRight } from 'lucide-react';

function esPedidoDelMesero(pedido: Pedido, userId: string, userRol: string): boolean {
  if (userRol === 'Administrador') return true;
  if (!pedido || !pedido.usuario) return false;
  const meseroId =
    typeof pedido.usuario === 'object' && pedido.usuario !== null
      ? String(pedido.usuario._id || pedido.usuario.id || '')
      : String(pedido.usuario);
  return meseroId === String(userId);
}

function getMesaNombre(mesa: string | Mesa | undefined): string {
  if (!mesa) return 'Mesa';
  if (typeof mesa === 'object' && mesa !== null && 'numero' in mesa) {
    return `Mesa ${mesa.numero}`;
  }
  if (typeof mesa === 'string') {
    if (/^[0-9a-fA-F]{24}$/.test(mesa)) return `Mesa (${mesa.slice(-4)})`;
    return mesa.toLowerCase().startsWith('mesa') ? mesa : `Mesa ${mesa}`;
  }
  return 'Mesa';
}

function getPlatoNombre(detalle: DetallePedido): string {
  if (detalle.nombrePlato) return detalle.nombrePlato;
  if (typeof detalle.plato === 'object' && detalle.plato !== null && 'nombre' in detalle.plato) {
    return detalle.plato.nombre;
  }
  return 'Plato';
}

export function NotificacionesMesero() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [pedidosListos, setPedidosListos] = useState<Pedido[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Solo Mesero y Administrador reciben y gestionan pedidos listos
  const shouldRender = user && (user.rol === 'Mesero' || user.rol === 'Administrador');

  // Carga inicial y refresco de pedidos listos
  const fetchPedidosListos = useCallback(async () => {
    if (!user) return;
    try {
      const data = await pedidoService.getPedidos({ activo: true });
      const filtrados = data.filter(
        (p) =>
          p.estado === 'ENTREGADO' &&
          p.recogido !== true &&
          esPedidoDelMesero(p, user.id, user.rol)
      );
      setPedidosListos(filtrados);
    } catch {
      // Ignorar fallas transitorias de red
    }
  }, [user]);

  useEffect(() => {
    if (shouldRender) {
      queueMicrotask(() => {
        void fetchPedidosListos();
      });
    }
  }, [shouldRender, fetchPedidosListos]);

  // Manejo del evento mesas:alerta_listo (emitido a room:meseros)
  const handleAlertaListo = useCallback(() => {
    // Cuando cocina termina un pedido, sincronizar la lista de listos
    void fetchPedidosListos();
  }, [fetchPedidosListos]);

  // Manejo del evento cocina:actualizar_tablero (broadcast con Pedido completo)
  const handleActualizarTablero = useCallback(
    (pedidoActualizado: Pedido) => {
      if (!user) return;
      if (!pedidoActualizado || !pedidoActualizado._id) return;

      setPedidosListos((prev) => {
        const id = pedidoActualizado._id;
        const pertenece = esPedidoDelMesero(pedidoActualizado, user.id, user.rol);
        const esListo = pedidoActualizado.estado === 'ENTREGADO' && pedidoActualizado.recogido !== true;

        if (pertenece && esListo) {
          const index = prev.findIndex((p) => p._id === id || p.codigo === pedidoActualizado.codigo);
          if (index >= 0) {
            const copia = [...prev];
            copia[index] = { ...copia[index], ...pedidoActualizado };
            return copia;
          }
          return [pedidoActualizado, ...prev];
        }

        // Si ya fue recogido o cambió de estado, remover de la lista
        return prev.filter((p) => p._id !== id && p.codigo !== pedidoActualizado.codigo);
      });
    },
    [user]
  );

  // Manejo del evento cocina:pedido_recogido (emitido al recoger comanda)
  const handlePedidoRecogido = useCallback((data: CocinaPedidoRecogidoPayload) => {
    if (!data || !data.pedidoId) return;
    setPedidosListos((prev) =>
      prev.filter((p) => p._id !== data.pedidoId && p.codigo !== data.pedidoId)
    );
  }, []);

  useSocketEvent<MesasAlertaListoPayload>(SOCKET_EVENTS.MESAS_ALERTA_LISTO, handleAlertaListo);
  useSocketEvent<Pedido>(SOCKET_EVENTS.COCINA_ACTUALIZAR_TABLERO, handleActualizarTablero);
  useSocketEvent<CocinaPedidoRecogidoPayload>(SOCKET_EVENTS.COCINA_PEDIDO_RECOGIDO, handlePedidoRecogido);

  // Cerrar al hacer clic afuera o con Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  const count = pedidosListos.length;

  const handleSelectPedido = (pedidoId: string) => {
    setIsOpen(false);
    router.push(`/dashboard/pedidos?focus=${pedidoId}`);
  };

  return (
    <div className="relative">
      {/* Botón Campanita */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
        aria-label={
          count > 0
            ? `Notificaciones: ${count} ${count === 1 ? 'pedido listo' : 'pedidos listos'} para recoger`
            : 'Notificaciones de pedidos'
        }
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={count > 0 ? `${count} ${count === 1 ? 'pedido listo' : 'pedidos listos'} para recoger` : 'Sin pedidos pendientes'}
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-rose-600 rounded-full border-2 border-white dark:border-zinc-900 shadow-xs animate-pulse">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Popover / Menú desplegable */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Cabecera del Popover */}
          <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Pedidos Listos para Recoger
              </h3>
            </div>
            {count > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                {count} {count === 1 ? 'pendiente' : 'pendientes'}
              </span>
            )}
          </div>

          {/* Lista de Pedidos */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 p-1">
            {pedidosListos.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  Todo al día
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                  No tienes pedidos pendientes de recoger en este momento.
                </p>
              </div>
            ) : (
              pedidosListos.map((pedido) => {
                const resumenPlatos = (pedido.detalles || [])
                  .map((d) => `${d.cantidad}x ${getPlatoNombre(d)}`)
                  .join(', ');

                return (
                  <button
                    key={pedido._id}
                    type="button"
                    onClick={() => handleSelectPedido(pedido._id)}
                    className="w-full text-left p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors flex items-start justify-between gap-3 group focus:outline-hidden focus-visible:bg-stone-100 dark:focus-visible:bg-stone-800"
                    role="menuitem"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100">
                          {pedido.codigo}
                        </span>
                        <span className="text-stone-300 dark:text-stone-600">·</span>
                        <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                          {getMesaNombre(pedido.mesa)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate leading-relaxed">
                        {resumenPlatos || 'Sin platos registrados'}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center text-stone-400 group-hover:text-primary dark:group-hover:text-primary-light transition-colors pt-1">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pie del Popover */}
          <div className="p-2.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push('/dashboard/pedidos');
              }}
              className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold text-center text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Ir a la bandeja de Pedidos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
