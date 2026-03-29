import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'https://justflatmate.in/api').replace('/api', '');

let socketInstance = null;

export default function useSocket() {
  const [socket, setSocket] = useState(socketInstance);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      if (socketInstance) { socketInstance.disconnect(); socketInstance = null; }
      setSocket(null);
      return;
    }

    if (socketInstance?.connected) { setSocket(socketInstance); return; }
    if (socketInstance) socketInstance.disconnect();

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });

    s.on('connect', () => console.log('[Admin Socket] Connected:', s.id));
    s.on('disconnect', (reason) => {
      console.log('[Admin Socket] Disconnected:', reason);
      if (reason === 'io server disconnect') s.connect();
    });
    s.on('ping-check', () => s.emit('pong-check'));

    socketInstance = s;
    setSocket(s);

    return () => {};
  }, []);

  return socket;
}
