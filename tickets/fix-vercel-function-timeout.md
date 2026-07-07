# Game Plan always shows "AI unavailable" banner on Vercel (NAT-60 follow-up)

## Summary
On the Vercel deployment (lindamealprep.vercel.app), the Game Plan screen never renders
an AI-generated plan — it always falls back to the rule-based sequencer with the
"AI unavailable" banner. Local dev (`npm run dev`) does not reproduce this.

## Evidence
- Browser DevTools: every `POST /api/sequence` request returns **HTTP 500 after ~10 seconds**,
  consistently, on the Vercel deployment.
- `npm run dev` does not exhibit the issue — no execution time cap locally.

## Root cause
`src/app/api/sequence/route.ts` (the route that calls the Claude API) does not export
`maxDuration`. Without it, the function is subject to Vercel's platform default execution
limit, which is well below the time Claude actually needs to respond — the function gets
killed mid-request, which surfaces to the client as an HTTP 500 after ~10s. This matches
the observed behavior exactly.

The Anthropic SDK client in that file (`@anthropic-ai/sdk@^0.100.1`) is instantiated with
no `timeout` option (`new Anthropic({ apiKey: ... })`), so it inherits the SDK's default
10-minute request timeout — far longer than Vercel's limit, so the SDK-level timeout never
has a chance to fire first. Vercel's platform limit is what's actually killing the request.

**Correction to initial bug report:** the report assumed a 12-second application-level
timeout in the code was being pre-empted by Vercel's limit. That's not accurate — there is
no timeout, retry, or `AbortController` logic anywhere in `route.ts` today. PRD §12
*specifies* this behavior ("treat the call as failed if no response is received within 12
seconds... retry once after 2 seconds with a 5-second timeout") but it was never
implemented. Confirmed via grep across `src/` — no `AbortController`, `retry`, or timeout
handling exists in the sequence route. So there are two gaps, not one: the missing
`maxDuration` (this ticket), and the missing PRD §12 timeout/retry logic (separate,
pre-existing gap — not caused by this fix, but worth flagging so it isn't assumed to
already exist when someone picks up §12 work).

## Proposed fix
Add to `src/app/api/sequence/route.ts`:

```ts
export const maxDuration = 60;
```

This raises the route's execution limit (requires a Vercel plan that supports >10s function
duration — confirm the project's plan supports the requested value before shipping).

## Acceptance criteria
- [ ] On the Vercel deployment, the Game Plan screen renders an AI-generated plan (not the
      offline fallback) for the §13 worked example in the PRD.
- [ ] No "AI unavailable" fallback banner appears for that request.
- [ ] `POST /api/sequence` no longer returns HTTP 500 due to execution timeout for a normal
      request.

## Follow-up note
PRD §12's specified retry/timeout budget (12s call timeout, then one retry after 2s with a
5s timeout — worst case ~19s) needs to be reconciled with whatever `maxDuration` value is
set here, since the two are currently unrelated (the retry logic doesn't exist yet, and even
once built, its worst-case budget must stay under `maxDuration` or the platform will still
kill the function first). Update PRD §12 and/or this ticket's `maxDuration` value together
so the two stay consistent — do not implement the §12 retry logic without checking it fits.
