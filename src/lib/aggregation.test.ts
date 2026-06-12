import { describe, it, expect } from "vitest";
import { aggregateIngredients } from "./aggregation";
import type { Item } from "./types";

const makeItem = (overrides: Partial<Item> = {}): Item => ({
  id: "item-1",
  name: "Test Item",
  category: "protein",
  handsonMinutes: 10,
  totalMinutes: 30,
  equipment: [],
  ovenTemp: null,
  storage: ["fridge"],
  isPantryHeavy: false,
  imageAlt: "test",
  ingredients: [],
  ...overrides,
});

describe("aggregateIngredients", () => {
  it("returns empty buy and pantry for no items", () => {
    expect(aggregateIngredients([])).toEqual({ buy: [], pantry: [] });
  });

  it("splits pantry staples from buy list", () => {
    const item = makeItem({
      ingredients: [
        { name: "chicken", quantity: 500, unit: "g", isPantryStaple: false },
        { name: "olive oil", quantity: 2, unit: "tbsp", isPantryStaple: true },
      ],
    });
    const result = aggregateIngredients([item]);
    expect(result.buy).toHaveLength(1);
    expect(result.buy[0].name).toBe("chicken");
    expect(result.pantry).toHaveLength(1);
    expect(result.pantry[0].name).toBe("olive oil");
  });

  it("sums identical name+unit pairs across items", () => {
    const item1 = makeItem({
      id: "a",
      ingredients: [{ name: "rice", quantity: 100, unit: "g", isPantryStaple: false }],
    });
    const item2 = makeItem({
      id: "b",
      ingredients: [{ name: "rice", quantity: 200, unit: "g", isPantryStaple: false }],
    });
    const result = aggregateIngredients([item1, item2]);
    expect(result.buy).toHaveLength(1);
    expect(result.buy[0].quantity).toBe(300);
  });

  it("treats same name with different units as separate entries", () => {
    const item = makeItem({
      ingredients: [
        { name: "milk", quantity: 1, unit: "cup", isPantryStaple: false },
        { name: "milk", quantity: 200, unit: "ml", isPantryStaple: false },
      ],
    });
    expect(aggregateIngredients([item]).buy).toHaveLength(2);
  });

  it("returns buy list sorted alphabetically by name", () => {
    const item = makeItem({
      ingredients: [
        { name: "zucchini", quantity: 1, unit: "whole", isPantryStaple: false },
        { name: "apple", quantity: 2, unit: "whole", isPantryStaple: false },
      ],
    });
    const names = aggregateIngredients([item]).buy.map((i) => i.name);
    expect(names).toEqual(["apple", "zucchini"]);
  });

  it("avoids floating-point drift when summing quantities", () => {
    const item1 = makeItem({
      id: "a",
      ingredients: [{ name: "flour", quantity: 0.1, unit: "cup", isPantryStaple: false }],
    });
    const item2 = makeItem({
      id: "b",
      ingredients: [{ name: "flour", quantity: 0.2, unit: "cup", isPantryStaple: false }],
    });
    const result = aggregateIngredients([item1, item2]);
    expect(result.buy[0].quantity).toBe(0.3);
  });
});
