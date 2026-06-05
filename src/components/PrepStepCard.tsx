import type { Step } from "@/lib/types";

interface PrepStepCardProps {
  step: Step;
}

export default function PrepStepCard({ step }: PrepStepCardProps) {
  return (
    <div className="flex gap-4 p-4 rounded-card border border-border bg-surface">
      <div className="shrink-0 w-8 h-8 rounded-full bg-spice text-paper flex items-center justify-center font-bold text-sm">
        {step.order}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{step.action}</p>
        {step.note && (
          <p className="text-xs italic text-text-secondary mt-0.5">{step.note}</p>
        )}
        {step.storageBadge && (
          <span className="inline-block mt-1 px-2 py-0.5 rounded-pill bg-herb-light text-herb text-xs font-medium">
            {step.storageBadge}
          </span>
        )}
        <p className="text-xs text-text-muted mt-1">{step.durationMinutes} min hands-on</p>
      </div>
    </div>
  );
}
