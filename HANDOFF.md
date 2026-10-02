# sett · handoff to Claude Code

> Superseded for the shell by the roadmap rebase of 2026-10-02 (arch V1 spec): what to keep, change and add, and the lanes, are issue #59 and the issues it lists. The phases below describe what was built before it; the states list still holds for those components.

Repo: `tau-rs/sett`. Package name `@tau-rs/sett` (tokens `@tau-rs/sett-tokens`, crate `sett-tokens`). Custom-element prefix `sett-`. CSS variable prefix `--sett-`.

## Inputs in this folder
- `DESIGN.md` — intent and rules. Normative.
- `AGENTS.md` — copy to repo root; symlink `CLAUDE.md` → `AGENTS.md`.
- `tokens/base.json`, `tokens/light.json`, `tokens/dark.json` — DTCG 2025.10, converted from the arch design-system page. Colours use the 2025.10 object form (`colorSpace`, `components`, `hex`).
- `design/arch-design-system.html` — the reference rendering with every component and state; match it, don't copy its CSS.

## Phase 1 · tokens (one session, ends green)
1. `pnpm init` workspace: `packages/tokens`, `packages/ui`, `packages/storybook`, `packages/agent`.
2. `packages/tokens`: Style Dictionary (v4+, DTCG mode). Targets: `dist/sett.css` (`:root` light, `@media (prefers-color-scheme: dark)` + `[data-theme]` dark), `dist/tokens.ts`, `dist/tokens.rs` (a `pub const` per token, colours as `[f32;3]`, dimensions as `f32`). If the installed version rejects the colour object form, add a preprocessor that reads `.hex`; do not rewrite the source files.
3. Variable names are the DTCG path with `--sett-` prefix: `--sett-color-sel`, `--sett-session-yk-sub`, `--sett-map-kind-rpc-color`, `--sett-radius-chip`.
4. CI: `npx @google/design.md lint DESIGN.md` (adjust front-matter keys to the schema if lint asks; keep the body untouched), a snapshot test on `sett.css`, and a check that no hex appears outside `packages/tokens`.
5. Commit. Report back the token count per file and any value the converter could not express.

## Phase 2 · ui (Lit)
Order (each with stories before moving on): `sett-pill` `sett-tag` → `sett-chip` → `sett-frame` → `sett-selector` (+ menu) → `sett-session-card` → thread family: `sett-msg` `sett-tool` `sett-changed` `sett-question` `sett-deviation` `sett-verbs` `sett-composer` `sett-thread` → `sett-card` (+ variants fix/delta/impact/checklist/pipeline/result/whatsnew) → `sett-split-button` `sett-gated-button` → `sett-tabbar` `sett-seg` `sett-overlay-toggles` → `sett-inlay` → `sett-funnel`.
Map: Lit components after all (ADR 0001, `docs/adr/0001-the-map-is-dom.md`); lanes in issues #35-#41. `packages/tokens/dist/tokens.rs` keeps shipping for any GPU layer; the Storybook Map docs page draws the kind legend from `tokens.ts`.
Generate `custom-elements.json` with `@custom-elements-manifest/analyzer` on every build.

## States each component must cover (stories = these)
- chip: kinds git/agent/finding/review/pipeline/tree × normal/blocking/waiting/done; another session's colour.
- frame: idle, live (default + other session colour), waiting, editing, collision, focus; reduced-motion.
- selector: main, yours, planning, working, asks, paused, done, collision; menu grouped needs-you/working/waiting-to-merge/saved-plans/main.
- session-card: running with sub-agent; asks/paused/taken-over/deviation; glyph column; groups as lanes with the gate words; the verbs bar and the composer (#63).
- thread: session / planner / framer / fixer top borders; me / agent / sub messages; tool block; changed / no-change; question with options and "later"; deviation with the three typologies; verbs bar with glyph buttons; composer.
- cards: all seven; gated + split buttons both states; tabbar with pinned Map, dirty dot, session-coloured tab; seg fill/with count/disabled; inlays six kinds; funnel.
- Two recipe stories: "session · live" and "map · edit at scale" (composed from the components; the map as a static SVG).

## Phase 3 · storybook
`@storybook/web-components-vite`, `setCustomElementsManifest`, addons: docs, a11y, vitest, themes (light/dark toolbar). Docs pages: Tokens (reads tokens.json), Rules (renders DESIGN.md body), Map (legend from tokens.ts). Build to static; publish with the package.

## Phase 4 · agent layer
Generate `packages/agent/llms.txt` and `skills/sett/SKILL.md` from `custom-elements.json` + the stories index at build. Consumers symlink the skill. Switch to `@storybook/addon-mcp` when it supports web-components.

## Consumers (arch first)
`pnpm add @tau-rs/sett`; load `sett.css` + the element bundle in Theia; per-project overrides in `design/theme.json` (DTCG, semantic layer only) built with the same Style Dictionary config; Storybook composition `refs` to sett's Storybook; `.claude/skills/sett` symlink + one line in AGENTS.md.
