import { io } from 'socket.io-client';
import { NETWORK } from '@/constants';

const isProduction = process.env.NODE_ENV === 'production';
const socketUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  (isProduction ? '/' : NETWORK.SOCKET_URL_FALLBACK);

export const socket = io(socketUrl, {
  autoConnect: false,
  withCredentials: true,
});
