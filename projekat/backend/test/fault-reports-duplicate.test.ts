import { describe, it, expect } from 'vitest';
import {
  computeTextSimilarity,
  haversineKm,
  computeLocationSimilarity,
  DUPLICATE_SIMILARITY_THRESHOLD,
  DUPLICATE_LOCATION_RADIUS_KM,
} from '../src/modules/fault-reports/fault-reports.service';

// PBI-025: Unit testovi za logiku detekcije duplikata prijave kvara

describe('computeTextSimilarity', () => {
  it('vraća 1 za identične stringove', () => {
    expect(computeTextSimilarity('kvar na osvjetljenju', 'kvar na osvjetljenju')).toBe(1);
  });

  it('vraća 0 za potpuno različite stringove', () => {
    const score = computeTextSimilarity('kvar osvjetljenje ulaz', 'poplavljena kuhinja voda');
    expect(score).toBe(0);
  });

  it('vraća srednju vrijednost za djelimično slične opise', () => {
    const score = computeTextSimilarity(
      'kvar na ulaznom osvjetljenju prizemlje',
      'kvar osvjetljenje ulaz zgrada',
    );
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('ignoriše kratke riječi (< 3 slova)', () => {
    // "na" i "u" su kratki i ne smiju uticati na score
    const score = computeTextSimilarity('kvar na ulazu', 'kvar u hodniku');
    expect(score).toBeGreaterThan(0); // "kvar" je zajednički
  });

  it('ignoriše razliku u velikim/malim slovima', () => {
    const score = computeTextSimilarity('KVAR NA ULAZU', 'kvar na ulazu');
    expect(score).toBe(1);
  });

  it('vraća 0 za prazne stringove s nepraznim', () => {
    expect(computeTextSimilarity('', 'kvar')).toBe(0);
    expect(computeTextSimilarity('kvar', '')).toBe(0);
  });

  it('vraća 1 za dva prazna stringa', () => {
    expect(computeTextSimilarity('', '')).toBe(1);
  });
});

describe('haversineKm', () => {
  it('vraća 0 za istu točku', () => {
    expect(haversineKm(43.8563, 18.4131, 43.8563, 18.4131)).toBeCloseTo(0, 5);
  });

  it('ispravno računa udaljenost između dvije tačke u Sarajevu (~2 km)', () => {
    // Baščaršija ≈ Vijećnica
    const dist = haversineKm(43.8584, 18.4312, 43.8486, 18.4131);
    expect(dist).toBeGreaterThan(1.5);
    expect(dist).toBeLessThan(3);
  });

  it('udaljenost je simetrična (AB = BA)', () => {
    const ab = haversineKm(43.8, 18.4, 44.0, 18.5);
    const ba = haversineKm(44.0, 18.5, 43.8, 18.4);
    expect(ab).toBeCloseTo(ba, 10);
  });
});

describe('computeLocationSimilarity (GPS)', () => {
  it('vraća 1 za koordinate unutar dozvoljenog radijusa', () => {
    // razlika ~0.001° ≈ ~100m
    const score = computeLocationSimilarity(
      'lokacija A', 43.8563, 18.4131,
      'lokacija B', 43.8570, 18.4140,
    );
    expect(score).toBe(1);
  });

  it('vraća 0 za koordinate izvan radijusa', () => {
    // Sarajevo vs Mostar (~120 km)
    const score = computeLocationSimilarity(
      'Sarajevo', 43.8563, 18.4131,
      'Mostar', 43.3438, 17.8078,
    );
    expect(score).toBe(0);
  });

  it('vraća tekstualnu sličnost ako nema GPS koordinata', () => {
    const score = computeLocationSimilarity(
      'Glavni ulaz objekat A', null, null,
      'Glavni ulaz objekat A', null, null,
    );
    expect(score).toBe(1);
  });

  it('koristi GPS kad je dostupan, ne tekst', () => {
    // Različiti opisi lokacije ali iste koordinate → visoka sličnost
    const scoreGps = computeLocationSimilarity(
      'potpuno drugačiji opis', 43.8563, 18.4131,
      'nešto sasvim drukčije', 43.8565, 18.4132,
    );
    expect(scoreGps).toBe(1);
  });
});

describe('DUPLICATE_SIMILARITY_THRESHOLD', () => {
  it('prag je između 0 i 1', () => {
    expect(DUPLICATE_SIMILARITY_THRESHOLD).toBeGreaterThan(0);
    expect(DUPLICATE_SIMILARITY_THRESHOLD).toBeLessThan(1);
  });
});

describe('DUPLICATE_LOCATION_RADIUS_KM', () => {
  it('radijus je pozitivan broj', () => {
    expect(DUPLICATE_LOCATION_RADIUS_KM).toBeGreaterThan(0);
  });
});
