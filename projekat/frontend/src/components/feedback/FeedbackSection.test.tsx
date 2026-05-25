import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { INTERVENTION_STATUS } from '@shared/enums';

import { FeedbackSection } from './FeedbackSection';
import {
  createInterventionFeedback,
  getInterventionFeedback,
  type InterventionFeedback,
} from '@/services/feedback.service';

vi.mock('@/services/feedback.service', () => ({
  getInterventionFeedback: vi.fn(),
  createInterventionFeedback: vi.fn(),
}));

const getFeedbackMock = vi.mocked(getInterventionFeedback);
const createFeedbackMock = vi.mocked(createInterventionFeedback);

function makeFeedback(overrides: Partial<InterventionFeedback> = {}): InterventionFeedback {
  return {
    id: 1,
    interventionId: 42,
    userId: 10,
    rating: 4,
    comment: 'Service was completed on time.',
    createdAt: '2026-05-22T12:00:00.000Z',
    user: {
      id: 10,
      firstName: 'Amina',
      lastName: 'Korisnik',
      username: 'amina.korisnik',
    },
    ...overrides,
  };
}

describe('FeedbackSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('shows existing feedback to users who can read feedback', async () => {
    getFeedbackMock.mockResolvedValue(makeFeedback());

    render(
      <FeedbackSection
        interventionId={42}
        interventionStatus={INTERVENTION_STATUS.RESOLVED}
        canRead
        canSubmit={false}
      />,
    );

    expect(await screen.findByText('Service was completed on time.')).toBeInTheDocument();
    expect(screen.getByText('@amina.korisnik')).toBeInTheDocument();
  });

  it('submits feedback once after confirmation', async () => {
    const user = userEvent.setup();
    getFeedbackMock.mockResolvedValue(null);
    createFeedbackMock.mockResolvedValue(makeFeedback({ rating: 3, comment: 'Good.' }));

    render(
      <FeedbackSection
        interventionId={42}
        interventionStatus={INTERVENTION_STATUS.RESOLVED}
        canRead={false}
        canSubmit
      />,
    );

    await screen.findByRole('button', { name: /submit feedback/i });
    await user.click(screen.getByRole('button', { name: /^3$/i }));
    await user.type(screen.getByLabelText(/comment/i), 'Good.');
    await user.click(screen.getByRole('button', { name: /submit feedback/i }));
    await user.click(screen.getByRole('button', { name: /^submit$/i }));

    await waitFor(() => {
      expect(createFeedbackMock).toHaveBeenCalledWith(42, {
        rating: 3,
        comment: 'Good.',
      });
    });
    expect(await screen.findByText('Good.')).toBeInTheDocument();
  });

  it('does not render before intervention is resolved', () => {
    render(
      <FeedbackSection
        interventionId={42}
        interventionStatus={INTERVENTION_STATUS.IN_PROGRESS}
        canRead
        canSubmit
      />,
    );

    expect(screen.queryByText('User Feedback')).not.toBeInTheDocument();
    expect(getFeedbackMock).not.toHaveBeenCalled();
  });

  it('uses Bosnian translations when the saved language is Bosnian', async () => {
    window.localStorage.setItem('language', 'bs');
    getFeedbackMock.mockResolvedValue(null);

    render(
      <FeedbackSection
        interventionId={42}
        interventionStatus={INTERVENTION_STATUS.RESOLVED}
        canRead={false}
        canSubmit
      />,
    );

    expect(await screen.findByText('Feedback korisnika')).toBeInTheDocument();
    expect(screen.getByText('Ocjena')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /posalji feedback/i })).toBeInTheDocument();
  });
});
