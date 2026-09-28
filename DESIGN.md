---
name: sett
version: 0.1.0
description: Design system for tau-rs developer tools (arch first). Dense, quiet, dark-first, plain DOM.
tokens: ./packages/tokens/src        # DTCG 2025.10 — the normative values; this front matter is a resolved summary
colors:
  light:
    bg: "#F3F5F6"
    paper: "#FFFFFF"
    well: "#E9EDEF"
    ink: "#17242B"
    ink2: "#4A5B64"
    mute: "#8A9AA3"
    line: "#CBD4D9"
    line2: "#E1E7EA"
    sel: "#1F5FA8"
    ok: "#2E7D5B"
    bad: "#B23A33"
    sug: "#B87A0E"
    session-yk: "#6B5BD2"
  dark:
    bg: "#141B1F"
    paper: "#1B2429"
    well: "#22303A"
    ink: "#E6EDF0"
    ink2: "#B3C0C7"
    mute: "#7C8C95"
    line: "#33434C"
    line2: "#28353D"
    sel: "#5B95E0"
    ok: "#4DB388"
    bad: "#E0665C"
    sug: "#E0A63A"
    session-yk: "#9284E8"
typography:
  sans: { fontFamily: "IBM Plex Sans", fallback: "system-ui, sans-serif" }
  mono: { fontFamily: "IBM Plex Mono", fallback: "ui-monospace, monospace" }
  scale: [10.5, 11, 11.5, 12, 12.5, 13, 14]
  mapLabel: 10
  maxSize: 14
spacing: { unit: 4 }
radius: { item: 3, chip: 4, card: 6, node: 8, pane: 10 }
motion:
  frameRotate: 6s
  framePulse: 1.6s
  itemPulse: 700ms
  allowed: [frame.live, frame.waiting, item-pulse, zoom(v2)]
---

## What sett is for

sett styles developer tools that put a map or a document at the centre and keep the chrome quiet around it. It was extracted from the arch mocks (September 2026) and is meant to be reused by other tau-rs tools. Two surfaces: the **chrome** (cool grey on white) and the **map** (warm paper, warm-grey items). Semantic colours are fills and text; session colours are outlines, dots and borders. That split is what lets both sets coexist at 12 px.

## Principles that constrain visual design

- **P-1 · two doors, agent door first.** Every action has a manual path and an agent path, both visible. The agent door comes first and is the bold one; the manual door is always there and never privileged (`with Yokohama · fix myself`). The "me first" setting swaps order and weight. Never a single "let the AI" button, never a hidden manual path.
- **P-2 · reader, not owner.** Nothing pops up, nothing blocks. State is shown by chips, pills and one frame that changes colour, never by a modal or a banner.

## Colours

- Chrome greys are the resting state. `ink`, `ink2`, `mute` are the only three text colours; no fourth.
- `sel` (blue) is selection, your own work, links, the editing frame, and the focus ring (a `lit` stroke inside the idle frame; focus is "you are here", never a status). `ok` green is done/passed/added. `bad` red is finding/deviation/collision/removed. `sug` amber is suggested/planned/waiting: things that need you.
- Session colours identify an agent everywhere (frame, dot, card border, message border, map overlay). Seven are defined; assign in order yk, tl, mg, cy, ol, sn, pl. A session is always named next to its colour. Each has a `sub` shade (sub-agents) and a `bg` tint.
- Every colour has a dark value. Components never hard-code a hex.

## Type

- Sans for UI and prose; mono for identifiers, code, branch names, counts, file:line, and map labels.
- Scale 10.5 / 11 / 11.5 / 12 / 12.5 / 13 / 14. Nothing on a screen is larger than 14; 14 is for pane headings only.
- Map labels are 10 px, one size, and never scale. Scale is handled by folding, never by shrinking.
- Weights: 400 body, 500 names and active tabs, 600 headings and primary links. No bold identifiers.
- Labels are lowercase. No uppercase eyebrows, no letter-spacing.

## Spacing, radius, stroke

- 4 px grid. Radii: 3 items and tags, 4 chips, 6 cards, 8 nodes and messages, 10 panes and the frame.
- Strokes: 1 hairline, 1.6 lit (selected item and its links), 3 the frame.

## Motion

Only three things move: the live frame (session gradient, 6 s rotate), the waiting frame (amber pulse, 1.6 s), and one 700 ms ring on a map item whose facts changed. `prefers-reduced-motion` stills all of them. One more use of the waiting-frame pulse is allowed: the session dot pulses while its session is working, wherever that dot sits (selector, menu row, session card). Pills and tags never animate; the gradient never leaves the frame. No hover transitions, no fades, no slide-ins. Content never moves; only the border does.

## Rules the components encode

1. Verbs live in a pane's fixed bar or in a chip. There is no modal component. A menu is an anchored disclosure under its selector: it never dims or traps the screen and closes on Esc, on a click outside, or when a row is chosen. That is allowed under P-2; a popup that blocks is not.
2. A blocked or waiting state is a `pill` wherever its subject is named: selector, menu row, gated button reason, session-card row. Same pill, same words.
3. Agent door first and bold in every pair, manual second and plain; the "me first" setting swaps both. Verbs are lowercase. A done chip keeps full contrast: its kind label turns ok with `✓`, and it gains a plain `dismiss` verb.
4. Chips and cards separate with `·`; identifiers are mono.
5. Dark mode is required from day one.
6. Map primitives are values, not CSS: the WebGL layer reads `tokens.rs`, generated from the same DTCG source.

## Glyph vocabulary

`✓` done · `●` running · `⏸` paused · `✋` stepped in · `≠` deviation · `!` asks · `·` pending · `⚠` finding. Unicode, sans, in a 12 px column. No icon font.

## Components (v0.1)

chip · frame · selector · session-card · thread (msg, tool, changed, question, deviation, verbs, composer) · map primitives (values only) · editor inlays · cards (fix, delta, impact, checklist, pipeline, result, what's-new) · split-button · gated-button · tabbar · seg · overlay-toggles · funnel.

Reference rendering: `design/arch-design-system.html` (the page this file was extracted from). Where the page and this file disagree, this file wins.
