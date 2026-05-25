import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import type { ReactElement } from 'react';
import MonthCalendar from './MonthCalendar';
import { PRIORITY } from '@shared/enums';
import { I18nProvider } from '@/lib/i18n';

type TestEvent = {
  id: string;
  title: string;
  date: string;
  priority: keyof typeof PRIORITY | string;
};

describe('MonthCalendar', () => {
  const mockPush = vi.fn();
  const mockedUseRouter = vi.mocked(useRouter);
  const fixedNow = new Date('2026-05-15T12:00:00.000Z');

  const renderWithI18n = (ui: ReactElement) =>
    render(<I18nProvider>{ui}</I18nProvider>);

  const renderCalendar = (events: TestEvent[] = []) =>
    renderWithI18n(<MonthCalendar events={events} />);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
    vi.clearAllMocks();
    mockedUseRouter.mockReturnValue({
      push: mockPush,
    } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders month, week, and day controls', () => {
    renderCalendar();

    expect(screen.getByText('May 2026')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Month', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Day' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /prev/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('switches between month, week, and day views', () => {
    renderCalendar([
      {
        id: '1',
        title: 'Mode Event',
        date: '2026-05-15T09:00:00.000Z',
        priority: PRIORITY.MEDIUM,
      },
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(screen.getByRole('button', { name: 'Week', pressed: true })).toBeInTheDocument();
    expect(screen.getByText('11 May 2026 - 17 May 2026')).toBeInTheDocument();
    expect(screen.getByText('Mode Event')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Day' }));
    expect(screen.getByRole('button', { name: 'Day', pressed: true })).toBeInTheDocument();
    expect(screen.getByText('Friday, 15 May 2026')).toBeInTheDocument();
    expect(screen.getByText('Mode Event')).toBeInTheDocument();
  });

  it('navigates to intervention detail when an event is clicked', () => {
    renderCalendar([
      {
        id: '42',
        title: 'Test Intervention',
        date: '2026-05-15T09:00:00.000Z',
        priority: PRIORITY.HIGH,
      },
    ]);

    fireEvent.click(screen.getByRole('button', { name: /test intervention/i }));

    expect(mockPush).toHaveBeenCalledWith('/interventions/42');
  });

  it.each([
    [PRIORITY.CRITICAL, 'var(--priority-critical)'],
    [PRIORITY.HIGH, 'var(--priority-high)'],
    [PRIORITY.MEDIUM, 'var(--priority-medium)'],
    [PRIORITY.LOW, 'var(--priority-low)'],
  ] as const)('renders %s events with the expected priority color', (priority, expectedColor) => {
    renderCalendar([
      {
        id: '1',
        title: `${priority} Event`,
        date: '2026-05-15T09:00:00.000Z',
        priority,
      },
    ]);

    const eventButton = screen.getByRole('button', { name: new RegExp(`${priority} Event`, 'i') });
    const dot = eventButton.querySelector('span[aria-hidden="true"]');

    expect(dot).toHaveStyle({ background: expectedColor });
  });

  it('shows overflow when more than three events share the same day', () => {
    const events = Array.from({ length: 5 }, (_value, index) => ({
      id: String(index + 1),
      title: `Event ${index + 1}`,
      date: '2026-05-15T09:00:00.000Z',
      priority: PRIORITY.MEDIUM,
    }));

    renderCalendar(events);

    expect(screen.getByText('Event 1')).toBeInTheDocument();
    expect(screen.getByText('Event 2')).toBeInTheDocument();
    expect(screen.getByText('Event 3')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('skips events without a valid date', () => {
    renderCalendar([
      {
        id: '1',
        title: 'Valid Event',
        date: '2026-05-15T09:00:00.000Z',
        priority: PRIORITY.MEDIUM,
      },
      {
        id: '2',
        title: 'Undated Event',
        date: '',
        priority: PRIORITY.MEDIUM,
      },
      {
        id: '3',
        title: 'Invalid Event',
        date: 'not-a-date',
        priority: PRIORITY.MEDIUM,
      },
    ]);

    expect(screen.getByText('Valid Event')).toBeInTheDocument();
    expect(screen.queryByText('Undated Event')).not.toBeInTheDocument();
    expect(screen.queryByText('Invalid Event')).not.toBeInTheDocument();
  });

  it('does not rely on toISOString when grouping dates', () => {
    const toISOStringSpy = vi.spyOn(Date.prototype, 'toISOString');

    renderCalendar([
      {
        id: '1',
        title: 'Local Event',
        date: '2026-05-15T09:00:00.000Z',
        priority: PRIORITY.MEDIUM,
      },
    ]);

    expect(toISOStringSpy).not.toHaveBeenCalled();
  });
});
