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

    socket.on('user:join', (userId: number) => {
      void socket.join(`user:${userId}`);
    });

    socket.on('role:join', (role: string) => {
      void socket.join(`role:${role}`);
    });
  });

  return socketServer;
}

export function getSocketServer() {
  return socketServer;
}

export function emitToUser(userId: number, event: string, data: unknown): void {
  socketServer?.to(`user:${userId}`).emit(event, data);
}

export function emitToRole(role: string, event: string, data: unknown): void {
  socketServer?.to(`role:${role}`).emit(event, data);
}
