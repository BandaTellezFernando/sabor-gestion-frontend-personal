import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { EstadoPedido } from '@/types';

/**
 * Insignia de los estados oficiales de comanda.
 * El color nunca es el único indicador: siempre acompaña al texto del estado.
 */
export function EstadoPedidoBadge({ estado }: { estado: EstadoPedido }) {
  switch (estado) {
    case 'PENDIENTE':
    case 'ABIERTO':
      return (
        <Badge variant="pedido-abierto" dot>
          {estado === 'PENDIENTE' ? 'Pendiente' : 'Abierto'}
        </Badge>
      );
    case 'EN_PREPARACION':
      return (
        <Badge variant="pedido-en-preparacion" dot>
          En preparación
        </Badge>
      );
    case 'LISTO':
      return (
        <Badge variant="pedido-entregado" dot>
          Listo
        </Badge>
      );
    case 'ENTREGADO':
      return (
        <Badge variant="pedido-entregado" dot>
          Entregado
        </Badge>
      );
    case 'CANCELADO':
      return (
        <Badge variant="pedido-cancelado" dot>
          Cancelado
        </Badge>
      );
    case 'CERRADO':
      return (
        <Badge variant="pedido-cerrado" dot>
          Cerrado
        </Badge>
      );
    default:
      return <Badge variant="neutral">{estado}</Badge>;
  }
}
