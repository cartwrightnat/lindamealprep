import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import libraryData from "@/data/library.json";
import type { Item, Step } from "@/lib/types";

const library = libraryData as Item[];

// Module-level rate limiting — minimum 5s between calls
let lastCallAt = 0;
const COOLDOWN_MS = 5000;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL ?? "claude-haiku-4-5";

function buildPrompt(items: Item[], timeWindow: number): string {
  const itemDescriptions = items
    .map(
      (i) =>
        `- ${i.name} (id: ${i.id}): ${i.handsonMinutes} min hands-on, ${i.totalMinutes} min total` +
        (i.equipment.length ? `, equipment: ${i.equipment.join(", ")}` : "") +
        (i.ovenTemp ? `, oven ${i.ovenTemp}°F` : "") +
        `, storage: ${i.storage.join("/")}`
    )
    .join("\n");

  return `You are a meal prep sequencer. Given these batch prep items and a ${timeWindow}-minute time window, create an optimal step-by-step game plan.

Items:
${itemDescriptions}

Equipment constraints:
- Oven: only one item at a time unless oven temps are within 25°F of each other
- Stovetop: max 2 burners simultaneously
- Waffle-iron, mixer, blender, food processor, slow cooker: one at a time each

Return ONLY valid JSON matching this exact structure, no markdown fences, no extra text:
{
  "steps": [
    {
      "order": 1,
      "action": "Start [item name]",
      "note": "optional brief note",
      "storageBadge": "Store in fridge/freezer/pantry",
      "items": ["item-id"],
      "durationMinutes": 15
    }
  ]
}`;
}

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

  lastCallAt = now;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: buildPrompt(items, body.timeWindow) }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text) as { steps: Step[] };

    return NextResponse.json({ steps: parsed.steps });
  } catch {
    // Fall through — client will use offline sequencer
    return NextResponse.json({ error: "AI sequencer unavailable" }, { status: 500 });
  }
}
