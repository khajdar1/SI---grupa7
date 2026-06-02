
export interface MaterialItem {
  name: string;
  quantity: number;
  note: string | null;
}

export const MATERIAL_ITEM_LIMITS = {
  NAME_MAX: 200,
  NOTE_MAX: 500,
  ITEMS_MAX: 50,
} as const;

function isMaterialItem(value: unknown): value is MaterialItem {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === 'string' &&
    v.name.trim().length > 0 &&
    typeof v.quantity === 'number' &&
    Number.isFinite(v.quantity) &&
    v.quantity > 0
  );
}

export function parseMaterialItems(material: string | null): MaterialItem[] {
  if (!material || !material.trim()) return [];

  try {
    const parsed: unknown = JSON.parse(material);
    if (Array.isArray(parsed)) {
      return parsed.filter(isMaterialItem);
    }
  } catch {
    const trimmed = material.trim();
    if (trimmed) {
      return [{ name: trimmed.toLowerCase(), quantity: 1, note: null }];
    }
  }

  return [];
}

export function serializeMaterialItems(items: MaterialItem[]): string | null {
  if (!items.length) return null;
  return JSON.stringify(items);
}

export function formatMaterialItems(material: string | null): string | null {
  if (!material?.trim()) return null;

  let parsedItems: MaterialItem[] = [];

  try {
    const parsed: unknown = JSON.parse(material);
    if (Array.isArray(parsed)) {
      parsedItems = parsed.filter(isMaterialItem);
    }
  } catch {
    return material.trim();
  }

  if (!parsedItems.length) {
    return material.trim();
  }

  return parsedItems
    .map((item) => {
      const base = `${item.name} (x${item.quantity})`;
      return item.note ? `${base} - ${item.note}` : base;
    })
    .join(', ');
}
