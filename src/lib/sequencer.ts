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

function equipmentConflict(a: Item, b: Item): boolean {
  if (ovenConflict(a, b)) return true;
  for (const eq of a.equipment) {
    if (SINGLE_USE_EQUIPMENT.has(eq) && b.equipment.includes(eq)) return true;
  }
  return false;
}

/**
 * Produces an integrated, interleaved prep plan for all items, scheduling
 * passive phases (oven, simmer) of one recipe in parallel with hands-on work
 * for others. Items with longer total time are anchored first.
 */
export function sequence(items: Item[]): Step[] {
  if (items.length === 0) return [];

  // Sort longest total time first so passive windows open early
  const sorted = [...items].sort((a, b) => b.totalMinutes - a.totalMinutes);

  const steps: Step[] = [];
  // Track which items are currently in a passive phase
  const inPassive = new Set<string>();
  const done = new Set<string>();

  let order = 1;

  function push(partial: Omit<Step, "order">): void {
    steps.push({ order: order++, ...partial });
  }

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    if (done.has(item.id)) continue;

    // Check equipment conflicts with items currently in passive phase
    const conflicting = sorted.find(
      (x) => inPassive.has(x.id) && equipmentConflict(item, x)
    );

    if (conflicting) {
      // Skip for now — will be picked up after the conflicting item finishes
      continue;
    }

    const hasPassive = item.totalMinutes > item.handsonMinutes;

    if (hasPassive) {
      const passiveMinutes = item.totalMinutes - item.handsonMinutes;

      push({
        action: `Start ${item.name} — hands-on prep`,
        note: item.equipment.length ? `Uses: ${item.equipment.join(", ")}` : undefined,
        items: [item.id],
        durationMinutes: item.handsonMinutes,
        recipeName: item.name,
      });

      push({
        action: `${item.name} cooks passively — set timer`,
        note: `Set timer for ${passiveMinutes} min`,
        items: [item.id],
        durationMinutes: 0,
        recipeName: item.name,
      });

      inPassive.add(item.id);

      // Schedule remaining items during this passive window
      let remaining = passiveMinutes;
      for (let j = i + 1; j < sorted.length; j++) {
        const next = sorted[j];
        if (done.has(next.id) || inPassive.has(next.id)) continue;
        if (sorted.some((x) => inPassive.has(x.id) && equipmentConflict(next, x))) continue;

        push({
          action: `While ${item.name} cooks — start ${next.name}`,
          note: next.equipment.length ? `Uses: ${next.equipment.join(", ")}` : undefined,
          items: [next.id],
          durationMinutes: Math.min(next.handsonMinutes, remaining),
          recipeName: next.name,
        });

        if (next.totalMinutes > next.handsonMinutes) {
          const np = next.totalMinutes - next.handsonMinutes;
          push({
            action: `${next.name} cooks passively — set timer`,
            note: `Set timer for ${np} min`,
            items: [next.id],
            durationMinutes: 0,
            recipeName: next.name,
          });
          inPassive.add(next.id);
        } else {
          if (next.storage.length) {
            push({
              action: `Store ${next.name}`,
              storageBadge: `Store in ${next.storage.join(" or ")}`,
              items: [next.id],
              durationMinutes: 2,
              recipeName: next.name,
            });
          }
          done.add(next.id);
        }

        remaining -= next.handsonMinutes;
        if (remaining <= 0) break;
      }

      // Finish the passive item
      push({
        action: `Finish and store ${item.name}`,
        storageBadge: item.storage.length ? `Store in ${item.storage.join(" or ")}` : undefined,
        items: [item.id],
        durationMinutes: 3,
        recipeName: item.name,
      });

      inPassive.delete(item.id);
      done.add(item.id);
    } else {
      push({
        action: `Prepare ${item.name}`,
        note: item.equipment.length ? `Uses: ${item.equipment.join(", ")}` : undefined,
        items: [item.id],
        durationMinutes: item.handsonMinutes,
        recipeName: item.name,
      });

      if (item.storage.length) {
        push({
          action: `Store ${item.name}`,
          storageBadge: `Store in ${item.storage.join(" or ")}`,
          items: [item.id],
          durationMinutes: 2,
          recipeName: item.name,
        });
      }
      done.add(item.id);
    }
  }

  // Catch any items skipped due to equipment conflicts
  for (const item of sorted) {
    if (done.has(item.id)) continue;
    push({
      action: `Prepare ${item.name}`,
      note: item.equipment.length ? `Uses: ${item.equipment.join(", ")}` : undefined,
      items: [item.id],
      durationMinutes: item.handsonMinutes,
      recipeName: item.name,
    });
    if (item.storage.length) {
      push({
        action: `Store ${item.name}`,
        storageBadge: `Store in ${item.storage.join(" or ")}`,
        items: [item.id],
        durationMinutes: 2,
        recipeName: item.name,
      });
    }
  }

  return steps;
}
