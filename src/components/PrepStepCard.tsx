import type { Step } from "@/lib/types";

interface PrepStepCardProps {
  step: Step;
  color?: string;
}

/**
 * Renders a single prep step with an optional recipe color bar on the left
 * and a recipe name label when color coding is active.
 */
export default function PrepStepCard({ step, color }: PrepStepCardProps) {
  return (
    <div className="flex gap-4 p-4 rounded-card border border-border bg-surface overflow-hidden relative">
      {/* Color bar */}
      {color && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-card"
          style={{ backgroundColor: color }}
        />
      )}

      <div className={color ? "pl-3 flex gap-4 flex-1 min-w-0" : "flex gap-4 flex-1 min-w-0"}>
        {/* Step number */}
        <div
          className="shrink-0 w-8 h-8 rounded-full text-paper flex items-center justify-center font-bold text-sm"
          style={{ backgroundColor: color ?? "var(--color-spice)" }}
        >
          {step.order}
        </div>

        <div className="flex-1 min-w-0">
          {step.recipeName && (
            <span
              className="inline-block mb-1 px-2 py-0.5 rounded-pill text-[10px] font-semibold text-paper uppercase tracking-wide"
              style={{ backgroundColor: color ?? "var(--color-spice)" }}
            >
              {step.recipeName}
            </span>
          )}
          <p className="text-sm font-semibold text-text-primary">{step.action}</p>
          {step.note && (
            <p className="text-xs italic text-text-secondary mt-0.5">{step.note}</p>
          )}
          {step.storageBadge && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-pill bg-herb-light text-herb text-xs font-medium">
              {step.storageBadge}
            </span>
          )}
          {step.durationMinutes > 0 && (
            <p className="text-xs text-text-muted mt-1">{step.durationMinutes} min</p>
          )}
        </div>
      </div>
    </div>
  );
}
