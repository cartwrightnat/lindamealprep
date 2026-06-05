import type { Item } from "./types";

const SESSION_KEY = "mealprep_session";
const LAST_PREP_KEY = "mealprep_last_prep";

function safeGet(key: string): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, value);
  } catch {
    // ignore quota / SSR errors
  }
}

export function calculateSessionEstimate(items: Item[]): number {
  if (items.length === 0) return 0;

  // Find the longest item by totalMinutes
  const longest = items.reduce((a, b) =>
    a.totalMinutes >= b.totalMinutes ? a : b
  );

  const passiveWindow = longest.totalMinutes - longest.handsonMinutes;

  const otherHandsOn = items
    .filter((i) => i !== longest)
    .reduce((sum, i) => sum + i.handsonMinutes, 0);

  return longest.totalMinutes + Math.max(0, otherHandsOn - passiveWindow);
}

export function saveSession(selectedIds: string[], timeWindow: number): void {
  safeSet(SESSION_KEY, JSON.stringify({ selectedIds, timeWindow }));
}

export function loadSession(): { selectedIds: string[]; timeWindow: number } | null {
  const raw = safeGet(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLastPrep(selectedIds: string[], timeWindow: number): void {
  safeSet(LAST_PREP_KEY, JSON.stringify({ selectedIds, timeWindow }));
}

export function loadLastPrep(): { selectedIds: string[]; timeWindow: number } | null {
  const raw = safeGet(LAST_PREP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
