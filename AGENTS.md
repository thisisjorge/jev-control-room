# Agent notes — Jev Control Room

## Goal
Keep this project a small, credible demonstration of decision-model infrastructure. Do not turn it into a chatbot.

## Technical constraints
- Preserve TypeSafe Jev as the decision engine through Vercel AI Gateway.
- Use `experimental_evaluate` from the installed AI SDK version.
- Before modifying Jev API shapes, inspect the bundled `node_modules/ai/docs` and `node_modules/ai/src` after dependencies are installed.
- Preserve explicit DEMO vs LIVE labeling. Never present mocked decisions as Jev output.
- Keep API keys server-side only.
- Keep confidence policies deterministic and inspectable.
- Prefer accessible native controls and responsive CSS.

## Design direction
Dark infrastructure-console aesthetic; restrained motion; dense but legible information hierarchy; no generic gradient hero cards or chatbot bubbles.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
