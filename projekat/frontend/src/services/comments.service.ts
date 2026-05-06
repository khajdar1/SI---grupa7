const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

export const getComments = async (interventionId: string) => {
  const response = await fetch(
    `${API_URL}/comments/intervention/${interventionId}`,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }

  return response.json();
};

export const createComment = async (
  interventionId: string,
  payload: {
    text: string;
    authorId: number;
    role: string;
  },
) => {
  const response = await fetch(
    `${API_URL}/comments/intervention/${interventionId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to create comment');
  }

  return response.json();
};