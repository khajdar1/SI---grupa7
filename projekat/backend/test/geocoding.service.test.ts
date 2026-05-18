import { describe, expect, it } from 'vitest';

import { compactStoredLocation, formatPersistableLocation } from '../src/services/geocoding.service';

describe('geocoding location formatting', () => {
  it('stores compact address, canton, municipality, and country instead of the full provider label', () => {
    const formatted = formatPersistableLocation(
      'Ferhadija 12, MZ Bascarsija, Stari Grad, Sarajevo Canton, Federation of Bosnia and Herzegovina, Bosnia and Herzegovina, 71000',
      {
        road: 'Ferhadija',
        house_number: '12',
        state: 'Sarajevo Canton',
        municipality: 'Stari Grad',
        country: 'Bosnia and Herzegovina',
        postcode: '71000',
      },
    );

    expect(formatted).toBe('Ferhadija 12, Sarajevo Canton, Stari Grad, Bosnia and Herzegovina');
    expect(formatted).not.toContain('Federation of Bosnia and Herzegovina');
    expect(formatted).not.toContain('71000');
  });

  it('caps fallback location labels at database-safe length', () => {
    const formatted = formatPersistableLocation('A'.repeat(700), undefined);

    expect(formatted.length).toBeLessThanOrEqual(500);
  });

  it('compacts old stored Nominatim labels before export and API responses', () => {
    const formatted = compactStoredLocation(
      'SCC, Kotromani\u00c4\u0087eva Sarajevo, Mjesna zajednica Marijin Dvor, Op\u00c4\u0087ina Centar, Grad Sarajevo, Kanton Sarajevo, Federacija Bosne i Hercegovine, 71144, Bosna i Hercegovina / noisy alternate name',
    );

    expect(formatted).toBe('SCC, Kotromani\u0107eva Sarajevo, Kanton Sarajevo, Centar, Bosna i Hercegovina');
    expect(formatted).not.toContain('Mjesna zajednica');
    expect(formatted).not.toContain('71144');
    expect(formatted).not.toContain('/');
  });
});
