import { describe, it, expect } from "vitest";
import { sequence } from "./sequencer";
import type { Item } from "./types";

const makeItem = (overrides: Partial<Item> & { id: string; name: string }): Item => ({
  category: "protein",
  handsonMinutes: 10,
  totalMinutes: 10,
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

  it("generates at least one step per item", () => {
    const items = [
      makeItem({ id: "a", name: "A" }),
      makeItem({ id: "b", name: "B" }),
    ];
    const steps = sequence(items);
    const ids = steps.flatMap((s) => s.items);
    expect(ids).toContain("a");
    expect(ids).toContain("b");
  });

  it("first step is for the longest item", () => {
    const items = [
      makeItem({ id: "short", name: "Short", totalMinutes: 10, handsonMinutes: 10 }),
      makeItem({ id: "long", name: "Long", totalMinutes: 60, handsonMinutes: 15 }),
    ];
    expect(sequence(items)[0].items).toContain("long");
  });

  it("order numbers are sequential starting at 1", () => {
    const items = [
      makeItem({ id: "a", name: "A" }),
      makeItem({ id: "b", name: "B" }),
    ];
    const orders = sequence(items).map((s) => s.order);
    orders.forEach((n, i) => expect(n).toBe(i + 1));
  });

  it("sets recipeName on every step", () => {
    const items = [
      makeItem({ id: "a", name: "Alpha" }),
      makeItem({ id: "b", name: "Beta" }),
    ];
    const steps = sequence(items);
    for (const step of steps) {
      expect(step.recipeName).toBeDefined();
    }
  });

  it("storage badge appears in a step for items with storage", () => {
    const item = makeItem({ id: "a", name: "A", storage: ["fridge", "freezer"] });
    const steps = sequence([item]);
    const storageStep = steps.find((s) => s.storageBadge);
    expect(storageStep?.storageBadge).toBe("Store in fridge or freezer");
  });

  it("generates a passive timer step for items with passive time", () => {
    const item = makeItem({
      id: "a",
      name: "Roast",
      handsonMinutes: 10,
      totalMinutes: 50,
      equipment: ["oven"],
      ovenTemp: 400,
    });
    const steps = sequence([item]);
    const timerStep = steps.find((s) => s.note?.includes("Set timer"));
    expect(timerStep).toBeDefined();
  });

  it("interleaves a shorter item during a longer item's passive window", () => {
    const items = [
      makeItem({ id: "long", name: "Long", handsonMinutes: 10, totalMinutes: 60, equipment: ["oven"], ovenTemp: 400 }),
      makeItem({ id: "short", name: "Short", handsonMinutes: 15, totalMinutes: 15 }),
    ];
    const steps = sequence(items);
    const longIdx = steps.findIndex((s) => s.items.includes("long"));
    const shortIdx = steps.findIndex((s) => s.items.includes("short"));
    // Short item should be scheduled before Long item finishes
    expect(shortIdx).toBeGreaterThan(longIdx);
    // Short item should appear before Long item's final store step
    const longFinalIdx = steps.map((s, i) => ({ s, i }))
      .filter(({ s }) => s.items.includes("long"))
      .at(-1)!.i;
    expect(shortIdx).toBeLessThan(longFinalIdx);
  });

  it("includes equipment note on prep step when item uses equipment", () => {
    const item = makeItem({ id: "a", name: "A", equipment: ["oven", "stovetop"] });
    const steps = sequence([item]);
    const prepStep = steps.find((s) => s.items.includes("a") && s.durationMinutes > 0);
    expect(prepStep?.note).toContain("oven");
  });

  it("schedules both oven-conflict items (just not simultaneously)", () => {
    const items = [
      makeItem({ id: "hi", name: "Hi-Temp", equipment: ["oven"], ovenTemp: 425, totalMinutes: 40, handsonMinutes: 10 }),
      makeItem({ id: "lo", name: "Lo-Temp", equipment: ["oven"], ovenTemp: 350, totalMinutes: 30, handsonMinutes: 10 }),
    ];
    const steps = sequence(items);
    const ids = steps.flatMap((s) => s.items);
    expect(ids).toContain("hi");
    expect(ids).toContain("lo");
  });

  it("schedules both items when oven temps are within 25°F", () => {
    const items = [
      makeItem({ id: "a", name: "A", equipment: ["oven"], ovenTemp: 400, totalMinutes: 40, handsonMinutes: 10 }),
      makeItem({ id: "b", name: "B", equipment: ["oven"], ovenTemp: 415, totalMinutes: 30, handsonMinutes: 10 }),
    ];
    const ids = sequence(items).flatMap((s) => s.items);
    expect(ids).toContain("a");
    expect(ids).toContain("b");
  });

  it("interleaves two all-hands-on items instead of doing them sequentially", () => {
    const items = [
      makeItem({ id: "alpha", name: "Alpha", handsonMinutes: 20, totalMinutes: 20 }),
      makeItem({ id: "beta", name: "Beta", handsonMinutes: 15, totalMinutes: 15 }),
    ];
    const steps = sequence(items);
    // Both items must appear in the steps
    const alphaSteps = steps.filter((s) => s.items.includes("alpha"));
    const betaSteps = steps.filter((s) => s.items.includes("beta"));
    expect(alphaSteps.length).toBeGreaterThan(0);
    expect(betaSteps.length).toBeGreaterThan(0);

    // At least one Beta step must appear before Alpha's final step (interleaving)
    const alphaFinalIdx = steps.map((s, i) => ({ s, i }))
      .filter(({ s }) => s.items.includes("alpha"))
      .at(-1)!.i;
    const firstBetaIdx = steps.findIndex((s) => s.items.includes("beta"));
    expect(firstBetaIdx).toBeLessThan(alphaFinalIdx);
  });
});
