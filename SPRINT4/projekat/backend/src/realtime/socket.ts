import type { Server as HttpServer } from 'node:http';

import { Server } from 'socket.io';

import { env } from '../config/env';

let socketServer: Server | undefined;

export function initSocket(server: HttpServer) {
  socketServer = new Server(server, {
    cors: {
      origin: env.SOCKET_CORS_ORIGIN,
      credentials: true,
    },
  });

  socketServer.on('connection', (socket) => {
    socket.emit('system:connected', {
      socketId: socket.id,
    });
  });

  return socketServer;
}

export function getSocketServer() {
  return socketServer;
}