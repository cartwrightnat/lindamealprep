"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import PrepStepCard from "@/components/PrepStepCard";
import { loadSession, saveLastPrep } from "@/lib/session";
import { sequence } from "@/lib/sequencer";
import type { Item, Step } from "@/lib/types";
import libraryData from "@/data/library.json";

const library = libraryData as Item[];
const COOLDOWN_MS = 5000; // 5s

// Warm, distinct palette for up to 8 recipes
const RECIPE_COLORS = [
  "#C24E1A", // spice
  "#4A6741", // herb
  "#D97706", // amber
  "#7C3AED", // violet
  "#0369A1", // blue
  "#BE185D", // rose
  "#0F766E", // teal
  "#92400E", // brown
];

/** Builds a stable recipeName → hex color map from the ordered step list. */
function buildColorMap(steps: Step[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const step of steps) {
    if (step.recipeName && !map.has(step.recipeName)) {
      map.set(step.recipeName, RECIPE_COLORS[map.size % RECIPE_COLORS.length]);
    }
  }
  return map;
}

export default function GamePlanPage() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);
  const [fallbackReason, setFallbackReason] = useState<"misconfigured" | "unavailable" | null>(null);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current !== null) clearTimeout(cooldownTimer.current);
    };
  }, []);

  const fetchGamePlan = useCallback(
    async (items: Item[], timeWindow: number) => {
      setLoading(true);
      setIsOnCooldown(true);
      if (cooldownTimer.current !== null) clearTimeout(cooldownTimer.current);
      cooldownTimer.current = setTimeout(() => setIsOnCooldown(false), COOLDOWN_MS);
      try {
        const res = await fetch("/api/sequence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedIds: items.map((i) => i.id),
            timeWindow,
          }),
        });
        if (!res.ok) {
          const reason = res.status === 503 ? "misconfigured" : "unavailable";
          throw Object.assign(new Error(`HTTP ${res.status}`), { reason });
        }
        const data = await res.json();
        setSteps(data.steps);
        setFallbackReason(null);
      } catch (err) {
        if (process.env.NEXT_PUBLIC_DEBUG_NO_FALLBACK === "true") throw err;
        setSteps(sequence(items));
        const reason = (err as { reason?: string }).reason;
        setFallbackReason(reason === "misconfigured" ? "misconfigured" : "unavailable");
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
    // localStorage hydration runs once on mount; React 18 batches these updates.
    setSelectedItems(items); // eslint-disable-line react-hooks/set-state-in-effect
    setHydrated(true);
    fetchGamePlan(items, session.timeWindow);
  }, [router, fetchGamePlan]);

  if (!hydrated) return null;

  const colorMap = buildColorMap(steps);
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

        {fallbackReason && !loading && (
          <div className="mb-4 px-4 py-3 rounded-card border border-amber-300 bg-amber-50 text-amber-800 text-sm flex items-start gap-2">
            <span aria-hidden="true">⚠</span>
            <span>
              {fallbackReason === "misconfigured"
                ? "AI not configured — set ANTHROPIC_API_KEY in your environment variables, then tap Regenerate."
                : "AI unavailable — showing offline schedule (less detailed). Tap Regenerate to try again."}
            </span>
          </div>
        )}

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
                <PrepStepCard
                  key={step.order}
                  step={step}
                  color={step.recipeName ? colorMap.get(step.recipeName) : undefined}
                />
              ))}
            </div>

            {steps.length > 0 && (
              <>
                <p className="mt-4 text-sm text-text-secondary text-right">
                  Total hands-on: <strong>{totalHandsOn} min</strong>
                </p>

                {/* Color legend */}
                {colorMap.size > 0 && (
                  <div className="mt-6 p-4 rounded-card border border-border bg-surface">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
                      Recipes
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {Array.from(colorMap.entries()).map(([name, color]) => (
                        <div key={name} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-text-primary">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

    </>
  );
}
