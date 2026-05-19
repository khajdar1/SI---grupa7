import { describe, expect, it } from 'vitest';

import { generateInterventionsPdf, sanitizePdfText } from '../src/shared/pdf.service';

describe('PDF text normalization', () => {
  it('repairs mojibake latin characters before writing export text', () => {
    expect(sanitizePdfText('Tehni\u00c4\u008dko pitanje')).toBe('Tehni\u010dko pitanje');
    expect(sanitizePdfText('Prijava gre\u00c5\u00a1ke u aplikaciji')).toBe('Prijava gre\u0161ke u aplikaciji');
  });

  it('keeps already valid latin characters unchanged', () => {
    expect(sanitizePdfText('\u010ci\u0161\u0107enje \u0161ahta')).toBe('\u010ci\u0161\u0107enje \u0161ahta');
    expect(sanitizePdfText('Odr\u017eavanje ure\u0111aja u \u010celi\u0107u')).toBe('Odr\u017eavanje ure\u0111aja u \u010celi\u0107u');
  });

  it('generates a PDF with bundled latin extended characters', async () => {
    const pdf = await generateInterventionsPdf([
      {
        name: '\u010ci\u0161\u0107enje ure\u0111aja',
        priority: 'HIGH',
        status: 'ASSIGNED',
        location: '\u0160aht kod \u0161kole, \u010celi\u0107',
        servicers: 'D\u017eenan \u0110uri\u0107',
        createdAt: new Date().toISOString(),
        startedAt: null,
        dueAt: new Date().toISOString(),
      },
    ]);

    expect(pdf.subarray(0, 5).toString('utf8')).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(1000);
  });
});
