'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export interface PedidoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
  userRole: RolUsuario;
  mesas?: Mesa[];
  onEdit?: (pedido: Pedido) => void;
  onCancel?: (pedido: Pedido) => void;
  onSolicitarCuenta?: (pedido: Pedido) => Promise<void>;
  onCambiarEstadoCocina?: (pedido: Pedido, nuevoEstado: 'EN_PREPARACION' | 'ENTREGADO') => Promise<void>;
}

export function PedidoDetailModal({
  isOpen,
  onClose,
  pedido,
  userRole,
  mesas,
  onEdit,
  onCancel,
  onSolicitarCuenta,
  onCambiarEstadoCocina,
}: PedidoDetailModalProps) {
  const [isActionLoading, setIsActionLoading] = useState(false);

  if (!pedido) return null;

  const canManage = userRole === 'Administrador';
  const isMesero = userRole === 'Mesero';
  const isCocinero = userRole === 'Cocinero';

  const canEdit = (canManage || isMesero) &&
    (pedido.estado === 'ABIERTO' || pedido.estado === 'EN_PREPARACION' || pedido.estado === 'ENTREGADO');

  const canCancel = (canManage || isMesero) &&
    (pedido.estado === 'ABIERTO' || pedido.estado === 'EN_PREPARACION');

  const canPedirCuenta = (canManage || isMesero) &&
    Boolean(pedido.mesa) &&
    (pedido.estado === 'ABIERTO' || pedido.estado === 'EN_PREPARACION' || pedido.estado === 'ENTREGADO');

  const canCocineroAdvance = (canManage || isCocinero) &&
    (pedido.estado === 'ABIERTO' || pedido.estado === 'EN_PREPARACION');

  const handleSolicitarCuenta = async () => {
    if (!onSolicitarCuenta || isActionLoading) return;
    setIsActionLoading(true);
    try {
      await onSolicitarCuenta(pedido);
      onClose();
    } finally {
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
        return (
          <Badge variant="pedido-entregado" dot className="font-semibold text-xs px-2.5 py-0.5">
            Entregado
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Estado:</span>
              {formatEstadoBadge(pedido.estado)}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {getMesaNombre(pedido.mesa)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-600 dark:text-zinc-300">
                Atendido por: {getUsuarioNombre(pedido.usuario)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-600 dark:text-zinc-300">
                Hora:{' '}
                {pedido.fechaHoraBolivia ||
                  (pedido.fechaHora
                    ? new Date(pedido.fechaHora).toLocaleString('es-BO')
                    : 'No registrada')}
              </span>
            </div>

            {pedido.clienteNombre && (
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate">
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
          </div>
        </div>

        {/* Tabla de Platos e Items */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Platos y Bebidas
          </h4>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2 px-3 font-semibold">Plato / Descripción</th>
                  <th className="py-2 px-3 font-semibold text-center w-16">Cant.</th>
                  <th className="py-2 px-3 font-semibold text-right w-24">Precio Unit.</th>
                  <th className="py-2 px-3 font-semibold text-right w-24">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                {(pedido.detalles || []).map((d, index) => {
                  const nombrePlato =
                    d.nombrePlato ||
                    (typeof d.plato === 'object' && d.plato ? d.plato.nombre : 'Plato');
                  return (
                    <tr key={index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {nombrePlato}
                        </div>
                        {d.observacion && (
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 italic">
                            Nota: {d.observacion}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-zinc-800 dark:text-zinc-200">
                        {d.cantidad}
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-600 dark:text-zinc-400 font-mono">
                        Bs. {Number(d.precioUnitario || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
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
        <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs">
          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
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
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Propina / Servicio:</span>
              <span className="font-mono">+ Bs. {Number(pedido.montoPropina).toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800 font-bold text-sm text-zinc-900 dark:text-zinc-100">
            <span>Importe Total:</span>
            <span className="font-mono text-base text-zinc-950 dark:text-zinc-50">
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

            {/* Mesero / Admin: Pedir Cuenta */}
            {canPedirCuenta && (
              <Button
                variant="outline"
                size="md"
                onClick={handleSolicitarCuenta}
                disabled={isActionLoading}
                className="min-h-[40px] px-3.5 text-xs font-semibold border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                <Receipt className="w-4 h-4 mr-1.5" />
                Pedir Cuenta
              </Button>
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
