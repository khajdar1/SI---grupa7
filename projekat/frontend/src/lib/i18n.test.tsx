import { describe, expect, test } from 'vitest';

import { DEFAULT_LANGUAGE, translateForTest } from './i18n';

describe('i18n translations', () => {
  test('translates supported Bosnian UI labels', () => {
    expect(translateForTest('bs', 'profile.language')).toBe('Jezik interfejsa');
    expect(translateForTest('bs', 'nav.notifications')).toBe('Obavještenja');
    expect(translateForTest('bs', 'dashboard.support.title')).toBe('Kontrolna ploča podrške');
    expect(translateForTest('bs', 'dashboard.stat.supportTickets')).toBe('Tiketi podrške');
    expect(translateForTest('bs', 'priority.high')).toBe('Visok');
    expect(translateForTest('bs', 'interventionStatus.new')).toBe('Novo');
    expect(translateForTest('bs', 'faultReports.openIntervention')).toBe('Otvori intervenciju');
    expect(translateForTest('bs', 'tickets.requestAdminReview')).toBe('Zatraži admin pregled');
    expect(translateForTest('bs', 'nav.blockedUsers')).toBe('Blokirani korisnici');
  });

  test('keeps English as fallback language', () => {
    expect(DEFAULT_LANGUAGE).toBe('en');
    expect(translateForTest('en', 'profile.saveChanges')).toBe('Save Changes');
    expect(translateForTest('en', 'nav.blockedUsers')).toBe('Blocked Users');
  });
});
