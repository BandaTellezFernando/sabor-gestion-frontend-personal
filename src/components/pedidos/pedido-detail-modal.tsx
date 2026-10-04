'use client';

import React, { useState, useRef } from 'react';
import { Pedido, EstadoPedido, RolUsuario, Usuario, Mesa } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  User,
  MapPin,
  FileText,
  ChefHat,
  Receipt,
  CheckCircle2,
  XCircle,
  Pencil,
  QrCode,
  Check,
} from 'lucide-react';

export interface PedidoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
  userRole: RolUsuario;
  currentUserId?: string;
  mesas?: Mesa[];
  onEdit?: (pedido: Pedido) => void;
  onCancel?: (pedido: Pedido) => void;
  onSolicitarCuenta?: (pedido: Pedido) => Promise<void>;
  onCambiarEstadoCocina?: (pedido: Pedido, nuevoEstado: 'EN_PREPARACION' | 'ENTREGADO') => Promise<void>;
  onRecogerPedido?: (pedido: Pedido) => Promise<void>;
}

export function PedidoDetailModal({
  isOpen,
  onClose,
  pedido,
  userRole,
  currentUserId,
  mesas,
  onEdit,
  onCancel,
  onSolicitarCuenta,
  onCambiarEstadoCocina,
  onRecogerPedido,
}: PedidoDetailModalProps) {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [cuentaYaSolicitada, setCuentaYaSolicitada] = useState(false);
  const solicitarCuentaLockRef = useRef(false);

  if (!pedido) return null;

  const canManage = userRole === 'Administrador';
  const isMesero = userRole === 'Mesero';
  const isCocinero = userRole === 'Cocinero';

  const mesaId =
    typeof pedido.mesa === 'object' && pedido.mesa !== null
      ? pedido.mesa._id
      : pedido.mesa;
  const mesaObj = mesas?.find((m) => m._id === mesaId);
  const yaSolicitada = cuentaYaSolicitada || mesaObj?.estado === 'Cuenta Solicitada';

  const canEdit = (canManage || isMesero) &&
    (pedido.estado === 'ABIERTO' || pedido.estado === 'EN_PREPARACION' || pedido.estado === 'ENTREGADO');

  const canCancel = (canManage || isMesero) &&
    (pedido.estado === 'ABIERTO' || pedido.estado === 'EN_PREPARACION');

  const canPedirCuenta = (canManage || isMesero) &&
    Boolean(pedido.mesa) &&
    (pedido.estado === 'ABIERTO' || pedido.estado === 'EN_PREPARACION' || pedido.estado === 'ENTREGADO');

  const canCocineroAdvance = (canManage || isCocinero) &&
    (pedido.estado === 'ABIERTO' || pedido.estado === 'EN_PREPARACION');

  const meseroId =
    typeof pedido.usuario === 'object' && pedido.usuario !== null
      ? String(pedido.usuario._id || (pedido.usuario as { id?: string }).id || '')
      : String(pedido.usuario || '');
  const isResponsable = currentUserId ? meseroId === currentUserId : true;
  const canRecoger =
    (canManage || (isMesero && isResponsable)) &&
    pedido.estado === 'ENTREGADO' &&
    !pedido.recogido;

  const handleSolicitarCuenta = async () => {
    if (!onSolicitarCuenta || solicitarCuentaLockRef.current || isActionLoading || yaSolicitada) return;
    solicitarCuentaLockRef.current = true;
    setIsActionLoading(true);
    try {
      await onSolicitarCuenta(pedido);
      setCuentaYaSolicitada(true);
      onClose();
    } finally {
      solicitarCuentaLockRef.current = false;
      setIsActionLoading(false);
    }
  };

  const handleEstadoCocina = async (nuevo: 'EN_PREPARACION' | 'ENTREGADO') => {
    if (!onCambiarEstadoCocina || isActionLoading) return;
    setIsActionLoading(true);
    try {
      await onCambiarEstadoCocina(pedido, nuevo);
      onClose();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRecogerPedido = async () => {
    if (!onRecogerPedido || isActionLoading) return;
    setIsActionLoading(true);
    try {
      await onRecogerPedido(pedido);
      onClose();
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatEstadoBadge = (estado: EstadoPedido) => {
    switch (estado) {
      case 'ABIERTO':
        return (
          <Badge variant="pedido-abierto" dot className="font-semibold text-xs px-2.5 py-0.5">
            Abierto
          </Badge>
        );
      case 'EN_PREPARACION':
        return (
          <Badge variant="pedido-en-preparacion" dot className="font-semibold text-xs px-2.5 py-0.5">
            En Preparación
          </Badge>
        );
      case 'ENTREGADO':
        if (!pedido.recogido) {
          return (
            <Badge variant="pedido-en-preparacion" dot className="font-bold text-xs px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800 animate-pulse">
              Listo para Recoger
            </Badge>
          );
        }
        return (
          <Badge variant="pedido-entregado" dot className="font-semibold text-xs px-2.5 py-0.5">
            Entregado (Recogido)
          </Badge>
        );
      case 'CANCELADO':
        return (
          <Badge variant="pedido-cancelado" dot className="font-semibold text-xs px-2.5 py-0.5">
            Cancelado
          </Badge>
        );
      case 'CERRADO':
        return (
          <Badge variant="pedido-cerrado" dot className="font-semibold text-xs px-2.5 py-0.5">
            Cerrado
          </Badge>
        );
      default:
        return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  const getUsuarioNombre = (usuario: string | Usuario | undefined): string => {
    if (!usuario) return 'Personal de Salón';
    if (typeof usuario === 'object' && 'nombre' in usuario) {
      return `${usuario.nombre} ${usuario.apellido || ''}`.trim();
    }
    return 'Mesero';
  };

  const getMesaNombre = (mesa: string | Mesa | undefined): string => {
    if (!mesa) return 'Mesa no asignada';
    if (typeof mesa === 'object' && 'numero' in mesa) {
      return mesa.ubicacion ? `${mesa.numero} (${mesa.ubicacion})` : `Mesa ${mesa.numero}`;
    }
    if (typeof mesa === 'string' && mesas && mesas.length > 0) {
      const encontrada = mesas.find((m) => m._id === mesa || m.numero === mesa);
      if (encontrada) {
        return encontrada.ubicacion ? `${encontrada.numero} (${encontrada.ubicacion})` : `Mesa ${encontrada.numero}`;
      }
    }
    if (typeof mesa === 'string' && /^[0-9a-fA-F]{24}$/.test(mesa)) {
      return `Mesa (${mesa.slice(-4)})`;
    }
    return `Mesa ${mesa}`;
  };

  const subtotalCalculado = (pedido.detalles || []).reduce(
    (acc, d) => acc + (d.subtotal ?? (d.precioUnitario || 0) * (d.cantidad || 0)),
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle de Comanda: ${pedido.codigo}`}
      description="Visualización completa de los platos, notas de cocina, importes y estado operativo."
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Cabecera y Resumen Operativo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 text-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-stone-500">Estado:</span>
              {formatEstadoBadge(pedido.estado)}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              <span className="font-bold text-stone-800 dark:text-stone-200">
                {getMesaNombre(pedido.mesa)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-stone-600 dark:text-stone-300">
                Atendido por: {getUsuarioNombre(pedido.usuario)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-stone-600 dark:text-stone-300">
                Hora:{' '}
                {pedido.fechaHoraBolivia ||
                  (pedido.fechaHora
                    ? new Date(pedido.fechaHora).toLocaleString('es-BO')
                    : 'No registrada')}
              </span>
            </div>

            {pedido.clienteNombre && (
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-stone-700 dark:text-stone-300 font-medium truncate">
                  Cliente: {pedido.clienteNombre}
                  {pedido.clienteNIT ? ` (NIT: ${pedido.clienteNIT})` : pedido.clienteCI ? ` (CI: ${pedido.clienteCI})` : ''}
                </span>
              </div>
            )}

            {pedido.qrUrl && (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                <QrCode className="w-3.5 h-3.5" />
                <span>Pago QR disponible</span>
              </div>
            )}

            {pedido.recogido && (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Recogido de cocina {pedido.fechaRecogidaBolivia ? `(${pedido.fechaRecogidaBolivia})` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de Platos e Items */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
            Platos y Bebidas
          </h4>

          <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="py-2.5 px-3.5 font-semibold">Plato / Descripción</th>
                  <th className="py-2.5 px-3.5 font-semibold text-center w-16">Cant.</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right w-24">Precio Unit.</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right w-24">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-stone-900">
                {(pedido.detalles || []).map((d, index) => {
                  const nombrePlato =
                    d.nombrePlato ||
                    (typeof d.plato === 'object' && d.plato ? d.plato.nombre : 'Plato');
                  return (
                    <tr key={index} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-stone-900 dark:text-stone-100">
                          {nombrePlato}
                        </div>
                        {d.observacion && (
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 italic">
                            Nota: {d.observacion}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-extrabold text-stone-800 dark:text-stone-200">
                        {d.cantidad}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-stone-600 dark:text-stone-400 font-mono">
                        Bs. {Number(d.precioUnitario || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-stone-900 dark:text-stone-100 font-mono">
                        Bs. {Number(d.subtotal || (d.precioUnitario * d.cantidad) || 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Desglose Financiero */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-1.5 text-xs">
          <div className="flex justify-between text-stone-600 dark:text-stone-400">
            <span>Subtotal de Comanda:</span>
            <span className="font-mono">Bs. {subtotalCalculado.toFixed(2)}</span>
          </div>

          {Number(pedido.montoDescuento || 0) > 0 && (
            <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
              <span>Descuento aplicado:</span>
              <span className="font-mono">- Bs. {Number(pedido.montoDescuento).toFixed(2)}</span>
            </div>
          )}

          {Number(pedido.montoPropina || 0) > 0 && (
            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>Propina / Servicio:</span>
              <span className="font-mono">+ Bs. {Number(pedido.montoPropina).toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-stone-200 dark:border-stone-800 font-bold text-sm text-stone-900 dark:text-stone-100">
            <span>Importe Total:</span>
            <span className="font-mono text-base text-primary dark:text-primary-light font-extrabold">
              Bs. {Number(pedido.total || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Barra de Acciones según RBAC */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Cocinero: Iniciar preparación */}
            {canCocineroAdvance && pedido.estado === 'ABIERTO' && (
              <Button
                variant="primary"
                size="md"
                onClick={() => handleEstadoCocina('EN_PREPARACION')}
                disabled={isActionLoading}
                className="min-h-[40px] px-3.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
              >
                <ChefHat className="w-4 h-4 mr-1.5" />
                Iniciar Preparación
              </Button>
            )}

            {/* Cocinero: Marcar entregado */}
            {canCocineroAdvance && pedido.estado === 'EN_PREPARACION' && (
              <Button
                variant="primary"
                size="md"
                onClick={() => handleEstadoCocina('ENTREGADO')}
                disabled={isActionLoading}
                className="min-h-[40px] px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Marcar como Entregado
              </Button>
            )}

            {/* Mesero responsable o Admin: Recoger Pedido */}
            {canRecoger && onRecogerPedido && (
              <Button
                variant="primary"
                size="md"
                onClick={handleRecogerPedido}
                disabled={isActionLoading}
                className="min-h-[40px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Recoger Pedido
              </Button>
            )}

            {/* Mesero / Admin: Pedir Cuenta */}
            {canPedirCuenta && (
              yaSolicitada ? (
                <Button
                  variant="outline"
                  size="md"
                  disabled
                  className="min-h-[40px] px-3.5 text-xs font-semibold border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed bg-stone-50 dark:bg-stone-900"
                >
                  <Check className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                  Cuenta Solicitada
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleSolicitarCuenta}
                  disabled={isActionLoading}
                  isLoading={isActionLoading}
                  className="min-h-[40px] px-3.5 text-xs font-semibold border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                >
                  <Receipt className="w-4 h-4 mr-1.5" />
                  {isActionLoading ? 'Pidiendo cuenta...' : 'Pedir Cuenta'}
                </Button>
              )
            )}

            {/* Mesero / Admin: Editar */}
            {canEdit && onEdit && (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  onClose();
                  onEdit(pedido);
                }}
                disabled={isActionLoading}
                className="min-h-[40px] px-3.5 text-xs font-medium"
              >
                <Pencil className="w-4 h-4 mr-1.5" />
                Editar Comanda
              </Button>
            )}

            {/* Mesero / Admin: Cancelar */}
            {canCancel && onCancel && (
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  onClose();
                  onCancel(pedido);
                }}
                disabled={isActionLoading}
                className="min-h-[40px] px-3.5 text-xs font-semibold"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Cancelar Pedido
              </Button>
            )}
          </div>

          <Button variant="outline" size="md" onClick={onClose} disabled={isActionLoading} className="min-h-[40px] px-4 font-medium">
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
