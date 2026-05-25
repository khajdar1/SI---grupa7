import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';
import { getStoredLanguage, translateKey } from '@/lib/i18n';

import { getResponseData } from './errors';

export interface FeedbackUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
}

export interface InterventionFeedback {
  id: number;
  interventionId: number;
  userId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: FeedbackUser;
}

export interface CreateFeedbackPayload {
  rating: number;
  comment: string | null;
}

export async function getInterventionFeedback(
  interventionId: number | string,
): Promise<InterventionFeedback | null> {
  return getResponseData(
    () => api.get<InterventionFeedback | null>(API_ENDPOINTS.FEEDBACK.BY_INTERVENTION(interventionId)),
    translateKey(getStoredLanguage(), 'feedback.loadError'),
  );
}

export async function createInterventionFeedback(
  interventionId: number | string,
  payload: CreateFeedbackPayload,
): Promise<InterventionFeedback> {
  return getResponseData(
    () => api.post<InterventionFeedback>(API_ENDPOINTS.FEEDBACK.BY_INTERVENTION(interventionId), payload),
    translateKey(getStoredLanguage(), 'feedback.submitError'),
  );
}
