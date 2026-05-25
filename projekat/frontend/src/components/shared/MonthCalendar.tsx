'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PRIORITY } from '@shared/enums';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants';
import { useI18n } from '@/lib/i18n';

type EventItem = {
  id: string;
  title: string;
  date: string; // ISO
  priority: keyof typeof PRIORITY | string;
};

type CalendarMode = 'month' | 'week' | 'day';

interface MonthCalendarProps {
  events: EventItem[];
}

const WEEKDAY_LABELS = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  bs: ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'],
};
const CALENDAR_MODES: Array<{ value: CalendarMode; label: string }> = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
];

const PRIORITY_COLORS: Record<string, string> = {
  [PRIORITY.CRITICAL]: 'var(--priority-critical)',
  [PRIORITY.HIGH]: 'var(--priority-high)',
  [PRIORITY.MEDIUM]: 'var(--priority-medium)',
  [PRIORITY.LOW]: 'var(--priority-low)',
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

function startOfWeek(d: Date) {
  const day = startOfDay(d);
  const offset = (day.getDay() + 6) % 7;
  return addDays(day, -offset);
}

function getLocalDateKey(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getCalendarModeLabel(mode: CalendarMode, language: 'en' | 'bs') {
  if (language === 'bs') {
    return mode === 'month' ? 'Mjesec' : mode === 'week' ? 'Sedmica' : 'Dan';
  }

  return mode === 'month' ? 'Month' : mode === 'week' ? 'Week' : 'Day';
}

function formatMonthLabel(d: Date, language: 'en' | 'bs') {
  return d.toLocaleString(language === 'bs' ? 'bs-BA' : 'en-GB', { month: 'long', year: 'numeric' });
}

function formatWeekLabel(d: Date, language: 'en' | 'bs') {
  const start = startOfWeek(d);
  const end = addDays(start, 6);
  const locale = language === 'bs' ? 'bs-BA' : 'en-GB';

  return `${start.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })} - ${end.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

function formatDayLabel(d: Date, language: 'en' | 'bs') {
  return d.toLocaleDateString(language === 'bs' ? 'bs-BA' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function buildMonthGrid(d: Date) {
  const start = startOfMonth(d);
  const end = endOfMonth(d);

  const firstWeekday = (start.getDay() + 6) % 7;
  const days: Array<Date | null> = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= end.getDate(); day += 1) {
    days.push(new Date(d.getFullYear(), d.getMonth(), day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  const weeks: Array<Array<Date | null>> = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}

function buildVisibleCalendar(d: Date, mode: CalendarMode) {
  if (mode === 'day') {
    return [[startOfDay(d)]];
  }

  if (mode === 'week') {
    const weekStart = startOfWeek(d);
    return [
      Array.from({ length: 7 }, (_value, index) => addDays(weekStart, index)),
    ];
  }

  return buildMonthGrid(d);
}

function getNextFocusDate(d: Date, mode: CalendarMode, direction: -1 | 1) {
  if (mode === 'day') {
    return addDays(startOfDay(d), direction);
  }

  if (mode === 'week') {
    return addDays(startOfDay(d), direction * 7);
  }

  return addMonths(startOfMonth(d), direction);
}

function getPriorityColor(priority: EventItem['priority']) {
  return PRIORITY_COLORS[priority] ?? PRIORITY_COLORS[PRIORITY.LOW];
}

export default function MonthCalendar({ events }: MonthCalendarProps) {
  const router = useRouter();
  const { language } = useI18n();
  const [current, setCurrent] = useState(() => startOfDay(new Date()));
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month');

  const calendarRows = useMemo(
    () => buildVisibleCalendar(current, calendarMode),
    [calendarMode, current],
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();

    for (const ev of events) {
      if (!ev.date) continue;
      const date = new Date(ev.date);
      if (Number.isNaN(date.getTime())) continue;

      const key = getLocalDateKey(date);
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }

    return map;
  }, [events]);

  const label =
    calendarMode === 'day'
      ? formatDayLabel(current, language)
      : calendarMode === 'week'
        ? formatWeekLabel(current, language)
        : formatMonthLabel(current, language);

  const navigate = (direction: -1 | 1) => {
    setCurrent((value) => getNextFocusDate(value, calendarMode, direction));
  };

  const gridColumnsClass = calendarMode === 'day' ? 'grid-cols-1' : 'grid-cols-7';
  const cellMinHeightClass =
    calendarMode === 'day' ? 'min-h-[180px]' : calendarMode === 'week' ? 'min-h-[120px]' : 'min-h-[90px]';

  const renderEventButton = (ev: EventItem) => (
    <button
      key={ev.id}
      type="button"
      onClick={() => router.push(ROUTES.INTERVENTION(ev.id))}
      className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-muted"
    >
      <span
        className="h-2 w-2 rounded-full"
        aria-hidden="true"
        style={{ background: getPriorityColor(ev.priority) }}
      />
      <span className="truncate text-sm">{ev.title}</span>
    </button>
  );

  const renderDayCell = (day: Date | null, key: string) => {
    if (!day) {
      return (
        <div key={key} className={`${cellMinHeightClass} rounded border bg-muted/20 p-2`} aria-hidden="true" />
      );
    }

    const dayEvents = eventsByDate.get(getLocalDateKey(day)) ?? [];
    const visibleEvents = calendarMode === 'day' ? dayEvents : dayEvents.slice(0, 3);
    const overflowCount = calendarMode === 'day' ? 0 : Math.max(0, dayEvents.length - 3);

    return (
      <div key={key} className={`${cellMinHeightClass} rounded border bg-white p-2`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            {calendarMode !== 'month' ? (
              <div className="text-xs text-muted-foreground">{day.toLocaleDateString(language === 'bs' ? 'bs-BA' : 'en-GB', { weekday: 'short' })}</div>
            ) : null}
            <div className="text-sm font-medium">{day.getDate()}</div>
          </div>
        </div>

        <div className="mt-2 space-y-1">
          {visibleEvents.map(renderEventButton)}

          {overflowCount > 0 ? (
            <div className="text-xs text-muted-foreground">
              +{overflowCount} {language === 'bs' ? 'više' : 'more'}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="text-lg font-medium">{label}</div>
            <div className="flex flex-wrap gap-2">
              {CALENDAR_MODES.map((mode) => (
                <Button
                  key={mode.value}
                  type="button"
                  size="sm"
                  variant={calendarMode === mode.value ? 'default' : 'outline'}
                  aria-pressed={calendarMode === mode.value}
                  onClick={() => setCalendarMode(mode.value)}
                >
                  {getCalendarModeLabel(mode.value, language)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => navigate(-1)}>
              {language === 'bs' ? 'Prethodno' : 'Prev'}
            </Button>
            <Button variant="outline" size="sm" type="button" onClick={() => navigate(1)}>
              {language === 'bs' ? 'Sljedeće' : 'Next'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {calendarMode !== 'day' ? (
          <div className="mb-2 grid grid-cols-7 gap-1 text-xs text-muted-foreground">
            {WEEKDAY_LABELS[language].map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>
        ) : null}

        <div className={`grid ${gridColumnsClass} gap-2`}>
          {calendarRows.map((row, rowIndex) =>
            row.map((day, columnIndex) =>
              renderDayCell(
                day,
                day ? getLocalDateKey(day) : `empty-${rowIndex}-${columnIndex}`,
              ),
            ),
          )}
        </div>
      </CardContent>
    </Card>
  );
}
