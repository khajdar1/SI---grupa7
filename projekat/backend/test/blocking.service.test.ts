import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BlockingConflictError,
  BlockingForbiddenError,
  BlockingNotFoundError,
  BlockingService,
  BlockingValidationError,
  type BlockInput,
  type BlockRecord,
  type IBlockingAuditLogger,
  type IBlockingRepository,
} from '../src/modules/blocking/blocking.service';

const ACTOR = { id: 1, username: 'koordinator1' };
const COMPANY_ID = 10;

function makeBlock(overrides: Partial<BlockRecord> = {}): BlockRecord {
  return {
    id: 1,
    userId: 99,
    companyId: COMPANY_ID,
    coordinatorId: ACTOR.id,
    reason: 'Spam',
    blockedAt: new Date(),
    blockedUser: {
      id: 99,
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      email: 'test@example.com',
    },
    coordinator: {
      id: ACTOR.id,
      firstName: 'Koordinator',
      lastName: 'Jedan',
      username: ACTOR.username,
    },
    ...overrides,
  };
}

function makeRepository(overrides: Partial<IBlockingRepository> = {}): IBlockingRepository {
  return {
    findBlockById: vi.fn().mockResolvedValue(null),
    findExistingBlock: vi.fn().mockResolvedValue(null),
    findUserById: vi.fn().mockResolvedValue({ id: 99, active: true }),
    findCompanyById: vi.fn().mockResolvedValue({ id: COMPANY_ID }),
    listBlocks: vi.fn().mockResolvedValue([]),
    createBlock: vi.fn().mockImplementation(async (input: BlockInput) => makeBlock({ reason: input.reason })),
    deleteBlock: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeAuditLogger(): IBlockingAuditLogger {
  return { record: vi.fn().mockResolvedValue(undefined) };
}

describe('BlockingService.listBlockedUsers', () => {
  it('should return blocked users', async () => {
    const block = makeBlock();
    const repo = makeRepository({ listBlocks: vi.fn().mockResolvedValue([block]) });
    const service = new BlockingService(repo, makeAuditLogger());

    const result = await service.listBlockedUsers();

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(99);
    expect(repo.listBlocks).toHaveBeenCalled();
  });

  it('should return empty array when no users are blocked', async () => {
    const service = new BlockingService(makeRepository(), makeAuditLogger());

    const result = await service.listBlockedUsers();

    expect(result).toHaveLength(0);
  });
});

describe('BlockingService.blockUser', () => {
  it('should create a block record and log audit event', async () => {
    const repo = makeRepository();
    const logger = makeAuditLogger();
    const service = new BlockingService(repo, logger);

    const result = await service.blockUser({ userId: 99, companyId: COMPANY_ID, reason: 'Spam' }, ACTOR.id, ACTOR);

    expect(repo.createBlock).toHaveBeenCalledWith({
      userId: 99,
      coordinatorId: ACTOR.id,
      companyId: COMPANY_ID,
      reason: 'Spam',
    });
    expect(logger.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_BLOCKED' }),
    );
    expect(result.userId).toBe(99);
  });

  it('should throw BlockingValidationError when company does not exist', async () => {
    const repo = makeRepository({ findCompanyById: vi.fn().mockResolvedValue(null) });
    const service = new BlockingService(repo, makeAuditLogger());

    await expect(
      service.blockUser({ userId: 99, companyId: COMPANY_ID, reason: 'Spam' }, ACTOR.id, ACTOR),
    ).rejects.toThrow(BlockingValidationError);
  });

  it('should throw BlockingForbiddenError when coordinator tries to block themselves', async () => {
    const service = new BlockingService(makeRepository(), makeAuditLogger());

    await expect(
      service.blockUser({ userId: ACTOR.id, companyId: COMPANY_ID, reason: 'Self block' }, ACTOR.id, ACTOR),
    ).rejects.toThrow(BlockingForbiddenError);
  });

  it('should throw BlockingValidationError when target user does not exist', async () => {
    const repo = makeRepository({ findUserById: vi.fn().mockResolvedValue(null) });
    const service = new BlockingService(repo, makeAuditLogger());

    await expect(
      service.blockUser({ userId: 999, companyId: COMPANY_ID, reason: 'Spam' }, ACTOR.id, ACTOR),
    ).rejects.toThrow(BlockingValidationError);
  });

  it('should throw BlockingConflictError when user is already blocked for the company', async () => {
    const repo = makeRepository({
      findExistingBlock: vi.fn().mockResolvedValue({ id: 5 }),
    });
    const service = new BlockingService(repo, makeAuditLogger());

    await expect(
      service.blockUser({ userId: 99, companyId: COMPANY_ID, reason: 'Spam' }, ACTOR.id, ACTOR),
    ).rejects.toThrow(BlockingConflictError);
  });

  it('should not create a block when company does not exist', async () => {
    const repo = makeRepository({ findCompanyById: vi.fn().mockResolvedValue(null) });
    const service = new BlockingService(repo, makeAuditLogger());

    try {
      await service.blockUser({ userId: 99, companyId: COMPANY_ID, reason: 'Spam' }, ACTOR.id, ACTOR);
    } catch {}

    expect(repo.createBlock).not.toHaveBeenCalled();
  });
});

describe('BlockingService.unblockUser', () => {
  it('should delete the block record and log audit event', async () => {
    const block = makeBlock();
    const repo = makeRepository({ findBlockById: vi.fn().mockResolvedValue(block) });
    const logger = makeAuditLogger();
    const service = new BlockingService(repo, logger);

    await service.unblockUser(1, ACTOR.id, ACTOR);

    expect(repo.deleteBlock).toHaveBeenCalledWith(1);
    expect(logger.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_UNBLOCKED' }),
    );
  });

  it('should throw BlockingNotFoundError when block does not exist', async () => {
    const service = new BlockingService(makeRepository(), makeAuditLogger());

    await expect(service.unblockUser(999, ACTOR.id, ACTOR)).rejects.toThrow(
      BlockingNotFoundError,
    );
  });

});

describe('BlockingService.isUserBlocked', () => {
  it('should return true when a block exists', async () => {
    const repo = makeRepository({
      findExistingBlock: vi.fn().mockResolvedValue({ id: 1 }),
    });
    const service = new BlockingService(repo, makeAuditLogger());

    const result = await service.isUserBlocked(99, COMPANY_ID);

    expect(result).toBe(true);
  });

  it('should return false when no block exists', async () => {
    const service = new BlockingService(makeRepository(), makeAuditLogger());

    const result = await service.isUserBlocked(99, COMPANY_ID);

    expect(result).toBe(false);
  });

  it('should query with the correct userId and companyId', async () => {
    const repo = makeRepository();
    const service = new BlockingService(repo, makeAuditLogger());

    await service.isUserBlocked(42, 7);

    expect(repo.findExistingBlock).toHaveBeenCalledWith(42, 7);
  });
});
