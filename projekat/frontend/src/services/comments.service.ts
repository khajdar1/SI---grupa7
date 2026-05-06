import { api } from '@/lib/api';
import { ServiceError, getErrorMessage } from './errors';

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
  try {
    const response = await api.get<Comment[]>(`/api/v1/comments/intervention/${interventionId}`);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Greška pri učitavanju komentara.'), error);
  }
};

export const createComment = async (
  interventionId: string,
  payload: {
    text: string;
    authorId: number;
    role: string;
  },
): Promise<Comment> => {
  try {
    const response = await api.post<Comment>(
      `/api/v1/comments/intervention/${interventionId}`,
      payload,
    );
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Greška pri slanju komentara.'), error);
  }
};
