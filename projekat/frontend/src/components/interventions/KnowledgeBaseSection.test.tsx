import { render, screen } from '@testing-library/react';
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
    interventionId: '7',
    title: 'Popravka pumpe',
    interventionDescription: 'Pumpa nije radila.',
    solution: 'Zamijenjen osigurac i testiran rad pumpe.',
    material: 'Osigurac 16A',
    notes: 'Provjeriti ponovo za 30 dana.',
    location: 'Objekat A',
    categoryId: 2,
    categoryName: 'Elektricni kvar',
    companyName: 'Demo firma',
    reportDate: '2026-05-20T10:00:00.000Z',
    interventionDate: '2026-05-19T10:00:00.000Z',
    author: 'Amir Servis',
    servicer: 'Amir Servis',
    isRecommended: false,
    recommendedAt: null,
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

  it('renders only coordinator-recommended solutions', async () => {
    getKnowledgeBaseMock.mockResolvedValue({
      message: 'Knowledge base solutions loaded successfully.',
      data: [
        makeSolution({
          reportId: 1,
          isRecommended: true,
          recommendedAt: '2026-05-21T10:00:00.000Z',
        }),
      ],
    });

    renderWithI18n(<KnowledgeBaseSection interventionId={42} />);

    expect(await screen.findByText('Knowledge base and previous solutions')).toBeInTheDocument();
    expect(screen.getByText('Recommended solutions')).toBeInTheDocument();
    expect(screen.getByText('Zamijenjen osigurac i testiran rad pumpe.')).toBeInTheDocument();
    expect(screen.queryByText('Similar previous interventions')).not.toBeInTheDocument();
    expect(screen.getByText('Recommended')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute(
      'href',
      '/interventions/7',
    );
    expect(getKnowledgeBaseMock).toHaveBeenCalledWith(42);
  });

  it('shows empty state when no recommended solutions exist', async () => {
    getKnowledgeBaseMock.mockResolvedValue({
      message: 'Knowledge base solutions loaded successfully.',
      data: [],
    });

    renderWithI18n(<KnowledgeBaseSection interventionId={42} />);

    expect(
      await screen.findByText(
        'No recommended solutions were found for this category or a similar location.',
      ),
    ).toBeInTheDocument();
  });

  it('uses Bosnian labels when saved language is Bosnian', async () => {
    window.localStorage.setItem('language', 'bs');
    getKnowledgeBaseMock.mockResolvedValue({
      message: 'Knowledge base solutions loaded successfully.',
      data: [makeSolution({ isRecommended: true })],
    });

    renderWithI18n(<KnowledgeBaseSection interventionId={42} />);

    expect(await screen.findByText('Baza znanja i ranija rješenja')).toBeInTheDocument();
    expect(screen.getByText('Preporučena rješenja')).toBeInTheDocument();
    expect(screen.getByText('Preporučeno')).toBeInTheDocument();
  });
});
