import { describe, it, expect } from "vitest";
import { sequence } from "./sequencer";
import type { Item } from "./types";

const makeItem = (overrides: Partial<Item> & { id: string; name: string }): Item => ({
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

describe("sequence", () => {
  it("returns empty array for no items", () => {
    expect(sequence([])).toEqual([]);
  });

  it("produces one step per item", () => {
    const items = [
      makeItem({ id: "a", name: "A", totalMinutes: 20, handsonMinutes: 10 }),
      makeItem({ id: "b", name: "B", totalMinutes: 10, handsonMinutes: 5 }),
    ];
    expect(sequence(items)).toHaveLength(2);
  });

  it("schedules longest item first", () => {
    const items = [
      makeItem({ id: "short", name: "Short", totalMinutes: 10, handsonMinutes: 5 }),
      makeItem({ id: "long", name: "Long", totalMinutes: 60, handsonMinutes: 15 }),
    ];
    const steps = sequence(items);
    expect(steps[0].items).toContain("long");
    expect(steps[1].items).toContain("short");
  });

  it("assigns sequential order numbers starting at 1", () => {
    const items = [
      makeItem({ id: "a", name: "A" }),
      makeItem({ id: "b", name: "B" }),
      makeItem({ id: "c", name: "C" }),
    ];
    const orders = sequence(items).map((s) => s.order);
    expect(orders).toEqual([1, 2, 3]);
  });

  it("includes storage badge when item has storage", () => {
    const item = makeItem({ id: "a", name: "A", storage: ["fridge", "freezer"] });
    const steps = sequence([item]);
    expect(steps[0].storageBadge).toBe("Store in fridge or freezer");
  });

  it("omits storage badge when storage is empty", () => {
    const item = makeItem({ id: "a", name: "A", storage: [] });
    const steps = sequence([item]);
    expect(steps[0].storageBadge).toBeUndefined();
  });

  it("includes equipment note when item uses equipment", () => {
    const item = makeItem({ id: "a", name: "A", equipment: ["oven", "stovetop"] });
    const steps = sequence([item]);
    expect(steps[0].note).toContain("oven");
  });

  it("sets durationMinutes to handsonMinutes", () => {
    const item = makeItem({ id: "a", name: "A", handsonMinutes: 17, totalMinutes: 45 });
    expect(sequence([item])[0].durationMinutes).toBe(17);
  });

  it("separates items with conflicting oven temperatures", () => {
    const items = [
      makeItem({ id: "hi", name: "Hi-Temp", equipment: ["oven"], ovenTemp: 425, totalMinutes: 40, handsonMinutes: 10 }),
      makeItem({ id: "lo", name: "Lo-Temp", equipment: ["oven"], ovenTemp: 350, totalMinutes: 30, handsonMinutes: 10 }),
    ];
    // Both should get scheduled (2 steps), not merged
    expect(sequence(items)).toHaveLength(2);
  });

  it("does not conflict when oven temps are within 25°F", () => {
    const items = [
      makeItem({ id: "a", name: "A", equipment: ["oven"], ovenTemp: 400, totalMinutes: 40, handsonMinutes: 10 }),
      makeItem({ id: "b", name: "B", equipment: ["oven"], ovenTemp: 415, totalMinutes: 30, handsonMinutes: 10 }),
    ];
    expect(sequence(items)).toHaveLength(2);
  });
});
