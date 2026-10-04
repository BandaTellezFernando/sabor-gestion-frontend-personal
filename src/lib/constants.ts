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
  isImplemented?: boolean;
  description?: string;
}

/**
 * Estructura de navegación oficial de Mishi-Food según RBAC estricto.
 * Fuente única de verdad para sidebar, mobile-sidebar y control de acceso.
 */
export const NAVIGATION_ROUTES: RouteNavItem[] = [
  { label: 'Dashboard', href: '/dashboard', allowedRoles: ['Administrador'], isImplemented: true },
  { label: 'Mesas', href: '/dashboard/mesas', allowedRoles: ['Administrador', 'Mesero'], isImplemented: true },
  { label: 'Pedidos', href: '/dashboard/pedidos', allowedRoles: ['Administrador', 'Mesero'], isImplemented: true },
  { label: 'Cocina', href: '/dashboard/cocina', allowedRoles: ['Administrador', 'Cocinero'], isImplemented: true },
  { label: 'Caja', href: '/dashboard/caja', allowedRoles: ['Cajero', 'Administrador'], isImplemented: true },
];

/**
 * Matriz estricta de permisos por ruta.
 */
export const ROUTE_PERMISSIONS: Record<string, RolUsuario[]> = {
  '/dashboard': ['Administrador'],
  '/dashboard/mesas': ['Administrador', 'Mesero'],
  '/dashboard/pedidos': ['Administrador', 'Mesero'],
  '/dashboard/cocina': ['Administrador', 'Cocinero'],
  '/dashboard/caja': ['Cajero', 'Administrador'],
  '/mesas': ['Administrador', 'Mesero'],
  '/pedidos': ['Administrador', 'Mesero'],
  '/cocina': ['Administrador', 'Cocinero'],
  '/caja': ['Cajero', 'Administrador'],
};

/**
 * Determina la ruta de aterrizaje por defecto autorizada para cada rol del sistema.
 */
export function getDefaultRouteForRole(role?: RolUsuario | null): string {
  switch (role) {
    case 'Administrador':
      return '/dashboard';
    case 'Mesero':
      return '/dashboard/mesas';
    case 'Cocinero':
      return '/dashboard/cocina';
    case 'Cajero':
      return '/dashboard/caja';
    default:
      return '/login';
  }
}

export const STORAGE_KEYS = {
  TOKEN: 'sabor_token',
  USER: 'sabor_user',
} as const;

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';
