'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

/**
 * Hook para suscribirse a un evento específico de Socket.IO con limpieza automática.
 */
export function useSocketEvent<T>(eventName: string, handler: (data: T) => void): void {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  }, [eventName, handler]);
}

/**
 * Hook para monitorear el estado de la conexión Socket.IO.
 */
export function useSocketStatus(): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    const socket = getSocket();
    return socket?.connected ?? false;
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return { isConnected };
}
