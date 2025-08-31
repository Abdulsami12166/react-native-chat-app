import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../env';
import { getToken } from '../services/storage';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const socket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { token }
      });
      socketRef.current = socket;

      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));

      return () => {
        socket.disconnect();
      };
    })();
  }, []);

  return { socket: socketRef.current, connected };
}
