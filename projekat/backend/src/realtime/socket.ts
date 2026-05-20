import type { Server as HttpServer } from 'node:http';

import { Server } from 'socket.io';

import { env } from '../config/env';

let socketServer: Server | undefined;
const ticketPresence = new Map<number, Set<number>>();

function parsePositiveInteger(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function removeTicketPresence(ticketId: number, userId: number): void {
  const users = ticketPresence.get(ticketId);
  if (!users) {
    return;
  }

  users.delete(userId);
  if (users.size === 0) {
    ticketPresence.delete(ticketId);
  }
}

function getAllowedSocketOrigins(): string[] {
  return env.SOCKET_CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function initSocket(server: HttpServer) {
  socketServer = new Server(server, {
    cors: {
      origin: getAllowedSocketOrigins(),
      credentials: true,
    },
  });

  socketServer.on('connection', (socket) => {
    socket.emit('system:connected', {
      socketId: socket.id,
    });

    socket.on('user:join', (userId: number) => {
      const parsedUserId = parsePositiveInteger(userId);
      if (!parsedUserId) {
        return;
      }

      socket.data.userId = parsedUserId;
      void socket.join(`user:${parsedUserId}`);
    });

    socket.on('role:join', (role: string) => {
      void socket.join(`role:${role}`);
    });

    socket.on('ticket:join', async (payload: { ticketId?: unknown; userId?: unknown }) => {
      const ticketId = parsePositiveInteger(payload?.ticketId);
      const userId = parsePositiveInteger(payload?.userId) ?? parsePositiveInteger(socket.data.userId);

      if (!ticketId || !userId) {
        return;
      }

      const previousPresence = socket.data.ticketPresence as { ticketId?: unknown; userId?: unknown } | undefined;
      const previousTicketId = parsePositiveInteger(previousPresence?.ticketId);
      const previousUserId = parsePositiveInteger(previousPresence?.userId);
      if (previousTicketId && previousUserId && (previousTicketId !== ticketId || previousUserId !== userId)) {
        removeTicketPresence(previousTicketId, previousUserId);
        await socket.leave(`ticket:${previousTicketId}`);
      }

      await socket.join(`ticket:${ticketId}`);
      const users = ticketPresence.get(ticketId) ?? new Set<number>();
      users.add(userId);
      ticketPresence.set(ticketId, users);
      socket.data.ticketPresence = { ticketId, userId };
    });

    socket.on('ticket:leave', async (payload: { ticketId?: unknown; userId?: unknown }) => {
      const ticketId = parsePositiveInteger(payload?.ticketId);
      const userId = parsePositiveInteger(payload?.userId) ?? parsePositiveInteger(socket.data.userId);

      if (ticketId && userId) {
        removeTicketPresence(ticketId, userId);
        await socket.leave(`ticket:${ticketId}`);
      }
    });

    socket.on('disconnect', () => {
      const presence = socket.data.ticketPresence as { ticketId?: unknown; userId?: unknown } | undefined;
      const ticketId = parsePositiveInteger(presence?.ticketId);
      const userId = parsePositiveInteger(presence?.userId);

      if (ticketId && userId) {
        removeTicketPresence(ticketId, userId);
      }
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

export function emitToTicket(ticketId: number, event: string, data: unknown): void {
  socketServer?.to(`ticket:${ticketId}`).emit(event, data);
}

export function isUserViewingTicket(ticketId: number, userId: number): boolean {
  return ticketPresence.get(ticketId)?.has(userId) ?? false;
}
