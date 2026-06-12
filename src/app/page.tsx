"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import TimeWindowPicker from "@/components/TimeWindowPicker";
import CategoryFilter from "@/components/CategoryFilter";
import PrepItemCard from "@/components/PrepItemCard";
import TimeBudgetBar from "@/components/TimeBudgetBar";
import SessionEstimateDisplay from "@/components/SessionEstimateDisplay";
import EmptyState from "@/components/EmptyState";
import { saveSession, loadSession, calculateSessionEstimate } from "@/lib/session";
import type { Item } from "@/lib/types";
import libraryData from "@/data/library.json";

const library = libraryData as Item[];

export default function ItemPickerPage() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [timeWindow, setTimeWindow] = useState(60);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage hydration runs once on mount; React 18 batches these updates.
    const session = loadSession();
    if (session) {
      setSelectedIds(session.selectedIds); // eslint-disable-line react-hooks/set-state-in-effect
      setTimeWindow(session.timeWindow);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveSession(selectedIds, timeWindow);
  }, [selectedIds, timeWindow, hydrated]);

  const filteredItems = useMemo(
    () => (activeCategory ? library.filter((i) => i.category === activeCategory) : library),
    [activeCategory]
  );

  const selectedItems = useMemo(
    () => library.filter((i) => selectedIds.includes(i.id)),
    [selectedIds]
  );

  const estimate = useMemo(
    () => calculateSessionEstimate(selectedItems),
    [selectedItems]
  );

  function toggleItem(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const canProceed = selectedIds.length > 0;

  return (
    <>
      <Header selectedCount={selectedIds.length} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <TimeWindowPicker value={timeWindow} onChange={setTimeWindow} />
          <div className="flex flex-col gap-1.5 flex-1 min-w-52">
            <SessionEstimateDisplay items={selectedItems} timeWindow={timeWindow} />
            <TimeBudgetBar estimate={estimate} window={timeWindow} />
          </div>
        </div>

        <CategoryFilter activeCategory={activeCategory} onChange={setActiveCategory} />

        {filteredItems.length === 0 ? (
          <EmptyState isFiltered={activeCategory !== null} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <PrepItemCard
                key={item.id}
                item={item}
                isSelected={selectedIds.includes(item.id)}
                onToggle={toggleItem}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex justify-end pt-2">
          {canProceed ? (
            <button
              onClick={() => router.push("/shopping-list")}
              className="h-11 px-6 rounded-pill bg-spice text-paper font-semibold text-sm hover:bg-spice/90 transition-colors focus-visible:outline-2 focus-visible:outline-spice focus-visible:outline-offset-2"
            >
              View Shopping List →
            </button>
          ) : (
            <div className="relative group">
              <a
                href="/shopping-list"
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
                aria-describedby="cta-tooltip"
                className="inline-flex h-11 px-6 items-center rounded-pill bg-border text-text-muted font-semibold text-sm cursor-default focus-visible:outline-2 focus-visible:outline-spice focus-visible:outline-offset-2"
              >
                View Shopping List →
              </a>
              <span
                id="cta-tooltip"
                role="tooltip"
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded-md bg-text-primary text-paper text-xs px-2 py-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none"
              >
                Select items first
              </span>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
