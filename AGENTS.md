# sett · agent instructions

You are working in the sett design system (tau-rs). Read `DESIGN.md` before any UI work; it wins over any mock or screenshot.

- Tokens are normative in `packages/tokens/src/*.json` (DTCG 2025.10). Never write a raw hex, px, or duration in a component; reference a token.
- Before using any attribute, property, slot or CSS part on a component, check `packages/ui/custom-elements.json`. Do not invent props.
- Every component has a story per state (see the states list in `HANDOFF.md`). A component without stories is not done. Stories are tests: run them.
- Plain DOM: Lit web components, no framework runtime, no icon font, no external CSS. Everything must load inside Eclipse Theia as a script.
- Dark mode is not optional: every story is checked in both themes; a11y contrast failures block.
- Motion: only `frame.live`, `frame.waiting`, `item-pulse`. Anything else that animates is a bug.
- Do not add a modal, dialog or toast component. If a spec seems to need one, stop and ask.
- Commit per component; keep `pnpm build && pnpm test` green at every commit.
