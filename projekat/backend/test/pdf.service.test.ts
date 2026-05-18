import { describe, expect, it } from 'vitest';

import { sanitizePdfText } from '../src/shared/pdf.service';

describe('PDF text normalization', () => {
  it('repairs mojibake latin characters before writing export text', () => {
    expect(sanitizePdfText('Tehni\u00c4\u008dko pitanje')).toBe('Tehni\u010dko pitanje');
    expect(sanitizePdfText('Prijava gre\u00c5\u00a1ke u aplikaciji')).toBe('Prijava gre\u0161ke u aplikaciji');
  });

  it('keeps already valid latin characters unchanged', () => {
    expect(sanitizePdfText('\u010ci\u0161\u0107enje \u0161ahta')).toBe('\u010ci\u0161\u0107enje \u0161ahta');
  });
});
