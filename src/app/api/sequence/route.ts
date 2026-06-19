import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import libraryData from "@/data/library.json";
import type { Item, Step } from "@/lib/types";

const library = libraryData as Item[];

// Module-level rate limiting — minimum 5s between calls
let lastCallAt = 0;
const COOLDOWN_MS = 5000;

const MODEL = process.env.CLAUDE_MODEL ?? "claude-haiku-4-5";

/**
 * Returns a human-readable error string if ANTHROPIC_API_KEY is missing or
 * still set to the placeholder value, otherwise null.
 * Exported for unit testing without requiring Next.js mocks.
 */
export function getConfigError(): string | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.trim() === "") return "ANTHROPIC_API_KEY is not set";
  return null;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(items: Item[], timeWindow: number): string {
  const itemDescriptions = items
    .map((i) => {
      const ingredientList = i.ingredients
        .map((ing) => `${ing.quantity} ${ing.unit} ${ing.name}`)
        .join(", ");
      return (
        `- ${i.name} (id: ${i.id}): ${i.handsonMinutes} min hands-on, ${i.totalMinutes} min total` +
        (i.equipment.length ? `, equipment: ${i.equipment.join(", ")}` : "") +
        (i.ovenTemp ? `, oven ${i.ovenTemp}°F` : "") +
        `, storage: ${i.storage.join("/")}` +
        (ingredientList ? `\n  Ingredients: ${ingredientList}` : "")
      );
    })
    .join("\n");

  return `You are a meal prep coach creating a fully integrated, parallel-optimized action plan for a ${timeWindow}-minute prep session.

Recipes to prepare:
${itemDescriptions}

Your goal is to produce ONE numbered action list that interleaves ALL recipes to maximize efficiency:
- Schedule the longest/most-passive recipe first (e.g. get it in the oven or simmering before starting hands-on work for others)
- During any passive/waiting phase (oven, simmer, rest), immediately schedule hands-on steps for a different recipe
- Break each recipe into individual actions (preheat, chop, mix, sear, set timer, store) rather than one "start" step
- Include timer reminders for passive phases (e.g. "Set timer for 35 min")
- End each recipe with a storage step once it is done
- Never run two recipes on the same single-use equipment simultaneously (waffle-iron, mixer, blender, food processor, slow cooker)
- Oven: only one recipe at a time unless temps are within 25°F
- Stovetop: max 2 burners at once

Each step must include the "recipeName" field so steps can be color-coded by recipe.

Return ONLY valid JSON, no markdown fences, no extra text:
{
  "steps": [
    {
      "order": 1,
      "action": "concise action description",
      "note": "optional timer or tip",
      "storageBadge": "Store in fridge/freezer/pantry (only on final step for that recipe, else omit)",
      "items": ["item-id"],
      "durationMinutes": 5,
      "recipeName": "Exact Recipe Name"
    }
  ]
}`;
}

/**
 * POST /api/sequence
 * Accepts `{ selectedIds: string[], timeWindow: number }` and returns an
 * AI-generated `{ steps: Step[] }` game plan via Claude.
 * Falls back with HTTP 500 when the AI call fails so the client can use the
 * offline sequencer instead.
 */
export async function POST(req: NextRequest) {
  // Rate limiting
  const now = Date.now();
  if (now - lastCallAt < COOLDOWN_MS) {
    return NextResponse.json({ error: "Rate limited — wait 5 seconds" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.selectedIds) || typeof body.timeWindow !== "number") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const items = (body.selectedIds as string[])
    .map((id) => library.find((i) => i.id === id))
    .filter((i): i is Item => !!i);

  if (items.length === 0) {
    return NextResponse.json({ error: "No valid item IDs" }, { status: 400 });
  }

  const configError = getConfigError();
  if (configError) {
    console.error("[/api/sequence]", configError);
    return NextResponse.json({ error: configError }, { status: 503 });
  }

  lastCallAt = now;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: buildPrompt(items, body.timeWindow) }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text) as { steps: Step[] };

    return NextResponse.json({ steps: parsed.steps });
  } catch (err) {
    console.error("[/api/sequence] AI call failed:", err);
    return NextResponse.json({ error: "AI sequencer unavailable" }, { status: 500 });
  }
}
