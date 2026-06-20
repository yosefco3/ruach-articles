# CLAUDE.md — Ruach Articles

## Way of working (dev-kit)

This project follows the **dev-kit** method (global skill: `~/.claude/skills/dev-kit`).
Pillars:
- **Prompt library** — features are specced under `feature-prompts/<feature>/` (this
  repo's existing convention: a `README.md` spec + numbered `NN-step.md` files).
  Templates for the richer `_PROGRESS.md` + step format live in
  `feature-prompts/_TEMPLATES/`.
- **App overview** — `APP_OVERVIEW.md` is a living doc; keep it current.
- **Test graph** — `python3 scripts/test_graph.py` regenerates `TEST_GRAPH.md`.
- **Code graph** — `code-review-graph update` refreshes `.code-review-graph/`.

## Stack commands
- Run dev: `pnpm dev` (Vite serves front + `/api`, port 5173)
- Tests: `pnpm test` (Vitest) — **requires MySQL up**: `docker compose up -d`
- DB schema: `pnpm drizzle-kit push`
- Type check: `pnpm check`

## Per-feature workflow
1. Spec the feature under `feature-prompts/<slug>/` (small steps, 2–4 files each).
2. Execute one step at a time → run tests → one commit per step → tick the checklist.
3. After each coding mission (source changed): `code-review-graph update`,
   `python3 scripts/test_graph.py`, and update `APP_OVERVIEW.md` if features/models/
   endpoints/workflow/architecture changed.

## Notes
- The test graph uses **colocated** mapping by default. Many tests here are behavioural
  (e.g. `articles.test.ts` exercises `server/routers/articles.ts`), so they show as
  "no source found". To get a precise map, switch `CONFIG["mapping"]` to `"manual"` in
  `scripts/test_graph.py` and fill `MANUAL_MAP`.
