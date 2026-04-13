import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    const SOCKET_BASE = import.meta.env.VITE_API_URL || '';
    socket = io(SOCKET_BASE || '/', { transports: ['websocket', 'polling'] });
  }
  return socket;
}

export function useSocket(eventHandlers = {}) {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    const s = getSocket();

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    // Register event handlers
    const events = Object.keys(handlersRef.current);
    events.forEach(event => {
      s.on(event, (...args) => handlersRef.current[event]?.(...args));
    });

    return () => {
      events.forEach(event => s.off(event));
    };
  }, []);

  const emit = useCallback((event, data) => {
    const s = getSocket();
    s.emit(event, data);
  }, []);

  return { connected, emit, socket: getSocket() };
}
