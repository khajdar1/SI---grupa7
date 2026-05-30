export interface AvailabilityActor {
  id: number;
  username: string;
}

export interface UnavailabilityRecord {
  id: number;
  userId: number;
  startAt: Date;
  endAt: Date;
  reason: string;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnavailabilityInput {
  startAt: Date;
  endAt: Date;
  reason: string;
}

export interface AvailabilityRepository {
  findById(id: number): Promise<UnavailabilityRecord | null>;
  listByUser(userId: number): Promise<UnavailabilityRecord[]>;
  create(userId: number, input: UnavailabilityInput): Promise<UnavailabilityRecord>;
  update(id: number, input: UnavailabilityInput): Promise<UnavailabilityRecord>;
  cancel(id: number, canceledAt: Date): Promise<UnavailabilityRecord>;
}

export interface AvailabilityAuditLogger {
  record(entry: {
    action: string;
    entity: string;
    entityId: number | string;
    actorId: number;
    actorUsername: string;
    details: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
  }): Promise<void>;
}

export class AvailabilityValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AvailabilityValidationError';
  }
}

export class AvailabilityNotFoundError extends Error {
  constructor(message = 'Unavailability period not found.') {
    super(message);
    this.name = 'AvailabilityNotFoundError';
  }
}

export class AvailabilityForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AvailabilityForbiddenError';
  }
}

function assertFuturePeriod(input: UnavailabilityInput) {
  if (input.endAt <= input.startAt) {
    throw new AvailabilityValidationError('End date must be after start date.');
  }

  if (input.endAt <= new Date()) {
    throw new AvailabilityValidationError('Only future unavailability periods can be managed.');
  }
}

function serialize(record: UnavailabilityRecord) {
  return {
    startAt: record.startAt.toISOString(),
    endAt: record.endAt.toISOString(),
    reason: record.reason,
    canceledAt: record.canceledAt?.toISOString() ?? null,
  };
}

export class AvailabilityService {
  constructor(
    private readonly repository: AvailabilityRepository,
    private readonly auditLogger: AvailabilityAuditLogger,
  ) {}

  listMine(actor: AvailabilityActor): Promise<UnavailabilityRecord[]> {
    return this.repository.listByUser(actor.id);
  }

  async createMine(
    actor: AvailabilityActor,
    input: UnavailabilityInput,
  ): Promise<UnavailabilityRecord> {
    assertFuturePeriod(input);

    const record = await this.repository.create(actor.id, input);
    await this.auditLogger.record({
      action: 'SERVICER_UNAVAILABILITY_CREATED',
      entity: 'ServicerUnavailability',
      entityId: record.id,
      actorId: actor.id,
      actorUsername: actor.username,
      details: `Servicer ${actor.username} created an unavailability period.`,
      newValues: serialize(record),
    });

    return record;
  }

  async updateMine(
    actor: AvailabilityActor,
    periodId: number,
    input: UnavailabilityInput,
  ): Promise<UnavailabilityRecord> {
    assertFuturePeriod(input);

    const existing = await this.repository.findById(periodId);
    if (!existing) {
      throw new AvailabilityNotFoundError();
    }

    if (existing.userId !== actor.id) {
      throw new AvailabilityForbiddenError('You can only update your own unavailability periods.');
    }

    if (existing.canceledAt) {
      throw new AvailabilityValidationError('Canceled periods cannot be updated.');
    }

    if (existing.startAt <= new Date()) {
      throw new AvailabilityValidationError('Started unavailability periods cannot be updated.');
    }

    const updated = await this.repository.update(periodId, input);
    await this.auditLogger.record({
      action: 'SERVICER_UNAVAILABILITY_UPDATED',
      entity: 'ServicerUnavailability',
      entityId: periodId,
      actorId: actor.id,
      actorUsername: actor.username,
      details: `Servicer ${actor.username} updated an unavailability period.`,
      oldValues: serialize(existing),
      newValues: serialize(updated),
    });

    return updated;
  }

  async cancelMine(
    actor: AvailabilityActor,
    periodId: number,
  ): Promise<UnavailabilityRecord> {
    const existing = await this.repository.findById(periodId);
    if (!existing) {
      throw new AvailabilityNotFoundError();
    }

    if (existing.userId !== actor.id) {
      throw new AvailabilityForbiddenError('You can only cancel your own unavailability periods.');
    }

    if (existing.canceledAt) {
      return existing;
    }

    if (existing.endAt <= new Date()) {
      throw new AvailabilityValidationError('Past unavailability periods cannot be canceled.');
    }

    const updated = await this.repository.cancel(periodId, new Date());
    await this.auditLogger.record({
      action: 'SERVICER_UNAVAILABILITY_CANCELED',
      entity: 'ServicerUnavailability',
      entityId: periodId,
      actorId: actor.id,
      actorUsername: actor.username,
      details: `Servicer ${actor.username} canceled an unavailability period.`,
      oldValues: serialize(existing),
      newValues: serialize(updated),
    });

    return updated;
  }
}
