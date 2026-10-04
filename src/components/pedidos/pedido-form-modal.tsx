'use client';

import React, { useState, useMemo } from 'react';
import {
  Pedido,
  Mesa,
  Plato,
  CrearPedidoDTO,
  ActualizarPedidoDTO,
  DetallePedidoItemDTO,
} from '@/types';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Plus, Minus, Trash2, Search, Utensils } from 'lucide-react';

export interface PedidoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCreate: (data: CrearPedidoDTO) => Promise<void>;
  onSaveUpdate?: (id: string, data: ActualizarPedidoDTO) => Promise<void>;
  pedidoToEdit?: Pedido | null;
  mesas: Mesa[];
  platos: Plato[];
}

interface ItemDetalleForm {
  platoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  observacion: string;
}

interface PedidoFormContentProps {
  onClose: () => void;
  onSaveCreate: (data: CrearPedidoDTO) => Promise<void>;
  onSaveUpdate?: (id: string, data: ActualizarPedidoDTO) => Promise<void>;
  pedidoToEdit?: Pedido | null;
  mesas: Mesa[];
  platos: Plato[];
}

function PedidoFormContent({
  onClose,
  onSaveCreate,
  onSaveUpdate,
  pedidoToEdit,
  mesas,
  platos,
}: PedidoFormContentProps) {
  const isEditing = Boolean(pedidoToEdit);

  // Inicializar mesa seleccionada
  const initialMesaId = useMemo(() => {
    if (!pedidoToEdit?.mesa) return '';
    return typeof pedidoToEdit.mesa === 'object' ? pedidoToEdit.mesa._id : pedidoToEdit.mesa;
  }, [pedidoToEdit]);

  // Inicializar items
  const initialItems = useMemo<ItemDetalleForm[]>(() => {
    if (!pedidoToEdit?.detalles) return [];
    return pedidoToEdit.detalles.map((d) => {
      const pId = typeof d.plato === 'object' ? d.plato._id : d.plato;
      const platoObj = platos.find((p) => p._id === pId);
      return {
        platoId: pId,
        nombre: d.nombrePlato || platoObj?.nombre || 'Plato',
        precio: d.precioUnitario ?? platoObj?.precio ?? 0,
        cantidad: d.cantidad || 1,
        observacion: d.observacion || '',
      };
    });
  }, [pedidoToEdit, platos]);

  const [selectedMesaId, setSelectedMesaId] = useState<string>(initialMesaId);
  const [items, setItems] = useState<ItemDetalleForm[]>(initialItems);

  // Datos del cliente
  const [clienteNombre, setClienteNombre] = useState(pedidoToEdit?.clienteNombre || '');
  const [clienteCI, setClienteCI] = useState(pedidoToEdit?.clienteCI || '');
  const [clienteNIT, setClienteNIT] = useState(pedidoToEdit?.clienteNIT || '');

  // Ajustes financieros opcionales
  const [montoDescuento, setMontoDescuento] = useState<number>(pedidoToEdit?.montoDescuento || 0);
  const [montoPropina, setMontoPropina] = useState<number>(pedidoToEdit?.montoPropina || 0);

  // Búsqueda de platos en catálogo
  const [platoSearch, setPlatoSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [faltantesList, setFaltantesList] = useState<string[]>([]);

  // Filtrar platos disponibles para selección
  const availablePlatos = useMemo(() => {
    return platos.filter((p) => {
      const matchSearch = p.nombre.toLowerCase().includes(platoSearch.toLowerCase());
      return matchSearch;
    });
  }, [platos, platoSearch]);

  // Agregar plato a la comanda
  const handleAddPlato = (plato: Plato) => {
    if (!plato.disponible) return;
    setItems((prev) => {
      const existing = prev.find((item) => item.platoId === plato._id);
      if (existing) {
        return prev.map((item) =>
          item.platoId === plato._id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [
        ...prev,
        {
          platoId: plato._id,
          nombre: plato.nombre,
          precio: Number(plato.precio || 0),
          cantidad: 1,
          observacion: '',
        },
      ];
    });
  };

  const handleUpdateCantidad = (platoId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.platoId === platoId) {
            const newQty = item.cantidad + delta;
            return newQty > 0 ? { ...item, cantidad: newQty } : null;
          }
          return item;
        })
        .filter((item): item is ItemDetalleForm => item !== null)
    );
  };

  const handleUpdateObservacion = (platoId: string, observacion: string) => {
    setItems((prev) =>
      prev.map((item) => (item.platoId === platoId ? { ...item, observacion } : item))
    );
  };

  const handleRemoveItem = (platoId: string) => {
    setItems((prev) => prev.filter((item) => item.platoId !== platoId));
  };

  // Cálculo visual de ayuda (autoridad final en backend)
  const subtotalVisual = useMemo(() => {
    return items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  }, [items]);

  const totalVisual = useMemo(() => {
    return Math.max(0, subtotalVisual - (Number(montoDescuento) || 0) + (Number(montoPropina) || 0));
  }, [subtotalVisual, montoDescuento, montoPropina]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFaltantesList([]);

    if (!isEditing && !selectedMesaId.trim()) {
      setFormError('Debes seleccionar una mesa física disponible para abrir la comanda.');
      return;
    }

    if (items.length === 0) {
      setFormError('Debes agregar al menos un plato a la comanda.');
      return;
    }

    if (montoDescuento < 0) {
      setFormError('El monto de descuento no puede ser negativo.');
      return;
    }

    if (montoPropina < 0) {
      setFormError('El monto de propina no puede ser negativo.');
      return;
    }

    setIsSubmitting(true);

    const detallesPayload: DetallePedidoItemDTO[] = items.map((it) => ({
      plato: it.platoId,
      cantidad: it.cantidad,
      observacion: it.observacion.trim() || undefined,
    }));

    try {
      if (isEditing && pedidoToEdit && onSaveUpdate) {
        await onSaveUpdate(pedidoToEdit._id, {
          detalles: detallesPayload,
          montoDescuento: Number(montoDescuento) || 0,
          montoPropina: Number(montoPropina) || 0,
          clienteNombre: clienteNombre.trim() || undefined,
          clienteCI: clienteCI.trim() || undefined,
          clienteNIT: clienteNIT.trim() || undefined,
        });
      } else {
        await onSaveCreate({
          mesa: selectedMesaId,
          detalles: detallesPayload,
          montoDescuento: Number(montoDescuento) || 0,
          montoPropina: Number(montoPropina) || 0,
          clienteNombre: clienteNombre.trim() || undefined,
          clienteCI: clienteCI.trim() || undefined,
          clienteNIT: clienteNIT.trim() || undefined,
        });
      }
      onClose();
    } catch (err: unknown) {
      let mensaje = 'Error al procesar la comanda.';
      if (err && typeof err === 'object') {
        const errorObj = err as Record<string, unknown>;
        if (typeof errorObj.message === 'string') mensaje = errorObj.message;
        if (typeof errorObj.mensaje === 'string') mensaje = errorObj.mensaje;
        if (Array.isArray(errorObj.faltantes)) {
          setFaltantesList(errorObj.faltantes as string[]);
        }
      }
      setFormError(mensaje);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <Alert variant="error" title="No se pudo registrar el pedido">
          <p>{formError}</p>
          {faltantesList.length > 0 && (
            <div className="mt-2 text-xs">
              <span className="font-semibold">Ingredientes faltantes o no disponibles:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {faltantesList.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </Alert>
      )}

      {/* 1. Selección de Mesa */}
      <div>
        <label
          htmlFor="pedido-mesa"
          className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5"
        >
          Mesa Asignada <span className="text-rose-500">*</span>
        </label>
        <select
          id="pedido-mesa"
          value={selectedMesaId}
          disabled={isEditing}
          onChange={(e) => setSelectedMesaId(e.target.value)}
          className="w-full py-2.5 px-3 min-h-[42px] text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
          required
        >
          <option value="">-- Selecciona una mesa disponible --</option>
          {mesas.map((m) => {
            const isCurrent = m._id === initialMesaId;
            const isLibre = m.estado === 'Libre';
            // Solo permitir mesas libres o la mesa actualmente asignada al pedido
            if (!isLibre && !isCurrent) return null;
            return (
              <option key={m._id} value={m._id}>
                {m.numero} ({m.ubicacion || 'Salón'}) - Capacidad: {m.capacidad} personas
                {isCurrent ? ' [Mesa actual]' : ''}
              </option>
            );
          })}
        </select>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          {isEditing
            ? 'La mesa asignada no puede modificarse una vez creada la comanda.'
            : 'Selecciona una mesa física en estado Libre para abrir la comanda.'}
        </p>
      </div>

      {/* 2. Catálogo y Selección de Platos */}
      <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-amber-600" />
            Seleccionar Platos
          </label>
          <span className="text-xs text-zinc-500">
            {items.length} {items.length === 1 ? 'ítem agregado' : 'ítems agregados'}
          </span>
        </div>

        {/* Buscador de Platos */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar plato en el catálogo..."
            value={platoSearch}
            onChange={(e) => setPlatoSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[38px]"
          />
        </div>

        {/* Lista compacta de Platos Disponibles */}
        <div className="max-h-44 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 divide-y divide-zinc-100 dark:divide-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
          {availablePlatos.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-3">No hay platos que coincidan.</p>
          ) : (
            availablePlatos.map((p) => {
              const isAdded = items.some((it) => it.platoId === p._id);
              return (
                <div
                  key={p._id}
                  className="py-2 px-2.5 flex items-center justify-between text-xs hover:bg-white dark:hover:bg-zinc-800/60 rounded-md transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate block text-xs sm:text-sm">
                      {p.nombre}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      Bs. {Number(p.precio || 0).toFixed(2)}
                    </span>
                  </div>

                  {p.disponible ? (
                    <Button
                      type="button"
                      variant={isAdded ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => handleAddPlato(p)}
                      className="min-h-[34px] px-3 text-xs font-semibold shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      {isAdded ? 'Agregar más' : 'Agregar'}
                    </Button>
                  ) : (
                    <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 shrink-0">
                      No disponible
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Comanda Actual (Items Agregados) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Comanda Actual
        </label>

        {items.length === 0 ? (
          <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-4 text-center text-xs text-zinc-400">
            No has agregado ningún plato. Selecciona uno del catálogo superior.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {items.map((it) => (
              <div
                key={it.platoId}
                className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-xs sm:text-sm">
                    {it.nombre}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-zinc-600 dark:text-zinc-400 font-mono font-medium text-xs sm:text-sm">
                      Bs. {(it.precio * it.cantidad).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-md p-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateCantidad(it.platoId, -1)}
                        className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors active:scale-95 cursor-pointer"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {it.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateCantidad(it.platoId, 1)}
                        className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors active:scale-95 cursor-pointer"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(it.platoId)}
                      className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-zinc-400 hover:text-rose-600 rounded transition-colors active:scale-95 cursor-pointer"
                      title="Quitar plato"
                      aria-label={`Quitar ${it.nombre} de la comanda`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Observación de cocina (ej. sin cebolla, término medio)..."
                  value={it.observacion}
                  onChange={(e) => handleUpdateObservacion(it.platoId, e.target.value)}
                  className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[36px]"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Datos Comerciales del Comensal (Opcional) */}
      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Datos del Comensal (NIT / CI Opcional)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <Input
            id="pedido-cliente-nombre"
            name="clienteNombre"
            label="Nombre o Razón Social"
            placeholder="Ej. Juan Pérez"
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            id="pedido-cliente-ci"
            name="clienteCI"
            label="Cédula de Identidad (CI)"
            placeholder="Ej. 6543210"
            value={clienteCI}
            onChange={(e) => setClienteCI(e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            id="pedido-cliente-nit"
            name="clienteNIT"
            label="NIT"
            placeholder="Ej. 1020304050"
            value={clienteNIT}
            onChange={(e) => setClienteNIT(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* 5. Ajustes Financieros y Total Estimado */}
      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="pedido-descuento"
              className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Descuento (Bs.)
            </label>
            <input
              id="pedido-descuento"
              type="number"
              min="0"
              step="0.5"
              value={montoDescuento}
              onChange={(e) => setMontoDescuento(Math.max(0, Number(e.target.value) || 0))}
              disabled={isSubmitting}
              className="w-full py-2 px-3 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[38px]"
            />
          </div>

          <div>
            <label
              htmlFor="pedido-propina"
              className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Propina (Bs.)
            </label>
            <input
              id="pedido-propina"
              type="number"
              min="0"
              step="0.5"
              value={montoPropina}
              onChange={(e) => setMontoPropina(Math.max(0, Number(e.target.value) || 0))}
              disabled={isSubmitting}
              className="w-full py-2 px-3 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[38px]"
            />
          </div>
        </div>

        {/* Resumen Visual */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="text-xs text-zinc-500 space-y-0.5">
            <div>Subtotal comanda: Bs. {subtotalVisual.toFixed(2)}</div>
            <div className="text-[11px] text-zinc-400">
              * El total oficial es calculado por el servidor.
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-500 block">Total Estimado</span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-50 font-mono">
              Bs. {totalVisual.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isSubmitting} className="min-h-[40px] px-4 font-medium">
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} className="min-h-[40px] px-5 font-semibold">
          {isEditing ? 'Guardar Cambios' : 'Confirmar Comanda'}
        </Button>
      </div>
    </form>
  );
}

export function PedidoFormModal({
  isOpen,
  onClose,
  onSaveCreate,
  onSaveUpdate,
  pedidoToEdit,
  mesas,
  platos,
}: PedidoFormModalProps) {
  const isEditing = Boolean(pedidoToEdit);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar Comanda ${pedidoToEdit?.codigo}` : 'Apertura de Nuevo Pedido'}
      description={
        isEditing
          ? 'Modifica los platos, observaciones o datos del comensal para la mesa asignada.'
          : 'Selecciona una mesa disponible y agrega los platos solicitados por los comensales.'
      }
      maxWidth="lg"
    >
      <PedidoFormContent
        key={pedidoToEdit?._id || 'nuevo-pedido'}
        onClose={onClose}
        onSaveCreate={onSaveCreate}
        onSaveUpdate={onSaveUpdate}
        pedidoToEdit={pedidoToEdit}
        mesas={mesas}
        platos={platos}
      />
    </Modal>
  );
}
