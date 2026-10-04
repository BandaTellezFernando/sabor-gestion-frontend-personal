import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

let socketInstance: Socket | null = null;

type SocketChangeListener = (socket: Socket | null) => void;
const socketChangeListeners = new Set<SocketChangeListener>();

function notifySocketChange(socket: Socket | null): void {
  socketChangeListeners.forEach((listener) => {
    try {
      listener(socket);
    } catch (e) {
      console.error('Error en listener de cambio de socket:', e);
    }
  });
}

/**
 * Permite suscribirse reactivamente a los cambios de instancia del Socket.IO
 * (creación, reconexión o desconexión) sin incurrir en polling.
 */
export function onSocketChange(listener: SocketChangeListener): () => void {
  socketChangeListeners.add(listener);
  return () => {
    socketChangeListeners.delete(listener);
  };
}

/**
 * Eventos oficiales emitidos por el backend según docs/frontend-reference.md
 */
export const SOCKET_EVENTS = {
  // Cocina
  COCINA_NUEVO_PEDIDO: 'cocina:nuevo_pedido',
  COCINA_ACTUALIZAR_TABLERO: 'cocina:actualizar_tablero',
  COCINA_PEDIDO_RECOGIDO: 'cocina:pedido_recogido',
  
  // Mesas
  MESAS_ALERTA_LISTO: 'mesas:alerta_listo',
  MESAS_CREATED: 'mesas:created',
  MESAS_UPDATED: 'mesas:updated',
  MESAS_DELETED: 'mesas:deleted',
  MESAS_PAGO_COMPLETADO: 'mesas:pago_completado',
  
  // Caja
  CAJA_NUEVA_CUENTA: 'caja:nueva_cuenta',
  CAJA_SOLICITUD_PAGO: 'caja:solicitud_pago',
  CAJA_PAGO_CONFIRMADO: 'caja:pago_confirmado',
  
  // Evento dinámico por pedido
  pedidoPagoRecibido: (pedidoId: string) => `pedido:pago_recibido:${pedidoId}` as const,
  
  // Inventario
  INVENTARIO_ACTUALIZADO: 'inventario:actualizado',
} as const;

/**
 * Inicializa la conexión con Socket.IO utilizando auth: { token }
 * estrictamente compatible con navegadores sin depender de extraHeaders.
 */
export function initSocket(token: string): Socket {
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
  }

  socketInstance = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  notifySocketChange(socketInstance);

  return socketInstance;
}

/**
 * Retorna la instancia activa del socket o null si no se ha conectado.
 */
export function getSocket(): Socket | null {
  return socketInstance;
}

/**
 * Cierra la conexión de Socket.IO limpiamente al cerrar sesión.
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    notifySocketChange(null);
  }
}
