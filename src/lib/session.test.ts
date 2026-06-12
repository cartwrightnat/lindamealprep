import { describe, it, expect, beforeEach } from "vitest";
import { calculateSessionEstimate, saveSession, loadSession, saveLastPrep, loadLastPrep } from "./session";
import type { Item } from "./types";

const makeItem = (overrides: Partial<Item> & { id: string }): Item => ({
  name: "Test",
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

beforeEach(() => {
  localStorage.clear();
});

// ── calculateSessionEstimate ──────────────────────────────────────────────────

describe("calculateSessionEstimate", () => {
  it("returns 0 for empty list", () => {
    expect(calculateSessionEstimate([])).toBe(0);
  });

  it("returns totalMinutes for a single item", () => {
    const item = makeItem({ id: "a", handsonMinutes: 15, totalMinutes: 60 });
    expect(calculateSessionEstimate([item])).toBe(60);
  });

  it("overlaps passive time with other items' hands-on time", () => {
    // Longest: 60 total, 20 hands-on → 40 min passive window
    // Other: 10 hands-on — fits inside passive window (10 < 40)
    // Expected: 60 + max(0, 10 - 40) = 60
    const longest = makeItem({ id: "a", handsonMinutes: 20, totalMinutes: 60 });
    const other = makeItem({ id: "b", handsonMinutes: 10, totalMinutes: 15 });
    expect(calculateSessionEstimate([longest, other])).toBe(60);
  });

  it("adds overflow when other hands-on exceeds passive window", () => {
    // Longest: 60 total, 10 hands-on → 50 min passive
    // Others: 30 + 30 = 60 hands-on — overflows by 10
    // Expected: 60 + (60 - 50) = 70
    const longest = makeItem({ id: "a", handsonMinutes: 10, totalMinutes: 60 });
    const b = makeItem({ id: "b", handsonMinutes: 30, totalMinutes: 35 });
    const c = makeItem({ id: "c", handsonMinutes: 30, totalMinutes: 35 });
    expect(calculateSessionEstimate([longest, b, c])).toBe(70);
  });

  it("picks the item with highest totalMinutes as the anchor", () => {
    const a = makeItem({ id: "a", handsonMinutes: 5, totalMinutes: 10 });
    const b = makeItem({ id: "b", handsonMinutes: 5, totalMinutes: 50 });
    // anchor = b; passive = 45; other hands-on = 5 → no overflow
    expect(calculateSessionEstimate([a, b])).toBe(50);
  });
});

// ── saveSession / loadSession ─────────────────────────────────────────────────

describe("saveSession / loadSession", () => {
  it("returns null when nothing has been saved", () => {
    expect(loadSession()).toBeNull();
  });

  it("round-trips selectedIds and timeWindow", () => {
    saveSession(["a", "b"], 90);
    expect(loadSession()).toEqual({ selectedIds: ["a", "b"], timeWindow: 90 });
  });

  it("overwrites a previous session", () => {
    saveSession(["a"], 60);
    saveSession(["b", "c"], 120);
    expect(loadSession()).toEqual({ selectedIds: ["b", "c"], timeWindow: 120 });
  });

  it("returns null when localStorage contains invalid JSON", () => {
    localStorage.setItem("mealprep_session", "{bad json}");
    expect(loadSession()).toBeNull();
  });
});

// ── saveLastPrep / loadLastPrep ───────────────────────────────────────────────

describe("saveLastPrep / loadLastPrep", () => {
  it("returns null when nothing has been saved", () => {
    expect(loadLastPrep()).toBeNull();
  });

  it("round-trips selectedIds and timeWindow independently of active session", () => {
    saveSession(["session-item"], 30);
    saveLastPrep(["last-item"], 45);
    expect(loadLastPrep()).toEqual({ selectedIds: ["last-item"], timeWindow: 45 });
    expect(loadSession()).toEqual({ selectedIds: ["session-item"], timeWindow: 30 });
  });

  it("returns null when localStorage contains invalid JSON", () => {
    localStorage.setItem("mealprep_last_prep", "not-json");
    expect(loadLastPrep()).toBeNull();
  });
});
