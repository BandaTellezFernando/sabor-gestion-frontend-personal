//src/components/mesas/comanda-modal.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Mesa, Plato, CrearPedidoDTO, ComandaDraft, ComandaDraftItem, Pedido } from '@/types';
import { platoService } from '@/services/plato.service';
import { pedidoService } from '@/services/pedido.service';
import { mesaService } from '@/services/mesa.service';
import { ApiError } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Clock,
  Search,
  UtensilsCrossed,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Save,
  Info,
  Minimize2,
} from 'lucide-react';

export interface ComandaModalProps {
  isOpen: boolean;
  mesa: Mesa | null;
  expiraEn: string | Date | null;
  onClose: () => void;
  onMinimize?: () => void;
  onSuccess: (pedido: Pedido) => void;
  onMesaLiberada: (mesaId: string) => void;
  onExpired?: (mesaId: string) => void;
}

export function ComandaModal({
  isOpen,
  mesa,
  expiraEn,
  onClose,
  onMinimize,
  onSuccess,
  onMesaLiberada,
  onExpired,
}: ComandaModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  // Catálogo de platos
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [isLoadingPlatos, setIsLoadingPlatos] = useState<boolean>(true);
  const [platosError, setPlatosError] = useState<string | null>(null);

  // Filtros de búsqueda en catálogo
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  // Items de la comanda
  const [items, setItems] = useState<ComandaDraftItem[]>([]);
  const [draftRestored, setDraftRestored] = useState<boolean>(false);

  // Estados de envío y errores
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Diálogo de confirmación de cancelación (X)
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Temporizador regresivo de 10 minutos
  const [secondsLeft, setSecondsLeft] = useState<number>(600);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const draftKey = mesa ? `mishi-food-comanda-draft:${mesa._id}` : null;

  // ─── 1. Cálculo del Contador Regresivo contra expiraEn ─────────────
  useEffect(() => {
    if (!isOpen || !expiraEn) return;

    const calculateRemaining = () => {
      const expiryTimestamp = new Date(expiraEn).getTime();
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((expiryTimestamp - now) / 1000));
      setSecondsLeft(diffSec);

      if (diffSec <= 0) {
        setIsExpired(true);
        if (mesa && onExpired) {
          onExpired(mesa._id);
        }
      } else {
        setIsExpired(false);
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [isOpen, expiraEn, mesa, onExpired]);

  // Formato mm:ss
  const formattedTime = useMemo(() => {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [secondsLeft]);

  // ─── 2. Cargar Catálogo de Platos Disponibles ───────────────────────
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchPlatos = async () => {
      setIsLoadingPlatos(true);
      setPlatosError(null);
      try {
        const list = await platoService.getPlatos();
        if (isMounted) {
          // Filtrar platos activos y disponibles
          const disponibles = list.filter((p) => p.disponible !== false);
          setPlatos(disponibles);

          // Reconciliar items existentes del borrador con los platos disponibles
          setItems((currentItems) =>
            currentItems.map((item) => {
              const platoReal = disponibles.find((p) => p._id === item.platoId);
              if (platoReal) {
                return {
                  ...item,
                  nombre: platoReal.nombre,
                  precio: platoReal.precio,
                  imagenUrl: platoReal.imagenUrl,
                };
              }
              return item;
            })
          );
        }
      } catch (err: unknown) {
        if (isMounted) {
          setPlatosError(
            err instanceof Error ? err.message : 'Error al cargar el menú de platos.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlatos(false);
        }
      }
    };

    void fetchPlatos();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // ─── 3. Gestión y Reconciliación del Borrador en localStorage ──────
  // Recuperar borrador al abrir (diferido con microtask para evitar render en cascada)
  useEffect(() => {
    queueMicrotask(() => {
      if (!isOpen || !draftKey) {
        setItems([]);
        setDraftRestored(false);
        return;
      }

      try {
        const stored = localStorage.getItem(draftKey);
        if (stored) {
          const parsed: ComandaDraft = JSON.parse(stored);
          if (Array.isArray(parsed.items) && parsed.items.length > 0) {
            setItems(parsed.items);
            setDraftRestored(true);
          }
        }
      } catch {
        // Ignorar fallas de lectura de localStorage
      }
    });
  }, [isOpen, draftKey]);

  // Persistir cambios en localStorage
  useEffect(() => {
    if (!isOpen || !draftKey || !mesa) return;

    if (items.length > 0) {
      const draft: ComandaDraft = {
        mesaId: mesa._id,
        mesaNumero: mesa.numero,
        ocupacionExpiraEn: expiraEn ? new Date(expiraEn).toISOString() : '',
        items,
        guardadoEn: Date.now(),
      };
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch {
        // Ignorar excepciones de cuota de localStorage
      }
    } else {
      // Si la comanda quedó vacía, limpiar el borrador
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // Noop
      }
    }
  }, [items, isOpen, draftKey, mesa, expiraEn]);

  // ─── 4. Acciones sobre la Comanda ──────────────────────────────────
  // Agregar plato o incrementar cantidad
  const handleAddItem = (plato: Plato) => {
    if (isExpired) return;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.platoId === plato._id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          cantidad: updated[existingIndex].cantidad + 1,
        };
        return updated;
      }
      return [
        ...prev,
        {
          platoId: plato._id,
          nombre: plato.nombre,
          precio: plato.precio,
          imagenUrl: plato.imagenUrl,
          cantidad: 1,
          observacion: '',
        },
      ];
    });
  };

  // Disminuir cantidad o eliminar si llega a 0
  const handleDecreaseItem = (platoId: string) => {
    if (isExpired) return;

    setItems((prev) => {
      const existing = prev.find((i) => i.platoId === platoId);
      if (!existing) return prev;

      if (existing.cantidad <= 1) {
        return prev.filter((i) => i.platoId !== platoId);
      }

      return prev.map((i) =>
        i.platoId === platoId ? { ...i, cantidad: i.cantidad - 1 } : i
      );
    });
  };

  // Eliminar item por completo
  const handleRemoveItem = (platoId: string) => {
    setItems((prev) => prev.filter((i) => i.platoId !== platoId));
  };

  // Actualizar observación de un plato
  const handleObservationChange = (platoId: string, observacion: string) => {
    setItems((prev) =>
      prev.map((i) => (i.platoId === platoId ? { ...i, observacion } : i))
    );
  };

  // ─── 5. Confirmar y Enviar Pedido (POST /api/pedidos) ──────────────
  const handleConfirmOrder = async () => {
    if (!mesa || items.length === 0 || isSubmitting || isExpired) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Construir DTO exacto esperado por el backend sin usar precios de cliente
      const dto: CrearPedidoDTO = {
        mesa: mesa._id,
        detalles: items.map((i) => ({
          plato: i.platoId,
          cantidad: i.cantidad,
          observacion: i.observacion.trim(),
        })),
      };

      const nuevoPedido = await pedidoService.crearPedido(dto);

      // Limpiar borrador local tras 201 exitoso
      if (draftKey) {
        try {
          localStorage.removeItem(draftKey);
        } catch {
          // Noop
        }
      }

      // El backend consume automáticamente la ocupación temporal (NO llamar DELETE)
      onSuccess(nuevoPedido);
    } catch (err: unknown) {
      // Si falla, la ocupación temporal y el borrador SE MANTIENEN
      if (err instanceof ApiError) {
        setSubmitError(err.getUserMessage());
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Ocurrió un error inesperado al procesar la comanda.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── 6. Cancelar con X y Confirmación ──────────────────────────────
  const handleRequestClose = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancelOccupation = async () => {
    if (!mesa) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      // Invocar DELETE /api/mesas/:id/ocupar-temporal
      await mesaService.cancelarOcupacionTemporal(mesa._id);

      // Eliminar borrador local
      if (draftKey) {
        try {
          localStorage.removeItem(draftKey);
        } catch {
          // Noop
        }
      }

      setShowCancelDialog(false);
      onMesaLiberada(mesa._id);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setCancelError(err.getUserMessage());
      } else if (err instanceof Error) {
        setCancelError(err.message);
      } else {
        setCancelError('Error al cancelar la ocupación temporal.');
      }
    } finally {
      setIsCancelling(false);
    }
  };

  // ─── 7. Minimizar Comanda (Conserva Ocupación y Borrador) ──────────
  const handleMinimize = () => {
    // Si hay items, asegurar persistencia inmediata en localStorage
    if (draftKey && mesa && items.length > 0) {
      try {
        const draft: ComandaDraft = {
          mesaId: mesa._id,
          mesaNumero: mesa.numero,
          ocupacionExpiraEn: expiraEn ? new Date(expiraEn).toISOString() : '',
          items,
          guardadoEn: Date.now(),
        };
        localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch {
        // Noop
      }
    }

    if (onMinimize) {
      onMinimize();
    } else {
      onClose();
    }
  };

  // Focus Trap y Tecla Escape (Accesibilidad Modal)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showCancelDialog) {
          setShowCancelDialog(false);
        } else {
          setShowCancelDialog(true);
        }
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableSelector =
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(focusableSelector);
        const focusable = Array.from(focusableElements).filter(
          (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
        );

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, showCancelDialog]);

  // ─── 8. Cálculos y Filtros Visuales ────────────────────────────────
  // Categorías de platos únicas
  const categories = useMemo(() => {
    const set = new Set<string>();
    platos.forEach((p) => {
      const cat = typeof p.categoria === 'object' && p.categoria ? p.categoria.nombre : String(p.categoria || '');
      if (cat) set.add(cat);
    });
    return ['Todas', ...Array.from(set).sort()];
  }, [platos]);

  // Platos filtrados
  const filteredPlatos = useMemo(() => {
    return platos.filter((p) => {
      const matchesSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

      const catName = typeof p.categoria === 'object' && p.categoria ? p.categoria.nombre : String(p.categoria || '');
      const matchesCat = selectedCategory === 'Todas' || catName.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [platos, searchTerm, selectedCategory]);

  // Subtotal visual informativo
  const visualSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  }, [items]);

  const totalItemsCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.cantidad, 0);
  }, [items]);

  if (!isOpen || !mesa) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comanda-modal-title"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col overflow-hidden relative"
      >
        {/* Cabecera del Modal */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 shrink-0 bg-stone-50/80 dark:bg-stone-900/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="comanda-modal-title"
                className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 truncate"
              >
                Nueva comanda · {mesa.numero}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                Capacidad: {mesa.capacidad} comensales{mesa.ubicacion ? ` · ${mesa.ubicacion}` : ''}
              </p>
            </div>
          </div>

          {/* Contador de Tiempo Restante (10 minutos) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition-colors ${
                isExpired
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300'
                  : secondsLeft < 120
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 animate-pulse'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300'
              }`}
              title="Tiempo restante de bloqueo temporal asignado por el servidor"
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{isExpired ? 'Expirada' : formattedTime}</span>
            </div>

            {/* Botón Minimizar */}
            <button
              type="button"
              onClick={handleMinimize}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-colors flex items-center justify-center focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Minimizar comanda"
              title="Minimizar (conserva la mesa ocupada y el borrador guardado)"
            >
              <Minimize2 className="w-5 h-5" />
            </button>

            {/* Botón X con confirmación */}
            <button
              type="button"
              onClick={handleRequestClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-colors flex items-center justify-center focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Cerrar y cancelar comanda"
              title="Cancelar comanda y liberar mesa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alerta de Expiración o Error */}
        {isExpired && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900 text-xs sm:text-sm text-rose-800 dark:text-rose-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                La ocupación temporal de 10 minutos ha expirado. Para evitar colisiones, la comanda no puede confirmarse.
              </span>
            </div>
            <Button variant="danger" size="sm" onClick={handleConfirmCancelOccupation} className="min-h-[34px] px-3 text-xs">
              Liberar Mesa
            </Button>
          </div>
        )}

        {submitError && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900 text-xs sm:text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span className="flex-1">{submitError}</span>
            <button
              onClick={() => setSubmitError(null)}
              className="text-amber-800 dark:text-amber-200 text-xs font-semibold underline ml-2"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Cuerpo Principal Dividido (Catálogo Izquierda, Resumen Derecha) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Columna Izquierda: Catálogo de Platos (7 cols en desktop) */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-stone-200 dark:border-stone-800 h-full overflow-hidden bg-white dark:bg-stone-900">
            {/* Buscador y Categorías */}
            <div className="p-3.5 border-b border-stone-100 dark:border-stone-800 space-y-2.5 shrink-0 bg-stone-50/50 dark:bg-stone-900/50">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Buscar platos o bebidas por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[38px]"
                />
              </div>

              {/* Píldoras de Categoría */}
              {categories.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Listado de Platos */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
              {isLoadingPlatos ? (
                <div className="py-16 text-center">
                  <Spinner size="md" className="text-primary mx-auto" />
                  <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                    Cargando platos disponibles...
                  </p>
                </div>
              ) : platosError ? (
                <Alert variant="error" title="Error">
                  {platosError}
                </Alert>
              ) : filteredPlatos.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-500 dark:text-stone-400">
                  No se encontraron platos que coincidan con la búsqueda.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredPlatos.map((plato) => {
                    const itemInCart = items.find((i) => i.platoId === plato._id);
                    const qty = itemInCart ? itemInCart.cantidad : 0;

                    return (
                      <div
                        key={plato._id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between shadow-2xs ${
                          qty > 0
                            ? 'border-amber-400/80 dark:border-amber-600/80 bg-amber-50/30 dark:bg-amber-950/20'
                            : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700'
                        }`}
                      >
                        <div className="flex gap-2.5">
                          {plato.imagenUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={plato.imagenUrl}
                              alt={plato.nombre}
                              className="w-14 h-14 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-200/60 dark:border-stone-800"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center shrink-0">
                              <UtensilsCrossed className="w-6 h-6 opacity-60" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                              {plato.nombre}
                            </h4>
                            {plato.descripcion && (
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5 leading-snug">
                                {plato.descripcion}
                              </p>
                            )}
                            <div className="text-xs sm:text-sm font-extrabold text-primary dark:text-primary-light mt-1">
                              Bs. {plato.precio.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Controles de Agregar / Stepper */}
                        <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800/60 flex items-center justify-end">
                          {qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleAddItem(plato)}
                              disabled={isExpired}
                              className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors flex items-center gap-1 min-h-[36px] active:scale-95 disabled:opacity-50"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Agregar</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDecreaseItem(plato._id)}
                                disabled={isExpired}
                                className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center font-bold active:scale-95 transition-all disabled:opacity-50"
                                aria-label={`Disminuir ${plato.nombre}`}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <span className="text-xs sm:text-sm font-bold w-6 text-center text-stone-900 dark:text-stone-100">
                                {qty}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleAddItem(plato)}
                                disabled={isExpired}
                                className="w-8 h-8 rounded-xl bg-primary text-white hover:bg-primary-hover flex items-center justify-center font-bold active:scale-95 transition-all disabled:opacity-50 shadow-xs"
                                aria-label={`Aumentar ${plato.nombre}`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Resumen de la Comanda (5 cols en desktop) */}
          <div className="lg:col-span-5 flex flex-col h-full overflow-hidden bg-stone-50/60 dark:bg-stone-900/60">
            {/* Cabecera del Resumen */}
            <div className="p-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0 bg-white dark:bg-stone-900">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-stone-500" />
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                  Resumen de Comanda ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
                </h3>
              </div>
              {draftRestored && (
                <div
                  className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium"
                  title="Borrador recuperado del almacenamiento local"
                >
                  <Save className="w-3 h-3" />
                  <span>Borrador activo</span>
                </div>
              )}
            </div>

            {/* Listado Editable de Items Seleccionados */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 dark:text-stone-500">
                  <UtensilsCrossed className="w-10 h-10 stroke-[1.5] mb-2 opacity-50 text-stone-300 dark:text-stone-600" />
                  <p className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-400">
                    Aún no has agregado platos a esta comanda.
                  </p>
                  <p className="text-[11px] mt-1 text-stone-400">
                    Selecciona platos del menú izquierdo para comenzar a armar el pedido.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.platoId}
                    className="p-3.5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                          {item.nombre}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400">
                          Bs. {item.precio.toFixed(2)} c/u
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Steppers */}
                        <button
                          type="button"
                          onClick={() => handleDecreaseItem(item.platoId)}
                          disabled={isExpired}
                          className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center font-bold active:scale-95 transition-all disabled:opacity-50"
                          title="Disminuir cantidad"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-5 text-center text-stone-900 dark:text-stone-100">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const platoObj = platos.find((p) => p._id === item.platoId);
                            if (platoObj) handleAddItem(platoObj);
                          }}
                          disabled={isExpired}
                          className="w-7 h-7 rounded-lg bg-primary text-white hover:bg-primary-hover flex items-center justify-center font-bold active:scale-95 transition-all disabled:opacity-50"
                          title="Aumentar cantidad"
                        >
                          <Plus className="w-3 h-3" />
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.platoId)}
                          disabled={isExpired}
                          className="w-7 h-7 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors ml-1"
                          title="Quitar plato de la comanda"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal del item */}
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-stone-100 dark:border-stone-800/60">
                      <span className="text-stone-400">Subtotal plato:</span>
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        Bs. {(item.cantidad * item.precio).toFixed(2)}
                      </span>
                    </div>

                    {/* Campo de Observación por Plato */}
                    <div>
                      <input
                        type="text"
                        placeholder="Observación de cocina (ej. Sin cebolla, término medio)..."
                        value={item.observacion}
                        onChange={(e) => handleObservationChange(item.platoId, e.target.value)}
                        disabled={isExpired}
                        maxLength={120}
                        className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pie del Resumen: Subtotal Visual e Informativo */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0 space-y-2">
              <div className="flex items-baseline justify-between text-sm sm:text-base font-bold text-stone-900 dark:text-stone-50">
                <span>Subtotal estimado:</span>
                <span className="text-primary dark:text-primary-light text-lg sm:text-xl font-extrabold">
                  Bs. {visualSubtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-[11px] text-stone-400 dark:text-stone-500">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-stone-400" />
                <span>
                  Cálculo visual estimado. El backend calcula los importes oficiales y valida disponibilidad al confirmar.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Acciones / Pie General */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-between gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRequestClose}
            disabled={isSubmitting}
            className="min-h-[42px] px-4 text-xs sm:text-sm font-medium text-stone-600 hover:text-rose-600 rounded-xl"
          >
            Cancelar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={handleConfirmOrder}
              disabled={items.length === 0 || isSubmitting || isExpired}
              isLoading={isSubmitting}
              className="min-h-[42px] px-6 text-xs sm:text-sm font-bold rounded-xl shadow-xs"
              title={
                items.length === 0
                  ? 'Agrega al menos un plato a la comanda'
                  : isExpired
                  ? 'Ocupación temporal expirada'
                  : 'Confirmar y enviar comanda a cocina'
              }
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Confirmar Comanda
            </Button>
          </div>
        </div>

        {/* Diálogo de Confirmación de Cancelación Voluntaria (DELETE /ocupar-temporal) */}
        {showCancelDialog && (
          <div
            className="absolute inset-0 z-60 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            role="alertdialog"
            aria-labelledby="cancel-dialog-title"
          >
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 id="cancel-dialog-title" className="text-base font-bold text-stone-900 dark:text-stone-100">
                    ¿Cancelar la creación de la comanda?
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                    La mesa volverá a estar disponible para otro mesero y se descartará el borrador actual.
                  </p>
                </div>
              </div>

              {cancelError && (
                <Alert variant="error" title="Error al cancelar">
                  {cancelError}
                </Alert>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelDialog(false)}
                  disabled={isCancelling}
                  className="min-h-[38px] px-3 text-xs"
                >
                  Seguir editando
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleConfirmCancelOccupation}
                  isLoading={isCancelling}
                  className="min-h-[38px] px-3.5 text-xs font-semibold"
                >
                  Cancelar comanda
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
