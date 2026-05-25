import { InterventionStatus } from '@prisma/client';

import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors';

export const FEEDBACK_COMMENT_MAX_LENGTH = 1000;

export interface FeedbackUserRecord {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
}

export interface FeedbackRecord {
  id: number;
  interventionId: number;
  userId: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: FeedbackUserRecord;
}

export interface FeedbackInterventionRecord {
  id: number;
  status: InterventionStatus;
  faultReport: { userId: number | null } | null;
}

export interface FeedbackViewer {
  userId: number;
  canManageFeedback: boolean;
}

export interface CreateFeedbackInput {
  rating: number;
  comment: string | null;
}

export interface FeedbackRepository {
  findInterventionById(id: number): Promise<FeedbackInterventionRecord | null>;
  findByInterventionId(interventionId: number): Promise<FeedbackRecord | null>;
  create(
    interventionId: number,
    userId: number,
    input: CreateFeedbackInput,
  ): Promise<FeedbackRecord>;
}

function isReportingUser(
  intervention: FeedbackInterventionRecord,
  userId: number,
): boolean {
  return intervention.faultReport?.userId === userId;
}

export class FeedbackService {
  constructor(private readonly repository: FeedbackRepository) {}

  async getByInterventionId(
    interventionId: number,
    viewer: FeedbackViewer,
  ): Promise<FeedbackRecord | null> {
    const intervention = await this.repository.findInterventionById(interventionId);

    if (!intervention) {
      throw new NotFoundError('Intervention not found.');
    }

    if (!viewer.canManageFeedback && !isReportingUser(intervention, viewer.userId)) {
      throw new ForbiddenError('You do not have permission to view feedback for this intervention.');
    }

    const feedback = await this.repository.findByInterventionId(interventionId);

    if (!feedback) {
      return null;
    }

    if (!viewer.canManageFeedback && feedback.userId !== viewer.userId) {
      throw new ForbiddenError('You do not have permission to view feedback for this intervention.');
    }

    return feedback;
  }

  async create(
    interventionId: number,
    userId: number,
    input: CreateFeedbackInput,
  ): Promise<FeedbackRecord> {
    const intervention = await this.repository.findInterventionById(interventionId);

    if (!intervention) {
      throw new NotFoundError('Intervention not found.');
    }

    if (intervention.status !== InterventionStatus.RESOLVED) {
      throw new ForbiddenError('Feedback can only be submitted after the intervention is resolved.');
    }

    if (!isReportingUser(intervention, userId)) {
      throw new ForbiddenError('Only the reporting user can submit feedback for this intervention.');
    }

    const existing = await this.repository.findByInterventionId(interventionId);
    if (existing) {
      throw new ConflictError('Feedback has already been submitted for this intervention.');
    }

    return this.repository.create(interventionId, userId, input);
  }
}
