import * as fs from "fs";
import * as path from "path";

const CANONICAL_UNITS = new Set([
  "g", "ml", "tbsp", "tsp", "cup", "whole",
  "oz", "lb", "clove", "piece", "pinch",
  "large", "medium", "small",
  "can", "bunch", "head", "rib",
]);

const VALID_CATEGORIES = new Set(["breakfast", "snack", "protein", "sauce", "sides", "treat"]);
const VALID_STORAGE = new Set(["fridge", "freezer", "pantry"]);

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  isPantryStaple: boolean;
}

interface Item {
  id: string;
  name: string;
  category: string;
  handsonMinutes: number;
  totalMinutes: number;
  equipment: string[];
  ovenTemp: number | null;
  storage: string[];
  isPantryHeavy: boolean;
  imageAlt: string;
  ingredients: Ingredient[];
}

const libraryPath = path.join(process.cwd(), "src/data/library.json");
const raw = fs.readFileSync(libraryPath, "utf-8");
const items: Item[] = JSON.parse(raw);

const errors: string[] = [];

function err(id: string, msg: string) {
  errors.push(`[${id}] ${msg}`);
}

const seenIds = new Set<string>();

for (const item of items) {
  const id = item.id ?? "(unknown)";

  // Duplicate IDs
  if (seenIds.has(id)) err(id, `Duplicate id`);
  seenIds.add(id);

  // Required string fields
  if (!item.name || typeof item.name !== "string") err(id, `Missing or invalid name`);
  if (!VALID_CATEGORIES.has(item.category)) err(id, `Invalid category: "${item.category}"`);
  if (!item.imageAlt || typeof item.imageAlt !== "string") err(id, `Missing or empty imageAlt`);

  // Timing
  if (typeof item.handsonMinutes !== "number") err(id, `handsonMinutes must be a number`);
  if (typeof item.totalMinutes !== "number") err(id, `totalMinutes must be a number`);
  if (item.handsonMinutes > item.totalMinutes) {
    err(id, `handsonMinutes (${item.handsonMinutes}) > totalMinutes (${item.totalMinutes})`);
  }

  // Equipment / ovenTemp consistency
  const hasOven = Array.isArray(item.equipment) && item.equipment.includes("oven");
  if (hasOven && item.ovenTemp == null) {
    err(id, `has "oven" in equipment but ovenTemp is null`);
  }
  if (!hasOven && item.ovenTemp != null) {
    err(id, `ovenTemp is set (${item.ovenTemp}) but equipment does not include "oven"`);
  }

  // Storage
  if (!Array.isArray(item.storage) || item.storage.length === 0) {
    err(id, `storage must have at least one value`);
  } else {
    for (const s of item.storage) {
      if (!VALID_STORAGE.has(s)) err(id, `Invalid storage value: "${s}"`);
    }
  }

  // Ingredients
  if (!Array.isArray(item.ingredients)) {
    err(id, `ingredients must be an array`);
    continue;
  }

  for (const ing of item.ingredients) {
    if (!ing.name || typeof ing.name !== "string") {
      err(id, `Ingredient missing name`);
    } else {
      if (ing.name !== ing.name.toLowerCase()) {
        err(id, `Ingredient name not lowercase: "${ing.name}"`);
      }
    }
    if (typeof ing.quantity !== "number") {
      err(id, `Ingredient "${ing.name}" quantity is not a number`);
    }
    if (!ing.unit || typeof ing.unit !== "string") {
      err(id, `Ingredient "${ing.name}" missing unit`);
    } else if (!CANONICAL_UNITS.has(ing.unit)) {
      err(id, `Ingredient "${ing.name}" has non-canonical unit: "${ing.unit}"`);
    }
    if (typeof ing.isPantryStaple !== "boolean") {
      err(id, `Ingredient "${ing.name}" isPantryStaple must be boolean`);
    }
  }
}

if (errors.length > 0) {
  console.error(`\n❌ Library validation failed — ${errors.length} error(s):\n`);
  errors.forEach((e) => console.error(` • ${e}`));
  process.exit(1);
} else {
  console.log(`✅ Library valid — ${items.length} items, no errors.`);
  process.exit(0);
}
