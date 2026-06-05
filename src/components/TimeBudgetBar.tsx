"use client";

interface TimeBudgetBarProps {
  estimate: number;
  window: number;
}

export default function TimeBudgetBar({ estimate, window }: TimeBudgetBarProps) {
  const pct = window === 0 ? 0 : Math.min((estimate / window) * 100, 100);
  const overBudget = estimate > window;
  const nearBudget = pct > 75;

  const fillColor = overBudget
    ? "bg-red"
    : nearBudget
    ? "bg-amber"
    : "bg-spice";

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Time budget: ${Math.round(pct)}% used`}
      className="w-full h-2 rounded-pill bg-border overflow-hidden"
    >
      <div
        className={`h-full rounded-pill transition-[width] duration-300 ease-in-out motion-reduce:transition-none ${fillColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
