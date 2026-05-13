import { api } from '@/lib/api';

import { getResponseData } from './errors';

export interface Comment {
  id: number;
  text: string;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
    username: string;
  };
}

export const getComments = async (interventionId: string): Promise<Comment[]> => {
  return getResponseData(
    () => api.get<Comment[]>(`/api/v1/comments/intervention/${interventionId}`),
    'Failed to load comments.',
  );
};

export const createComment = async (
  interventionId: string,
  payload: {
    text: string;
  },
): Promise<Comment> => {
  return getResponseData(
    () => api.post<Comment>(
      `/api/v1/comments/intervention/${interventionId}`,
      payload,
    ),
    'Failed to send comment.',
  );
};
