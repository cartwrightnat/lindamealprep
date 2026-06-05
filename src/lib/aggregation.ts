import type { Item } from "./types";

export interface AggregatedIngredient {
  name: string;
  quantity: number;
  unit: string;
  isPantryStaple: boolean;
}

export function aggregateIngredients(items: Item[]): {
  buy: AggregatedIngredient[];
  pantry: AggregatedIngredient[];
} {
  const map = new Map<string, AggregatedIngredient>();

  for (const item of items) {
    for (const ing of item.ingredients) {
      const key = `${ing.name}||${ing.unit}`;
      const existing = map.get(key);
      if (existing) {
        existing.quantity = Math.round((existing.quantity + ing.quantity) * 1000) / 1000;
      } else {
        map.set(key, {
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          isPantryStaple: ing.isPantryStaple,
        });
      }
    }
  }

  const all = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  return {
    buy: all.filter((i) => !i.isPantryStaple),
    pantry: all.filter((i) => i.isPantryStaple),
  };
}
