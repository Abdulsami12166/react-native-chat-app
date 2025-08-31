import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { SOCKET_URL } from '../../env';
import { useAuth } from '../context/AuthContext';

export function useSocket() {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const s = io(SOCKET_URL, { transports: ['websocket'] });

    s.on('connect', () => {
      console.log('socket connected', s.id);
      s.emit('auth', token);
      // let server know explicitly user is online
      if (user?. _id) s.emit('user:online', user._id);
      s.emit('presence:get');
    });

    s.on('disconnect', () => {
      console.log('socket disconnected');
    });

    setSocket(s);
    return () => {
      s.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { socket };
}
