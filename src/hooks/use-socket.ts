'use client';

import { useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, onSocketChange } from '@/lib/socket';

/**
 * Hook para suscribirse a un evento específico de Socket.IO con limpieza automática.
 * Utiliza un patrón estable basado en useRef para mantener actualizado el handler
 * sin causar suscripciones y desuscripciones repetitivas ante cada render del componente.
 */
export function useSocketEvent<T>(eventName: string, handler: (data: T) => void): void {
  const handlerRef = useRef(handler);

  // Mantener la referencia del handler siempre actualizada con el último render para evitar closures obsoletos
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    let cleanupListener: (() => void) | null = null;

    const setupListener = (socket: Socket | null) => {
      if (cleanupListener) {
        cleanupListener();
        cleanupListener = null;
      }

      if (!socket) return;

      const eventListener = (data: T) => {
        handlerRef.current(data);
      };

      socket.on(eventName, eventListener);

      cleanupListener = () => {
        socket.off(eventName, eventListener);
      };
    };

    // Configurar listener con el socket actual si existe
    setupListener(getSocket());

    // Suscribirse si la instancia del socket se inicializa después del montaje del hook
    const unsubscribe = onSocketChange((newSocket) => {
      setupListener(newSocket);
    });

    return () => {
      if (cleanupListener) {
        cleanupListener();
      }
      unsubscribe();
    };
  }, [eventName]);
}

/**
 * Hook para monitorear reactivamente el estado de la conexión Socket.IO.
 * Se suscribe a cambios de instancia mediante onSocketChange y a eventos
 * connect/disconnect sin incurrir en polling.
 */
export function useSocketStatus(): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    const socket = getSocket();
    return socket?.connected ?? false;
  });

  useEffect(() => {
    let cleanupSocketListeners: (() => void) | null = null;

    const attachListeners = (socket: Socket | null) => {
      if (cleanupSocketListeners) {
        cleanupSocketListeners();
        cleanupSocketListeners = null;
      }

      if (!socket) {
        setIsConnected(false);
        return;
      }

      setIsConnected(socket.connected);

      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);

      cleanupSocketListeners = () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
      };
    };

    // 1. Configurar listeners con el socket actual si ya está disponible
    attachListeners(getSocket());

    // 2. Suscribirse a cambios en la instancia del socket (creación o desconexión)
    const unsubscribe = onSocketChange((newSocket) => {
      attachListeners(newSocket);
    });

    return () => {
      if (cleanupSocketListeners) {
        cleanupSocketListeners();
      }
      unsubscribe();
    };
  }, []);

  return { isConnected };
}
