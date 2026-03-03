# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

MAP Verification System — a case study prototype for the Revenue Intelligence Manager (GTM Engineer) role at Rula. Scores employer commitment evidence on two axes (source trustworthiness + commitment specificity) to surface inflated MAPs before they reach the forecast. All company names, contacts, and account details are fictional.

## Commands

```bash
# Install dependencies
npm install

# Run locally (interactive demo via Vercel dev server)
npx vercel dev
# Open http://localhost:3000?access=<your ACCESS_KEY>

# Run locally (Trigger.dev queue path)
npm run dev

# Deploy to production
vercel --prod --yes
```

Environment variables loaded from `.env` (`ANTHROPIC_API_KEY`, `ACCESS_KEY`). On Vercel, set via environment variables in the dashboard.

## Architecture

Two runtime paths share the same core modules (`src/schemas.ts`, `src/prompt.ts`) and both call `messages.parse()` with `zodOutputFormat`:

```
Browser → POST /api/verify → api/verify.ts (Vercel function) → Claude → MAPVerification JSON
CRM     → trigger           → src/trigger/mapVerification.ts  → Claude → MAPVerification JSON
```

### Key files

| File | Role |
|------|------|
| `src/schemas.ts` | Zod schemas — `evidenceInputSchema` (input validation), `mapVerificationSchema` (structured output format) |
| `src/prompt.ts` | System prompt with scoring rubric + 3 evidence samples for testing |
| `api/verify.ts` | Vercel serverless function — access-gated, validates input, calls Claude, returns JSON |
| `api/check-access.ts` | Lightweight access gate — validates URL param against `ACCESS_KEY` env var |
| `src/trigger/mapVerification.ts` | Trigger.dev `schemaTask` — same logic with retry/backoff for queue-based processing |
| `demo/index.html` | Static demo page — hardcoded result cards + interactive "Try It Yourself" form |
| `vercel.json` | Rewrites (`demo/` as static root), `maxDuration: 60` for the API function |
| `trigger.config.ts` | Trigger.dev project config (retry policy, max duration) |

### Output schema

`MAPVerification` includes: `evidence_quality` (0–1), `commitment_strength` (0–1), `commitment` (extracted details), `signals_for`, `signals_against`, `quota_recommendation` (`count` / `count_with_conditions` / `do_not_count`), `reasoning`, `follow_up_actions`.

## Key Design Decisions

- **Structured outputs over freeform**: `messages.parse()` with Zod schemas guarantees valid JSON matching `MAPVerification`. No regex or freeform text parsing.
- **Two-axis scoring**: Evidence quality and commitment strength scored independently — a reviewer can tell whether a low score means "bad evidence" or "weak commitment".
- **Shared core modules**: `schemas.ts` and `prompt.ts` imported by both runtime paths. Update once, both stay in sync.
- **Access-gated demo**: URL parameter `?access=<key>` required. Key stored in `ACCESS_KEY` env var. Validated client-side (via `/api/check-access`, page hidden until confirmed) and server-side (403 on `/api/verify`).

## Conventions

- TypeScript with ES modules (`"type": "module"` in package.json)
- Zod 4 for schemas (not Zod 3 — uses `z.object()`, no `.parse()` on schemas, use `.safeParse()`)
- Import paths use `.js` extensions (ESM resolution)
- Model: `claude-sonnet-4-6` hardcoded in both runtime paths
- No build step for the demo — `demo/index.html` is plain HTML/CSS/JS served as static files
