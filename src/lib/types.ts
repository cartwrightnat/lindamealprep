export interface Ingredient {
  name: string; // always lowercase, normalized (e.g. "olive oil" not "Olive Oil")
  quantity: number;
  unit: string; // canonical: "g" | "ml" | "tbsp" | "tsp" | "cup" | "whole"
  isPantryStaple: boolean;
}

export interface Item {
  id: string; // unique slug
  name: string;
  category: "breakfast" | "snack" | "protein" | "sauce" | "sides" | "treat";
  handsonMinutes: number;
  totalMinutes: number; // must be >= handsonMinutes
  equipment: string[]; // [] if none needed
  ovenTemp: number | null; // non-null iff equipment includes "oven"
  storage: ("fridge" | "freezer" | "pantry")[];
  isPantryHeavy: boolean;
  imageAlt: string; // descriptive alt text for the card image
  ingredients: Ingredient[];
}

export interface Step {
  order: number;
  action: string;
  note?: string;
  storageBadge?: string;
  items: string[]; // item ids involved in this step
  durationMinutes: number;
}

export interface Session {
  selectedIds: string[];
  timeWindow: number;
}
