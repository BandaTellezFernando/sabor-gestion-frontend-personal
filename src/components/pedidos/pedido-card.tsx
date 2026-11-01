'use client';

import React, { useState, useRef } from 'react';
import { Pedido, EstadoPedido, RolUsuario, Usuario, Mesa } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  User,
  Receipt,
  CheckCircle2,
  XCircle,
  Eye,
  Pencil,
  Check,
} from 'lucide-react';

export interface PedidoCardProps {
  pedido: Pedido;
  userRole: RolUsuario;
  currentUserId?: string;
  mesas?: Mesa[];
  onViewDetail: (pedido: Pedido) => void;
  onEdit?: (pedido: Pedido) => void;
  onCancel?: (pedido: Pedido) => void;
  onSolicitarCuenta?: (pedido: Pedido) => Promise<void>;
  onCambiarEstadoCocina?: (pedido: Pedido, nuevoEstado: 'EN_PREPARACION' | 'ENTREGADO') => Promise<void>;
  onRecogerPedido?: (pedido: Pedido) => Promise<void>;
}

export function PedidoCard({
  pedido,
  userRole,
  currentUserId,
  mesas,
  onViewDetail,
  onEdit,
  onCancel,
  onSolicitarCuenta,
  onRecogerPedido,
}: PedidoCardProps) {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [cuentaYaSolicitada, setCuentaYaSolicitada] = useState(false);
  const solicitarCuentaLockRef = useRef(false);

  const canManage = userRole === 'Administrador';
  const isMesero = userRole === 'Mesero';

  const mesaId =
    typeof pedido.mesa === 'object' && pedido.mesa !== null
      ? pedido.mesa._id
      : pedido.mesa;
  const mesaObj = mesas?.find((m) => m._id === mesaId);
  const estadoMesaPedido =
    typeof pedido.mesa === 'object' && pedido.mesa !== null
      ? pedido.mesa.estado
      : undefined;
  const yaSolicitada =
    cuentaYaSolicitada ||
    mesaObj?.estado === 'Cuenta Solicitada' ||
    estadoMesaPedido === 'Cuenta Solicitada';

  const canEdit = (canManage || isMesero) &&
    !yaSolicitada &&
    (pedido.estado === 'ABIERTO' || pedido.estado === 'EN_PREPARACION' || pedido.estado === 'ENTREGADO');

  const canCancel = (canManage || isMesero) &&
    (pedido.estado === 'ABIERTO' || pedido.estado === 'EN_PREPARACION');

  const canPedirCuenta = (canManage || isMesero) &&
    Boolean(pedido.mesa) &&
    !yaSolicitada &&
    (pedido.estado === 'LISTO' || pedido.estado === 'ENTREGADO') &&
    pedido.recogido === true;

  const meseroId =
    typeof pedido.usuario === 'object' && pedido.usuario !== null
      ? String(pedido.usuario._id || pedido.usuario.id || '')
      : String(pedido.usuario || '');
  const isResponsable = currentUserId ? meseroId === currentUserId : true;
  const canRecoger =
    (canManage || (isMesero && isResponsable)) &&
    pedido.estado === 'LISTO' &&
    !pedido.recogido;

  const handleSolicitarCuenta = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSolicitarCuenta || solicitarCuentaLockRef.current || isActionLoading || yaSolicitada) return;
    solicitarCuentaLockRef.current = true;
    setIsActionLoading(true);
    try {
      await onSolicitarCuenta(pedido);
      setCuentaYaSolicitada(true);
    } finally {
      solicitarCuentaLockRef.current = false;
      setIsActionLoading(false);
    }
  };

  const handleRecogerPedido = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRecogerPedido || isActionLoading) return;
    setIsActionLoading(true);
    try {
      await onRecogerPedido(pedido);
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
      return mesa.numero;
    }
    if (typeof mesa === 'string' && mesas && mesas.length > 0) {
      const encontrada = mesas.find((m) => m._id === mesa || m.numero === mesa);
      if (encontrada) return encontrada.numero;
    }
    if (typeof mesa === 'string' && /^[0-9a-fA-F]{24}$/.test(mesa)) {
      return `Mesa (${mesa.slice(-4)})`;
    }
    return `Mesa ${mesa}`;
  };

  const totalProductos = (pedido.detalles || []).reduce((acc, d) => acc + (d.cantidad || 0), 0);

  // Borde y fondo sutil acorde al estado
  const getCardBorder = () => {
    switch (pedido.estado) {
      case 'ABIERTO':
        return 'border-amber-700/30 bg-zinc-900';
      case 'EN_PREPARACION':
        return 'border-amber-600/50 bg-gradient-to-br from-amber-950/20 via-zinc-900 to-zinc-900 shadow-[0_0_15px_rgba(217,119,6,0.12)]';
      case 'ENTREGADO':
        if (!pedido.recogido) {
          return 'border-amber-500 bg-gradient-to-br from-amber-950/35 via-zinc-900 to-zinc-900 shadow-[0_0_15px_rgba(217,119,6,0.2)] ring-1 ring-amber-500/40';
        }
        return 'border-emerald-700/40 bg-zinc-900';
      case 'CANCELADO':
        return 'border-zinc-800 bg-zinc-950/60 opacity-60';
      case 'CERRADO':
        return 'border-amber-700/25 bg-zinc-900';
      default:
        return 'border-amber-700/25 bg-zinc-900';
    }
  };

  return (
    <div
      onClick={() => onViewDetail(pedido)}
      className={`rounded-sm border p-4 sm:p-5 shadow-md transition-all duration-200 hover:border-amber-500/50 cursor-pointer flex flex-col justify-between ${getCardBorder()}`}
      data-pedido-id={pedido._id}
      tabIndex={0}
      role="region"
      aria-label={`Comanda ${pedido.codigo} en ${getMesaNombre(pedido.mesa)}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewDetail(pedido);
        }
      }}
    >
      <div>
        {/* Cabecera del pedido */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-base sm:text-lg font-bold text-stone-100 tracking-wide">
                {pedido.codigo}
              </span>
            </div>
            <p className="text-sm font-serif font-bold text-amber-400 mt-0.5">
              {getMesaNombre(pedido.mesa)}
            </p>
          </div>

          <div className="shrink-0">{formatEstadoBadge(pedido.estado)}</div>
        </div>

        {/* Metadatos operativos */}
        <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400 mb-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>
              {pedido.fechaHoraBolivia ||
                (pedido.fechaHora ? new Date(pedido.fechaHora).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : 'Hora no registrada')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="truncate">Mesero: {getUsuarioNombre(pedido.usuario)}</span>
          </div>

          {pedido.clienteNombre && (
            <div className="pt-1 border-t border-stone-100 dark:border-stone-800 text-stone-500 dark:text-stone-400 text-[11px] truncate">
              Cliente: <span className="font-medium text-stone-700 dark:text-stone-300">{pedido.clienteNombre}</span>
              {pedido.clienteNIT ? ` (NIT: ${pedido.clienteNIT})` : pedido.clienteCI ? ` (CI: ${pedido.clienteCI})` : ''}
            </div>
          )}
        </div>

        {/* Resumen de Platos de la Comanda */}
        {pedido.detalles && pedido.detalles.length > 0 && (
          <div className="p-2.5 rounded-sm bg-zinc-950/60 border border-amber-900/25 mb-3 space-y-1">
            {pedido.detalles.slice(0, 3).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="truncate text-stone-700 dark:text-stone-300">
                  <strong className="font-bold text-stone-900 dark:text-stone-100 mr-1">{d.cantidad}x</strong>
                  {typeof d.plato === 'object' && d.plato ? d.plato.nombre : d.nombrePlato || 'Plato'}
                </span>
              </div>
            ))}
            {pedido.detalles.length > 3 && (
              <span className="text-[11px] text-stone-400 italic block pt-0.5">
                +{pedido.detalles.length - 3} platos más...
              </span>
            )}
          </div>
        )}
      </div>

      {/* Pie de la tarjeta: Total Financiero y Acciones */}
      <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            {totalProductos} {totalProductos === 1 ? 'producto' : 'productos'} · Total:
          </span>
          <span className="text-base sm:text-lg font-serif font-bold text-amber-400 tracking-tight">
            Bs. {Number(pedido.total || 0).toFixed(2)}
          </span>
        </div>

        {/* Botones de acción según RBAC */}
        <div className="flex flex-wrap items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
          {/* Recoger Pedido (Mesero responsable o Administrador) - DESTACADO */}
          {canRecoger && onRecogerPedido ? (
            <Button
              variant="success"
              size="sm"
              onClick={handleRecogerPedido}
              disabled={isActionLoading}
              className="flex-1 min-h-[40px] px-3.5 text-xs font-semibold rounded-sm bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-[0_0_15px_rgba(217,119,6,0.2)]"
              title="Confirmar recogida del pedido de cocina"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Recoger Pedido
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetail(pedido)}
              className="flex-1 min-h-[38px] text-xs font-semibold rounded-sm text-stone-700 dark:text-stone-300"
              title="Ver detalles completos de la comanda"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              Ver Detalle
            </Button>
          )}

          {/* Pedir Cuenta (Mesero / Admin) */}
          {canPedirCuenta && (
            yaSolicitada ? (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="min-h-[38px] px-3 text-xs font-semibold rounded-sm border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed bg-stone-50 dark:bg-stone-900"
                title="La cuenta ya ha sido solicitada para esta mesa"
              >
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                Cuenta Solicitada
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSolicitarCuenta}
                disabled={isActionLoading}
                isLoading={isActionLoading}
                className="min-h-[38px] px-3 text-xs font-semibold rounded-sm border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                title="Solicitar cuenta y notificar a Caja"
              >
                <Receipt className="w-3.5 h-3.5 mr-1" />
                {isActionLoading ? 'Pidiendo...' : 'Cuenta'}
              </Button>
            )
          )}

          {/* Editar comanda (Mesero / Admin) */}
          {canEdit && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(pedido)}
              disabled={isActionLoading}
              className="min-h-[38px] px-2 text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 rounded-sm"
              title="Modificar platos o comanda"
              aria-label={`Editar comanda ${pedido.codigo}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}

          {/* Cancelar pedido (Mesero / Admin) */}
          {canCancel && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel(pedido)}
              disabled={isActionLoading}
              className="min-h-[38px] px-2 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-sm"
              title="Cancelar comanda y liberar mesa"
              aria-label={`Cancelar comanda ${pedido.codigo}`}
            >
              <XCircle className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
