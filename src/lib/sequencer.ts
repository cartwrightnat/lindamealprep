import type { Item, Step } from "./types";

const SINGLE_USE_EQUIPMENT = new Set([
  "waffle-iron",
  "mixer",
  "blender",
  "food processor",
  "slow cooker",
  "grill",
]);

function ovenConflict(a: Item, b: Item): boolean {
  if (!a.equipment.includes("oven") || !b.equipment.includes("oven")) return false;
  if (a.ovenTemp == null || b.ovenTemp == null) return false;
  return Math.abs(a.ovenTemp - b.ovenTemp) > 25;
}

/**
 * Produces an ordered list of prep steps for the given items, respecting oven
 * temperature conflicts, stovetop burner limits, and single-use equipment.
 * Items with longer total time are scheduled first to maximise passive overlap.
 */
export function sequence(items: Item[]): Step[] {
  if (items.length === 0) return [];

  // Sort longest total time first
  const sorted = [...items].sort((a, b) => b.totalMinutes - a.totalMinutes);

  const steps: Step[] = [];
  const scheduled = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    if (scheduled.has(item.id)) continue;

    // Check conflicts with already-running items in this slot
    const running = sorted.filter((x) => !scheduled.has(x.id) && x !== item);
    let mustSequence = false;

    for (const other of running) {
      if (scheduled.has(other.id)) continue;
      // Oven conflict
      if (ovenConflict(item, other)) { mustSequence = true; break; }
      // Stovetop max 2
      const stovetopItems = sorted.filter(
        (x) => !scheduled.has(x.id) && x !== item && x.equipment.includes("stovetop")
      );
      if (item.equipment.includes("stovetop") && stovetopItems.length >= 2) {
        mustSequence = true; break;
      }
      // Single-use equipment
      for (const eq of item.equipment) {
        if (SINGLE_USE_EQUIPMENT.has(eq) && other.equipment.includes(eq)) {
          mustSequence = true; break;
        }
      }
      if (mustSequence) break;
    }

    const storageNote = item.storage.length
      ? `Store in ${item.storage.join(" or ")}`
      : undefined;

    steps.push({
      order: steps.length + 1,
      action: `Start ${item.name}`,
      note: item.equipment.length ? `Uses: ${item.equipment.join(", ")}` : undefined,
      storageBadge: storageNote,
      items: [item.id],
      durationMinutes: item.handsonMinutes,
    });

    scheduled.add(item.id);
  }

  return steps;
}
