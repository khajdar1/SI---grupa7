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

export interface FeedbackAnalyticsQuery {
  from?: string;
  to?: string;
  companyId?: string;
  categoryId?: string;
  servicerId?: string;
}

export interface FeedbackAnalytics {
  summary: {
    feedbackCount: number;
    averageRating: number | null;
    negativeCount: number;
    negativeThreshold: number;
  };
  ratingDistribution: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
  trends: Array<{
    period: string;
    feedbackCount: number;
    averageRating: number | null;
    negativeCount: number;
  }>;
  byCompany: Array<{
    companyId: number;
    companyName: string;
    feedbackCount: number;
    averageRating: number | null;
    negativeCount: number;
  }>;
  byCategory: Array<{
    categoryId: number;
    categoryName: string;
    feedbackCount: number;
    averageRating: number | null;
    negativeCount: number;
  }>;
  byServicer: Array<{
    servicerId: number | null;
    servicerName: string;
    feedbackCount: number;
    averageRating: number | null;
    negativeCount: number;
  }>;
  negativeFeedback: Array<{
    id: number;
    interventionId: number;
    interventionName: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    companyName: string;
    categoryName: string;
    user: FeedbackUser;
  }>;
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

export async function getFeedbackAnalytics(
  query: FeedbackAnalyticsQuery = {},
): Promise<FeedbackAnalytics> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  const suffix = params.toString() ? `?${params.toString()}` : '';

  return getResponseData(
    () => api.get<FeedbackAnalytics>(`${API_ENDPOINTS.FEEDBACK.ANALYTICS}${suffix}`),
    'Failed to load feedback analytics.',
  );
}
