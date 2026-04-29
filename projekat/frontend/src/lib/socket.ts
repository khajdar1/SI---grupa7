import { io } from 'socket.io-client';
import { NETWORK } from '@/constants';

export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? NETWORK.SOCKET_URL_FALLBACK, {
  autoConnect: false,
  withCredentials: true,
});
