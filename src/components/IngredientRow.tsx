"use client";

import { useState } from "react";

interface IngredientRowProps {
  name: string;
  quantity: number;
  unit: string;
}

function formatQty(quantity: number, unit: string): string {
  const q = Number.isInteger(quantity) ? quantity : Math.round(quantity * 100) / 100;
  return `${q} ${unit}`;
}

export default function IngredientRow({ name, quantity, unit }: IngredientRowProps) {
  const [checked, setChecked] = useState(false);
  const id = `ing-${name.replace(/\s+/g, "-")}`;

  return (
    <li className="flex items-center gap-2 min-h-[44px] border-b border-border last:border-0">
      <button
        role="checkbox"
        aria-checked={checked}
        id={id}
        onClick={() => setChecked((c) => !c)}
        className="shrink-0 w-11 h-11 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-spice focus-visible:outline-offset-2"
        aria-label={`${checked ? "Uncheck" : "Check"} ${name}`}
      >
        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          checked ? "bg-herb border-herb text-paper" : "border-herb"
        }`}>
          {checked && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
      </button>
      <span className={`flex-1 text-sm ${checked ? "line-through text-text-muted" : "text-text-primary"}`}>
        {name}
      </span>
      <span className="text-sm text-text-secondary shrink-0">
        {formatQty(quantity, unit)}
      </span>
    </li>
  );
}
