"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import IngredientSection from "@/components/IngredientSection";
import { loadSession } from "@/lib/session";
import { aggregateIngredients } from "@/lib/aggregation";
import type { Item } from "@/lib/types";
import libraryData from "@/data/library.json";

const library = libraryData as Item[];

export default function ShoppingListPage() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (!session || session.selectedIds.length === 0) {
      router.replace("/");
      return;
    }
    setSelectedItems(library.filter((i) => session.selectedIds.includes(i.id)));
    setHydrated(true);
  }, [router]);

  if (!hydrated) return null;

  const { buy, pantry } = aggregateIngredients(selectedItems);

  return (
    <>
      <Header selectedCount={selectedItems.length} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6">
        <h1 className="font-serif text-3xl text-text-primary mb-6">Shopping List</h1>
        <IngredientSection title="Buy" ingredients={buy} />
        <IngredientSection title="Check Your Pantry" ingredients={pantry} />

        <div className="flex justify-end mt-8">
          <button
            onClick={() => router.push("/game-plan")}
            className="h-11 px-6 rounded-pill bg-spice text-paper font-semibold text-sm hover:bg-spice/90 transition-colors focus-visible:outline-2 focus-visible:outline-spice focus-visible:outline-offset-2"
          >
            Generate Game Plan →
          </button>
        </div>
      </main>
    </>
  );
}
