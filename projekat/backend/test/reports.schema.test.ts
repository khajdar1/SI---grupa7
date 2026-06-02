import { describe, expect, test } from 'vitest';

import { createReportSchema, updateReportSchema } from '../src/modules/reports/reports.schema';
import { REPORT_FIELD_MAX_LENGTH } from '../src/services/reports.service';
import { MATERIAL_ITEM_LIMITS } from '../src/shared/material-item';

describe('createReportSchema', () => {
  test('accepts a valid payload with all fields', () => {
    const result = createReportSchema.safeParse({
      description: 'Replaced the faulty pump.',
      materialItems: [{ name: 'pump', quantity: 1 }],
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
      expect(result.data.materialItems).toEqual([]);
      expect(result.data.notes).toBeNull();
    }
  });

  test('trims whitespace from all text fields', () => {
    const result = createReportSchema.safeParse({
      description: '  Work done.  ',
      materialItems: [{ name: '  Pump  ', quantity: 1 }],
      notes: '  Note  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Work done.');
      expect(result.data.materialItems[0].name).toBe('pump');
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
    const result = createReportSchema.safeParse({ materialItems: [{ name: 'pump', quantity: 1 }] });
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
      expect(result.data.materialItems).toEqual([]);
      expect(result.data.notes).toBeNull();
    }
  });
});

describe('updateReportSchema', () => {
  test('accepts a payload with only description', () => {
    const result = updateReportSchema.safeParse({ description: 'Updated work.' });
    expect(result.success).toBe(true);
  });

  test('accepts a payload with only materialItems', () => {
    const result = updateReportSchema.safeParse({
      materialItems: [{ name: 'Gasket', quantity: 2 }],
    });
    expect(result.success).toBe(true);
  });

  test('accepts a payload with only notes', () => {
    const result = updateReportSchema.safeParse({ notes: 'Follow-up note.' });
    expect(result.success).toBe(true);
  });

  test('accepts a full update payload', () => {
    const result = updateReportSchema.safeParse({
      description: 'Updated work.',
      materialItems: [{ name: 'Parts A', quantity: 1 }],
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

  test('accepts empty materialItems array to clear the field', () => {
    const result = updateReportSchema.safeParse({ materialItems: [] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.materialItems).toEqual([]);
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

describe('createReportSchema – materialItems (PBI-056)', () => {
  test('defaults materialItems to empty array when omitted', () => {
    const result = createReportSchema.safeParse({ description: 'Work done.' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.materialItems).toEqual([]);
    }
  });

  test('accepts a valid single material item', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [{ name: 'Pump', quantity: 2 }],
    });
    expect(result.success).toBe(true);
  });

  test('accepts multiple material items', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [
        { name: 'Pump', quantity: 1 },
        { name: 'Gasket', quantity: 4 },
        { name: 'Bolt', quantity: 8 },
      ],
    });
    expect(result.success).toBe(true);
  });

  test('accepts an explicit empty materialItems array', () => {
    const result = createReportSchema.safeParse({ description: 'Work done.', materialItems: [] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.materialItems).toEqual([]);
    }
  });

  test('rejects a material item with an empty name', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [{ name: '', quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });

  test('rejects a material item with whitespace-only name', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [{ name: '   ', quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });

  test('rejects a material item with zero quantity', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [{ name: 'Pump', quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  test('rejects a material item with negative quantity', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [{ name: 'Pump', quantity: -1 }],
    });
    expect(result.success).toBe(false);
  });

  test('rejects a material item with non-numeric quantity', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [{ name: 'Pump', quantity: 'mnogo' as unknown as number }],
    });
    expect(result.success).toBe(false);
  });

  test('rejects Infinity as quantity', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [{ name: 'Oil', quantity: Infinity }],
    });
    expect(result.success).toBe(false);
  });

  test('accepts a fractional (decimal) quantity', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [{ name: 'Oil', quantity: 0.5 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.materialItems[0].quantity).toBe(0.5);
    }
  });

  test('lowercases material item name', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [{ name: 'PUMP', quantity: 1 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.materialItems[0].name).toBe('pump');
    }
  });

  test('trims whitespace from material item name', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [{ name: '  Pump  ', quantity: 1 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.materialItems[0].name).toBe('pump');
    }
  });

  test('transforms omitted note to null', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [{ name: 'Pump', quantity: 1 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.materialItems[0].note).toBeNull();
    }
  });

  test('transforms empty string note to null', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [{ name: 'Pump', quantity: 1, note: '' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.materialItems[0].note).toBeNull();
    }
  });

  test('accepts a material item with an optional note', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [{ name: 'Pump', quantity: 1, note: 'Used on left side.' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.materialItems[0].note).toBe('Used on left side.');
    }
  });

  test('rejects a material name exceeding the maximum length', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [{ name: 'a'.repeat(MATERIAL_ITEM_LIMITS.NAME_MAX + 1), quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });

  test('accepts a material name at exactly the maximum length', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [{ name: 'a'.repeat(MATERIAL_ITEM_LIMITS.NAME_MAX), quantity: 1 }],
    });
    expect(result.success).toBe(true);
  });

  test('rejects a note exceeding the maximum length', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: [{ name: 'Pump', quantity: 1, note: 'a'.repeat(MATERIAL_ITEM_LIMITS.NOTE_MAX + 1) }],
    });
    expect(result.success).toBe(false);
  });

  test('rejects materialItems array exceeding the maximum item count', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: Array.from({ length: MATERIAL_ITEM_LIMITS.ITEMS_MAX + 1 }, (_, i) => ({
        name: `item-${i}`,
        quantity: 1,
      })),
    });
    expect(result.success).toBe(false);
  });

  test('accepts materialItems array at exactly the maximum item count', () => {
    const result = createReportSchema.safeParse({
      description: 'Work done.',
      materialItems: Array.from({ length: MATERIAL_ITEM_LIMITS.ITEMS_MAX }, (_, i) => ({
        name: `item-${i}`,
        quantity: 1,
      })),
    });
    expect(result.success).toBe(true);
  });
});

describe('updateReportSchema – materialItems (PBI-056)', () => {
  test('accepts a payload with only materialItems', () => {
    const result = updateReportSchema.safeParse({
      materialItems: [{ name: 'Gasket', quantity: 2 }],
    });
    expect(result.success).toBe(true);
  });

  test('accepts an empty materialItems array to clear materials', () => {
    const result = updateReportSchema.safeParse({ materialItems: [] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.materialItems).toEqual([]);
    }
  });

  test('rejects a material item with zero quantity on update', () => {
    const result = updateReportSchema.safeParse({
      materialItems: [{ name: 'Pump', quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  test('rejects a material item with negative quantity on update', () => {
    const result = updateReportSchema.safeParse({
      materialItems: [{ name: 'Pump', quantity: -5 }],
    });
    expect(result.success).toBe(false);
  });

  test('accepts a full update payload with description, materialItems and notes', () => {
    const result = updateReportSchema.safeParse({
      description: 'Updated work.',
      materialItems: [{ name: 'Valve', quantity: 3, note: 'Replaced old one.' }],
      notes: 'Follow-up needed.',
    });
    expect(result.success).toBe(true);
  });
});