import { describe, expect, test } from 'vitest';

import { createReportSchema, updateReportSchema } from '../src/modules/reports/reports.schema';
import { REPORT_FIELD_MAX_LENGTH } from '../src/services/reports.service';

describe('createReportSchema', () => {
  test('accepts a valid payload with all fields', () => {
    const result = createReportSchema.safeParse({
      description: 'Replaced the faulty pump.',
      material: 'Pump, gaskets',
      notes: 'Follow-up in 30 days.',
    });
    expect(result.success).toBe(true);
  });

  test('accepts a payload with only the required description field', () => {
    const result = createReportSchema.safeParse({
      description: 'Replaced the faulty pump.',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.material).toBeNull();
      expect(result.data.notes).toBeNull();
    }
  });

  test('trims whitespace from all text fields', () => {
    const result = createReportSchema.safeParse({
      description: '  Work done.  ',
      material: '  Parts  ',
      notes: '  Note  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Work done.');
      expect(result.data.material).toBe('Parts');
      expect(result.data.notes).toBe('Note');
    }
  });

  test('rejects an empty description', () => {
    const result = createReportSchema.safeParse({ description: '' });
    expect(result.success).toBe(false);
  });

  test('rejects a description that is whitespace only', () => {
    const result = createReportSchema.safeParse({ description: '   ' });
    expect(result.success).toBe(false);
  });

  test('rejects when description is missing', () => {
    const result = createReportSchema.safeParse({ material: 'Some parts' });
    expect(result.success).toBe(false);
  });

  test('rejects description exceeding the maximum length', () => {
    const result = createReportSchema.safeParse({
      description: 'a'.repeat(REPORT_FIELD_MAX_LENGTH.DESCRIPTION + 1),
    });
    expect(result.success).toBe(false);
  });

  test('accepts description at exactly the maximum length', () => {
    const result = createReportSchema.safeParse({
      description: 'a'.repeat(REPORT_FIELD_MAX_LENGTH.DESCRIPTION),
    });
    expect(result.success).toBe(true);
  });

  test('rejects material exceeding the maximum length', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      material: 'a'.repeat(REPORT_FIELD_MAX_LENGTH.MATERIAL + 1),
    });
    expect(result.success).toBe(false);
  });

  test('rejects notes exceeding the maximum length', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      notes: 'a'.repeat(REPORT_FIELD_MAX_LENGTH.NOTES + 1),
    });
    expect(result.success).toBe(false);
  });

  test('transforms undefined optional fields to null', () => {
    const result = createReportSchema.safeParse({ description: 'Work done.' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.material).toBeNull();
      expect(result.data.notes).toBeNull();
    }
  });
});

describe('updateReportSchema', () => {
  test('accepts a payload with only description', () => {
    const result = updateReportSchema.safeParse({ description: 'Updated work.' });
    expect(result.success).toBe(true);
  });

  test('accepts a payload with only material', () => {
    const result = updateReportSchema.safeParse({ material: 'New material.' });
    expect(result.success).toBe(true);
  });

  test('accepts a payload with only notes', () => {
    const result = updateReportSchema.safeParse({ notes: 'Follow-up note.' });
    expect(result.success).toBe(true);
  });

  test('accepts a full update payload', () => {
    const result = updateReportSchema.safeParse({
      description: 'Updated work.',
      material: 'Parts A, B',
      notes: 'Note here.',
    });
    expect(result.success).toBe(true);
  });

  test('rejects an empty payload (no fields at all)', () => {
    const result = updateReportSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test('rejects an empty description string', () => {
    const result = updateReportSchema.safeParse({ description: '' });
    expect(result.success).toBe(false);
  });

  test('accepts null for material to clear the field', () => {
    const result = updateReportSchema.safeParse({
      description: 'Done.',
      material: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.material).toBeNull();
    }
  });

  test('accepts null for notes to clear the field', () => {
    const result = updateReportSchema.safeParse({ notes: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeNull();
    }
  });

  test('rejects description exceeding the maximum length', () => {
    const result = updateReportSchema.safeParse({
      description: 'a'.repeat(REPORT_FIELD_MAX_LENGTH.DESCRIPTION + 1),
    });
    expect(result.success).toBe(false);
  });

  test('trims whitespace from description', () => {
    const result = updateReportSchema.safeParse({ description: '  Updated.  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Updated.');
    }
  });
});