import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/lib/i18n';
import {
  getInterventionKnowledgeBase,
  type KnowledgeBaseSolution,
} from '@/services/interventions.service';

import { KnowledgeBaseSection } from './KnowledgeBaseSection';

vi.mock('@/services/interventions.service', async () => {
  const actual = await vi.importActual<typeof import('@/services/interventions.service')>(
    '@/services/interventions.service',
  );

  return {
    ...actual,
    getInterventionKnowledgeBase: vi.fn(),
  };
});

const getKnowledgeBaseMock = vi.mocked(getInterventionKnowledgeBase);

function makeSolution(overrides: Partial<KnowledgeBaseSolution> = {}): KnowledgeBaseSolution {
  return {
    reportId: 1,
    title: 'Popravka pumpe',
    problemDescription: 'Pumpa nije radila.',
    solution: 'Zamijenjen osigurac i testiran rad pumpe.',
    material: 'Osigurac 16A',
    notes: 'Provjeriti ponovo za 30 dana.',
    locationHint: 'Objekat A',
    categoryId: 2,
    categoryName: 'Elektricni kvar',
    reportDate: '2026-05-20T10:00:00.000Z',
    interventionDate: '2026-05-19T10:00:00.000Z',
    isRecommended: true,
    recommendedAt: '2026-05-21T10:00:00.000Z',
    ...overrides,
  };
}

function renderWithI18n(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('KnowledgeBaseSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('renders only coordinator-recommended solutions without company or user data', async () => {
    getKnowledgeBaseMock.mockResolvedValue({
      message: 'Knowledge base solutions loaded successfully.',
      data: [makeSolution()],
    });

    renderWithI18n(<KnowledgeBaseSection interventionId={42} />);

    expect(await screen.findByText('Knowledge base and previous solutions')).toBeInTheDocument();
    expect(screen.getByText('Recommended solutions')).toBeInTheDocument();
    expect(screen.getByText('Pumpa nije radila.')).toBeInTheDocument();
    expect(screen.getByText('Zamijenjen osigurac i testiran rad pumpe.')).toBeInTheDocument();
    expect(screen.getByText('Recommended')).toBeInTheDocument();
    expect(screen.queryByText('Demo firma')).not.toBeInTheDocument();
    expect(screen.queryByText('Amir Servis')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open' })).not.toBeInTheDocument();
    expect(getKnowledgeBaseMock).toHaveBeenCalledWith(42, { text: '', location: '' });
  });

  it('searches recommended solutions by text and location', async () => {
    const user = userEvent.setup();
    getKnowledgeBaseMock.mockResolvedValue({
      message: 'Knowledge base solutions loaded successfully.',
      data: [],
    });

    renderWithI18n(<KnowledgeBaseSection interventionId={42} />);

    await screen.findByText('No recommended solutions were found for this category or a similar location.');
    await user.type(screen.getByLabelText('Search text'), 'osigurac');
    await user.type(screen.getByLabelText('Location'), 'Objekat A');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(getKnowledgeBaseMock).toHaveBeenLastCalledWith(42, {
        text: 'osigurac',
        location: 'Objekat A',
      });
    });
  });

  it('passes a selected solution back as an editable report template', async () => {
    const user = userEvent.setup();
    const onUseSolution = vi.fn();
    const solution = makeSolution();
    getKnowledgeBaseMock.mockResolvedValue({
      message: 'Knowledge base solutions loaded successfully.',
      data: [solution],
    });

    renderWithI18n(
      <KnowledgeBaseSection
        interventionId={42}
        canUseAsTemplate
        onUseSolution={onUseSolution}
      />,
    );

    await user.click(await screen.findByRole('button', { name: 'Use as report basis' }));

    expect(onUseSolution).toHaveBeenCalledWith(solution);
  });

  it('uses Bosnian labels when saved language is Bosnian', async () => {
    window.localStorage.setItem('language', 'bs');
    getKnowledgeBaseMock.mockResolvedValue({
      message: 'Knowledge base solutions loaded successfully.',
      data: [makeSolution()],
    });

    renderWithI18n(<KnowledgeBaseSection interventionId={42} />);

    expect(await screen.findByText('Baza znanja i ranija rješenja')).toBeInTheDocument();
    expect(screen.getByText('Preporučena rješenja')).toBeInTheDocument();
    expect(screen.getByText('Preporučeno')).toBeInTheDocument();
  });
});
