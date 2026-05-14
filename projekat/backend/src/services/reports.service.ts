import { InterventionStatus, ReportStatus } from '@prisma/client';

import { ForbiddenError, NotFoundError } from '../shared/errors';

export const REPORT_ALLOWED_STATUSES = new Set<InterventionStatus>([
  InterventionStatus.IN_PROGRESS,
  InterventionStatus.RESOLVED,
]);

export const REPORT_FIELD_MAX_LENGTH = {
  DESCRIPTION: 5000,
  MATERIAL: 2000,
  NOTES: 2000,
} as const;

export interface CreateReportInput {
  description: string;
  material: string | null;
  notes: string | null;
}

export interface UpdateReportInput {
  description?: string;
  material?: string | null;
  notes?: string | null;
}

export interface InterventionStatusRecord {
  id: number;
  status: InterventionStatus;
}

export interface ReportAuthorRecord {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
}

export interface ReportRecord {
  id: number;
  interventionId: number;
  authorId: number;
  description: string;
  material: string | null;
  notes: string | null;
  reportDate: Date;
  status: ReportStatus;
  author: ReportAuthorRecord;
}

export interface IReportRepository {
  findInterventionById(id: number): Promise<InterventionStatusRecord | null>;
  findByInterventionId(interventionId: number): Promise<ReportRecord | null>;
  findById(id: number): Promise<ReportRecord | null>;
  isUserAssignedToIntervention(interventionId: number, userId: number): Promise<boolean>;
  create(
    interventionId: number,
    authorId: number,
    input: CreateReportInput,
  ): Promise<ReportRecord>;
  update(id: number, input: UpdateReportInput): Promise<ReportRecord>;
  finalizeReport(id: number): Promise<ReportRecord>;
}

export class ReportService {
  constructor(private readonly repository: IReportRepository) {}

  async getByInterventionId(interventionId: number): Promise<ReportRecord | null> {
    const intervention = await this.repository.findInterventionById(interventionId);
    if (!intervention) {
      throw new NotFoundError('Intervention not found.');
    }
    return this.repository.findByInterventionId(interventionId);
  }

  async create(
    interventionId: number,
    authorId: number,
    input: CreateReportInput,
  ): Promise<ReportRecord> {
    const intervention = await this.repository.findInterventionById(interventionId);
    if (!intervention) {
      throw new NotFoundError('Intervention not found.');
    }

    if (!REPORT_ALLOWED_STATUSES.has(intervention.status)) {
      throw new ForbiddenError(
        'A report can only be submitted while the intervention is in progress or resolved.',
      );
    }

    const isAssigned = await this.repository.isUserAssignedToIntervention(
      interventionId,
      authorId,
    );
    if (!isAssigned) {
      throw new ForbiddenError(
        'You can only submit a report for an intervention you are assigned to.',
      );
    }

    const existing = await this.repository.findByInterventionId(interventionId);
    if (existing) {
      throw new ForbiddenError(
        'A report already exists for this intervention. Use the update endpoint to modify it.',
      );
    }

    return this.repository.create(interventionId, authorId, input);
  }

  async update(
    interventionId: number,
    userId: number,
    input: UpdateReportInput,
  ): Promise<ReportRecord> {
    const intervention = await this.repository.findInterventionById(interventionId);
    if (!intervention) {
      throw new NotFoundError('Intervention not found.');
    }

    if (!REPORT_ALLOWED_STATUSES.has(intervention.status)) {
      throw new ForbiddenError(
        'A report can only be modified while the intervention is in progress or resolved.',
      );
    }

    const existing = await this.repository.findByInterventionId(interventionId);
    if (!existing) {
      throw new NotFoundError('Report not found for this intervention.');
    }

    if (existing.status === ReportStatus.FINALIZED) {
      throw new ForbiddenError('A finalized report cannot be modified.');
    }

    const isAssigned = await this.repository.isUserAssignedToIntervention(
      interventionId,
      userId,
    );
    if (!isAssigned) {
      throw new ForbiddenError(
        'You can only update a report for an intervention you are assigned to.',
      );
    }

    return this.repository.update(existing.id, input);
  }

  async finalize(interventionId: number): Promise<ReportRecord> {
    const intervention = await this.repository.findInterventionById(interventionId);
    if (!intervention) {
      throw new NotFoundError('Intervention not found.');
    }

    const existing = await this.repository.findByInterventionId(interventionId);
    if (!existing) {
      throw new NotFoundError('Report not found for this intervention.');
    }

    if (existing.status === ReportStatus.FINALIZED) {
      return existing;
    }

    return this.repository.finalizeReport(existing.id);
  }
}