import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  connectionHandlerRef,
  toMock,
  roomEmitMock,
} = vi.hoisted(() => ({
  connectionHandlerRef: { current: undefined as ((socket: MockSocket) => void) | undefined },
  toMock: vi.fn(),
  roomEmitMock: vi.fn(),
}));

type MockSocket = {
  id: string;
  data: Record<string, unknown>;
  emit: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  join: ReturnType<typeof vi.fn>;
  leave: ReturnType<typeof vi.fn>;
};

vi.mock('socket.io', () => ({
  Server: class MockSocketServer {
    on(event: string, handler: (socket: MockSocket) => void): void {
      if (event === 'connection') {
        connectionHandlerRef.current = handler;
      }
    }

    to = toMock;
  },
}));

import { emitToTicket, initSocket, isUserViewingTicket } from '../src/realtime/socket';

function createMockSocket(): { socket: MockSocket; listeners: Map<string, (payload?: unknown) => unknown> } {
  const listeners = new Map<string, (payload?: unknown) => unknown>();

  const socket: MockSocket = {
    id: 'socket-1',
    data: {},
    emit: vi.fn(),
    on: vi.fn((event: string, handler: (payload?: unknown) => unknown) => {
      listeners.set(event, handler);
    }),
    join: vi.fn().mockResolvedValue(undefined),
    leave: vi.fn().mockResolvedValue(undefined),
  };

  return { socket, listeners };
}

beforeEach(() => {
  connectionHandlerRef.current = undefined;
  toMock.mockReset();
  roomEmitMock.mockReset();
  toMock.mockReturnValue({ emit: roomEmitMock });
});

describe('realtime socket ticket rooms', () => {
  it('should join ticket room and track ticket presence', async () => {
    initSocket({} as never);
    const { socket, listeners } = createMockSocket();
    connectionHandlerRef.current?.(socket);

    await listeners.get('ticket:join')?.({ ticketId: 41, userId: 6 });

    expect(socket.join).toHaveBeenCalledWith('ticket:41');
    expect(isUserViewingTicket(41, 6)).toBe(true);
  });

  it('should leave previous ticket room when switching tickets', async () => {
    initSocket({} as never);
    const { socket, listeners } = createMockSocket();
    connectionHandlerRef.current?.(socket);

    await listeners.get('ticket:join')?.({ ticketId: 41, userId: 6 });
    await listeners.get('ticket:join')?.({ ticketId: 42, userId: 6 });

    expect(socket.leave).toHaveBeenCalledWith('ticket:41');
    expect(socket.join).toHaveBeenCalledWith('ticket:42');
    expect(isUserViewingTicket(41, 6)).toBe(false);
    expect(isUserViewingTicket(42, 6)).toBe(true);
  });

  it('should leave ticket room and clear ticket presence on ticket:leave', async () => {
    initSocket({} as never);
    const { socket, listeners } = createMockSocket();
    connectionHandlerRef.current?.(socket);

    await listeners.get('ticket:join')?.({ ticketId: 55, userId: 7 });
    await listeners.get('ticket:leave')?.({ ticketId: 55, userId: 7 });

    expect(socket.leave).toHaveBeenCalledWith('ticket:55');
    expect(isUserViewingTicket(55, 7)).toBe(false);
  });

  it('should emit events to ticket room via emitToTicket helper', () => {
    initSocket({} as never);

    emitToTicket(88, 'message:created', { id: 1 });

    expect(toMock).toHaveBeenCalledWith('ticket:88');
    expect(roomEmitMock).toHaveBeenCalledWith('message:created', { id: 1 });
  });
});
