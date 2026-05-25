export interface BlockedUserInfo {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

export interface CoordinatorInfo {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
}

export interface BlockRecord {
  id: number;
  userId: number;
  companyId: number;
  coordinatorId: number;
  reason: string;
  blockedAt: Date;
  blockedUser: BlockedUserInfo;
  coordinator: CoordinatorInfo;
  company?: {
    id: number;
    name: string;
  };
}

export interface BlockInput {
  userId: number;
  coordinatorId: number;
  companyId: number;
  reason: string;
}

export interface BlockingActor {
  id: number;
  username: string;
}

export interface IBlockingRepository {
  findBlockById(blockId: number): Promise<BlockRecord | null>;
  findExistingBlock(userId: number, companyId: number): Promise<{ id: number } | null>;
  findUserById(userId: number): Promise<{ id: number; active: boolean } | null>;
  findUserByUsername(username: string): Promise<{ id: number; active: boolean } | null>;
  findCompanyById(companyId: number): Promise<{ id: number } | null>;
  listBlocks(): Promise<BlockRecord[]>;
  createBlock(input: BlockInput): Promise<BlockRecord>;
  deleteBlock(blockId: number): Promise<void>;
}

export interface IBlockingAuditLogger {
  record(entry: {
    action: string;
    entity: string;
    entityId: number | string;
    actorId: number;
    actorUsername: string;
    details: string;
    newValues?: Record<string, string | number | boolean | null>;
    oldValues?: Record<string, string | number | boolean | null>;
  }): Promise<void>;
}

export class BlockingNotFoundError extends Error {
  constructor(message = 'Block record not found.') {
    super(message);
    this.name = 'BlockingNotFoundError';
  }
}

export class BlockingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlockingConflictError';
  }
}

export class BlockingForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlockingForbiddenError';
  }
}

export class BlockingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlockingValidationError';
  }
}

export class BlockingService {
  constructor(
    private readonly repository: IBlockingRepository,
    private readonly auditLogger: IBlockingAuditLogger,
  ) {}

  async listBlockedUsers(): Promise<BlockRecord[]> {
    return this.repository.listBlocks();
  }

  async blockUser(
    input: { userId: number; companyId: number; reason: string },
    coordinatorId: number,
    actor: BlockingActor,
  ): Promise<BlockRecord> {
    if (input.userId === coordinatorId) {
      throw new BlockingForbiddenError('A coordinator cannot block their own account.');
    }

    const user = await this.repository.findUserById(input.userId);
    if (!user) {
      throw new BlockingValidationError('User to block was not found.');
    }

    const company = await this.repository.findCompanyById(input.companyId);
    if (!company) {
      throw new BlockingValidationError('Company to block from was not found.');
    }

    const existing = await this.repository.findExistingBlock(input.userId, input.companyId);
    if (existing) {
      throw new BlockingConflictError('User is already blocked for this company.');
    }

    const block = await this.repository.createBlock({
      userId: input.userId,
      coordinatorId,
      companyId: input.companyId,
      reason: input.reason,
    });

    await this.auditLogger.record({
      action: 'USER_BLOCKED',
      entity: 'UserBlock',
      entityId: block.id,
      actorId: actor.id,
      actorUsername: actor.username,
      details: `User ${block.blockedUser.username} blocked by ${actor.username} for company ${input.companyId}. Reason: ${input.reason}`,
      newValues: {
        userId: input.userId,
        companyId: input.companyId,
        reason: input.reason,
      },
    });

    return block;
  }

  async unblockUser(
    blockId: number,
    _coordinatorId: number,
    actor: BlockingActor,
  ): Promise<void> {
    const block = await this.repository.findBlockById(blockId);
    if (!block) {
      throw new BlockingNotFoundError();
    }

    await this.repository.deleteBlock(blockId);

    await this.auditLogger.record({
      action: 'USER_UNBLOCKED',
      entity: 'UserBlock',
      entityId: blockId,
      actorId: actor.id,
      actorUsername: actor.username,
      details: `User ${block.blockedUser.username} unblocked by ${actor.username} for company ${block.companyId}.`,
      oldValues: {
        userId: block.userId,
        companyId: block.companyId,
        reason: block.reason,
      },
    });
  }

  async isUserBlocked(userId: number, companyId: number): Promise<boolean> {
    const block = await this.repository.findExistingBlock(userId, companyId);
    return block !== null;
  }
}
