"use client";

import { calculateSessionEstimate } from "@/lib/session";
import type { Item } from "@/lib/types";

function formatMinutes(min: number): string {
  if (min < 60) return `~${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `~${h} hr` : `~${h} hr ${m} min`;
}

interface SessionEstimateDisplayProps {
  items: Item[];
  timeWindow: number;
}

export default function SessionEstimateDisplay({
  items,
  timeWindow,
}: SessionEstimateDisplayProps) {
  const estimate = calculateSessionEstimate(items);
  const overBudget = estimate > timeWindow;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-secondary">Estimated session:</span>
      <span
        className={`text-sm font-semibold ${
          overBudget ? "text-red" : "text-text-primary"
        }`}
        aria-live="polite"
        aria-atomic="true"
      >
        {formatMinutes(estimate)}
        {overBudget && (
          <span aria-label="over budget" className="ml-1">⚠️</span>
        )}
      </span>
    </div>
  );
}
