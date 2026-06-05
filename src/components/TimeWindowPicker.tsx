"use client";

const INCREMENTS = Array.from({ length: 10 }, (_, i) => (i + 1) * 30); // 30..300

function formatWindow(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

interface TimeWindowPickerProps {
  value: number;
  onChange: (value: number) => void;
}

export default function TimeWindowPicker({ value, onChange }: TimeWindowPickerProps) {
  const idx = INCREMENTS.indexOf(value);

  function decrement() {
    if (idx > 0) onChange(INCREMENTS[idx - 1]);
  }

  function increment() {
    if (idx < INCREMENTS.length - 1) onChange(INCREMENTS[idx + 1]);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-text-secondary">Time window</span>
      <div className="flex items-center border border-border rounded-md overflow-hidden">
        <button
          onClick={decrement}
          disabled={idx <= 0}
          aria-label="Decrease time window"
          className="w-10 h-10 flex items-center justify-center text-lg text-text-secondary hover:bg-spice-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-spice focus-visible:outline-offset-2"
        >
          −
        </button>
        <span
          aria-live="polite"
          aria-atomic="true"
          className="w-20 text-center text-sm font-semibold text-text-primary"
        >
          {formatWindow(value)}
        </span>
        <button
          onClick={increment}
          disabled={idx >= INCREMENTS.length - 1}
          aria-label="Increase time window"
          className="w-10 h-10 flex items-center justify-center text-lg text-text-secondary hover:bg-spice-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-spice focus-visible:outline-offset-2"
        >
          +
        </button>
      </div>
    </div>
  );
}
