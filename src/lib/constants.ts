import { RolUsuario, EstadoMesa, EstadoPedido, MetodoPago } from '@/types';

export const ROLES: readonly RolUsuario[] = ['Administrador', 'Mesero', 'Cajero', 'Cocinero'] as const;

export const ESTADOS_MESA: readonly EstadoMesa[] = ['Libre', 'Ocupada', 'Cuenta Solicitada'] as const;

export const ESTADOS_PEDIDO: readonly EstadoPedido[] = [
  'ABIERTO',
  'EN_PREPARACION',
  'ENTREGADO',
  'CANCELADO',
  'CERRADO',
] as const;

export const METODOS_PAGO: readonly MetodoPago[] = ['Efectivo', 'Tarjeta', 'QR'] as const;

/**
 * Mapeo de valores backend a labels visuales amigables para el usuario.
 * Respeta el valor real del backend sin alterarlo en las peticiones.
 */
export const ESTADO_MESA_LABELS: Record<EstadoMesa, string> = {
  Libre: 'Disponible',
  Ocupada: 'Ocupada',
  'Cuenta Solicitada': 'Esperando Pago',
};

export const ESTADO_PEDIDO_LABELS: Record<EstadoPedido, string> = {
  ABIERTO: 'Abierto',
  EN_PREPARACION: 'En Preparación',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  CERRADO: 'Cerrado',
};

export const ROL_LABELS: Record<RolUsuario, string> = {
  Administrador: 'Administrador',
  Mesero: 'Mesero',
  Cajero: 'Cajero',
  Cocinero: 'Cocinero',
};

export interface RouteNavItem {
  label: string;
  href: string;
  allowedRoles: RolUsuario[];
  description?: string;
}

/**
 * Estructura de navegación para futuros módulos según RBAC oficial.
 */
export const NAVIGATION_ROUTES: RouteNavItem[] = [
  { label: 'Dashboard', href: '/dashboard', allowedRoles: ['Administrador', 'Mesero', 'Cajero', 'Cocinero'] },
  { label: 'Mesas', href: '/mesas', allowedRoles: ['Administrador', 'Mesero', 'Cajero'] },
  { label: 'Pedidos', href: '/pedidos', allowedRoles: ['Administrador', 'Mesero', 'Cajero', 'Cocinero'] },
  { label: 'Cocina', href: '/cocina', allowedRoles: ['Administrador', 'Cocinero'] },
  { label: 'Caja', href: '/caja', allowedRoles: ['Administrador', 'Cajero'] },
  { label: 'Pagos', href: '/pagos', allowedRoles: ['Administrador', 'Cajero'] },
  { label: 'Platos', href: '/platos', allowedRoles: ['Administrador', 'Mesero'] },
  { label: 'Categorías', href: '/categorias', allowedRoles: ['Administrador', 'Mesero'] },
  { label: 'Ubicaciones', href: '/ubicaciones', allowedRoles: ['Administrador', 'Mesero'] },
  { label: 'Ingredientes', href: '/ingredientes', allowedRoles: ['Administrador', 'Cocinero'] },
  { label: 'Usuarios', href: '/usuarios', allowedRoles: ['Administrador'] },
];

export const STORAGE_KEYS = {
  TOKEN: 'sabor_token',
  USER: 'sabor_user',
} as const;

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';
