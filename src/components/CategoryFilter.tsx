"use client";

const CATEGORIES = ["breakfast", "snack", "protein", "sauce", "sides", "treat"] as const;
type Category = typeof CATEGORIES[number];

interface CategoryFilterProps {
  activeCategory: string | null;
  onChange: (category: string | null) => void;
}

export default function CategoryFilter({ activeCategory, onChange }: CategoryFilterProps) {
  const all = [null, ...CATEGORIES] as (Category | null)[];

  return (
    <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
      {all.map((cat) => {
        const label = cat === null ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1);
        const isSelected = activeCategory === cat;

        return (
          <button
            key={label}
            onClick={() => onChange(isSelected && cat !== null ? null : cat)}
            aria-pressed={isSelected}
            className={`px-4 min-h-[44px] rounded-pill text-sm font-medium border transition-colors focus-visible:outline-2 focus-visible:outline-spice focus-visible:outline-offset-2 ${
              isSelected
                ? "bg-spice text-paper border-spice"
                : "bg-transparent text-herb border-herb hover:bg-herb-light"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
