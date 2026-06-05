"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import PrepStepCard from "@/components/PrepStepCard";
import Toast from "@/components/Toast";
import { loadSession, saveLastPrep } from "@/lib/session";
import { sequence } from "@/lib/sequencer";
import type { Item, Step } from "@/lib/types";
import libraryData from "@/data/library.json";

const library = libraryData as Item[];
const COOLDOWN_MS = 5000;

export default function GamePlanPage() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const isOnCooldown = Date.now() < cooldownUntil;

  const fetchGamePlan = useCallback(
    async (items: Item[], timeWindow: number) => {
      setLoading(true);
      setCooldownUntil(Date.now() + COOLDOWN_MS);
      try {
        const res = await fetch("/api/sequence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedIds: items.map((i) => i.id),
            timeWindow,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSteps(data.steps);
      } catch {
        setSteps(sequence(items));
        setToastMessage("Using offline sequencer");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const session = loadSession();
    if (!session || session.selectedIds.length === 0) {
      router.replace("/");
      return;
    }
    const items = library.filter((i) => session.selectedIds.includes(i.id));
    saveLastPrep(session.selectedIds, session.timeWindow);
    setSelectedItems(items);
    setHydrated(true);
    fetchGamePlan(items, session.timeWindow);
  }, [router, fetchGamePlan]);

  if (!hydrated) return null;

  const totalHandsOn = steps.reduce((s, step) => s + step.durationMinutes, 0);

  return (
    <>
      <Header selectedCount={selectedItems.length} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-3xl text-text-primary">Game Plan</h1>
          <button
            onClick={() => {
              const session = loadSession();
              if (session) fetchGamePlan(selectedItems, session.timeWindow);
            }}
            disabled={loading || isOnCooldown}
            className="h-10 px-4 rounded-pill border border-spice text-spice text-sm font-semibold hover:bg-spice-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-spice focus-visible:outline-offset-2"
          >
            {loading ? "Generating…" : "Regenerate"}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 rounded-card bg-border animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {steps.map((step) => (
                <PrepStepCard key={step.order} step={step} />
              ))}
            </div>
            {steps.length > 0 && (
              <p className="mt-4 text-sm text-text-secondary text-right">
                Total hands-on: <strong>{totalHandsOn} min</strong>
              </p>
            )}
          </>
        )}
      </main>

      {toastMessage && (
        <Toast
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </>
  );
}
