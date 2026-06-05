"use client";

import Image from "next/image";
import type { Item } from "@/lib/types";

interface PrepItemCardProps {
  item: Item;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export default function PrepItemCard({ item, isSelected, onToggle }: PrepItemCardProps) {
  return (
    <button
      onClick={() => onToggle(item.id)}
      aria-pressed={isSelected}
      aria-label={`${item.name}${isSelected ? ", selected" : ""}`}
      className={`relative w-full text-left rounded-card overflow-hidden border-2 transition-all focus-visible:outline-2 focus-visible:outline-spice focus-visible:outline-offset-2 ${
        isSelected
          ? "border-spice ring-2 ring-spice ring-offset-1"
          : "border-border hover:border-spice-light"
      }`}
    >
      {/* 3:2 image */}
      <div className="relative w-full aspect-[3/2] bg-spice-light">
        <Image
          src={`/items/${item.id}.jpg`}
          alt={item.imageAlt}
          fill
          className="object-cover"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (!img.src.includes("placeholder")) {
              img.src = "/items/placeholder.svg";
            }
          }}
        />
        {isSelected && (
          <span
            aria-hidden="true"
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-spice flex items-center justify-center text-paper text-sm font-bold shadow"
          >
            ✓
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-3 bg-surface">
        <span className="text-xs font-semibold uppercase tracking-wide text-herb">
          {item.category}
        </span>
        <h3 className="font-serif text-base font-semibold text-text-primary mt-0.5 leading-snug">
          {item.name}
        </h3>
        <p className="text-xs text-text-secondary mt-1">
          {item.handsonMinutes} min hands-on
          {item.totalMinutes !== item.handsonMinutes && (
            <> · {item.totalMinutes} min total</>
          )}
        </p>
      </div>
    </button>
  );
}
