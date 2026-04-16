import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    try {
      const SOCKET_BASE = import.meta.env.VITE_API_URL || '';
      socket = io(SOCKET_BASE || window.location.origin, {
        reconnectionAttempts: 3,
        timeout: 5000,
      });
      socket.on('connect_error', () => {
        // Silently fail — app works without real-time events
      });
    } catch (e) {
      // Return a no-op stub so the rest of the app never crashes
      socket = {
        on: () => {},
        off: () => {},
        emit: () => {},
        engine: { clientsCount: 0 },
      };
    }
  }
  return socket;
}

export function useSocket(eventHandlers = {}) {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    let s;
    try {
      s = getSocket();
    } catch (e) {
      return;
    }

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    // Register event handlers
    const events = Object.keys(handlersRef.current);
    events.forEach(event => {
      s.on(event, (...args) => handlersRef.current[event]?.(...args));
    });

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      events.forEach(event => s.off(event));
    };
  }, []);

  const emit = useCallback((event, data) => {
    try {
      const s = getSocket();
      s.emit(event, data);
    } catch (e) {}
  }, []);

  return { connected, emit, socket: getSocket() };
}
