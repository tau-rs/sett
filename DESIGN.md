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
    mute: "#5D6C75"
    line: "#CBD4D9"
    line2: "#E1E7EA"
    sel: "#1F5FA8"
    ok: "#287857"
    bad: "#B23A33"
    sug: "#946003"
    session-yk: "#6959D0"
  dark:
    bg: "#141B1F"
    paper: "#1B2429"
    well: "#22303A"
    ink: "#E6EDF0"
    ink2: "#B3C0C7"
    mute: "#8F9FA8"
    line: "#33434C"
    line2: "#28353D"
    sel: "#629DE8"
    ok: "#4DB388"
    bad: "#EB7065"
    sug: "#E0A63A"
    session-yk: "#9688EC"
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
  allowed: [frame.live, frame.waiting, item-pulse, zoom, tier-swap, flow]
---

## What sett is for

sett styles developer tools that put a map or a document at the centre and keep the chrome quiet around it. It was extracted from the arch mocks (September 2026) and is meant to be reused by other tau-rs tools. One material: the **map** sits on the same cool grey as the **chrome** around it, and only the columns inside an open unit are tinted (ADR 0001). Semantic colours are fills and text; session colours are outlines, dots and borders. That split is what lets both sets coexist at 12 px.

## Principles that constrain visual design

- **P-1 · two doors, agent door first.** Every action has a manual path and an agent path, both visible. The agent door comes first and is the bold one; the manual door is always there and never privileged (`with Yokohama · fix myself`). The "me first" setting swaps order and weight. Never a single "let the AI" button, never a hidden manual path.
- **P-2 · reader, not owner.** Nothing pops up, nothing blocks. State is shown by chips, pills and one frame that changes colour, never by a modal or a banner.

## Colours

- Chrome greys are the resting state. `ink`, `ink2`, `mute` are the only three text colours; no fourth.
- `sel` (blue) is selection, your own work, links, the editing frame, and the focus ring (a `lit` stroke inside the idle frame; focus is "you are here", never a status). `ok` green is done/passed/added. `bad` red is finding/deviation/collision/removed. `sug` amber is suggested/planned/waiting: things that need you.
- Session colours identify an agent everywhere (frame, dot, card border, message border, map overlay). Seven are defined; assign in order yk, tl, mg, cy, ol, sn, pl. A session is always named next to its colour. Each has a `sub` shade (sub-agents) and a `bg` tint.
- Every colour has a dark value. Components never hard-code a hex. Accent text (`sel`, `ok`, `sug`, `bad`) sits on `paper` or `bg`, never on the `well` tint, where blue and red fall under 4.5:1.
- Any colour that is read as text reaches 4.5:1 (WCAG AA) on every surface it sits on, in both themes: `mute`, `ok`, `bad`, `sug`, `sel` and every session `main` on paper, well, bg and their own tint. The Storybook a11y gate fails a story on any contrast below that, so a text colour changes here, in the tokens, never in a component. Sub shades are outlines, dots and guide lines, not text.

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

Only three things move in the chrome: the live frame (session gradient, 6 s rotate), the waiting frame (amber pulse, 1.6 s), and one 700 ms ring on a map item whose facts changed. The map adds three, and only three: the camera fit (`zoom`, 300 ms), the row cross-fade when a node changes tier (`tier-swap`, 150 ms), and the direction dash on the selected unit's edges (`flow`, 1.1 s). A node never resizes itself; the camera moves. `prefers-reduced-motion` stills all of them. One more use of the waiting-frame pulse is allowed: the session dot pulses while its session is working, wherever that dot sits (selector, menu row, session card). Pills and tags never animate; the gradient never leaves the frame. No hover transitions, no fades, no slide-ins. Content never moves; only the border does.

## Rules the components encode

1. Verbs live in a pane's fixed bar or in a chip. There is no modal component. A menu is an anchored disclosure under its selector: it never dims or traps the screen and closes on Esc, on a click outside, or when a row is chosen. That is allowed under P-2; a popup that blocks is not.
2. A blocked or waiting state is a `pill` wherever its subject is named: selector, menu row, gated button reason, session-card row. Same pill, same words.
3. Agent door first and bold in every pair, manual second and plain; the "me first" setting swaps both. Verbs are lowercase. A done chip keeps full contrast: its kind label turns ok with `✓`, and it gains a plain `dismiss` verb. A blocked primary button (the gated merge, hand back before the note) is a dashed blue outline with blue text at full contrast, never a faded fill; its reason sits under it as pills that link to what unblocks it.
4. Chips and cards separate with `·`; identifiers are mono.
5. Dark mode is required from day one.
6. The map is DOM (ADR 0001): `sett-*` elements read the `map.*` tokens as CSS variables. `tokens.rs` is still generated from the same DTCG source for any GPU layer, but nothing in sett depends on one existing. The map's own rules are the section "The map" below.
7. Session-card rows: the glyph carries the state; the right cell says only what the glyph cannot (`asks · n`, `paused`, `deviation`, `you`) in plain secondary ink, never a pill and never the session's own name. The current row takes the session's tint. Sub-agents fold under their step, folded by default, with the count and a glyph run on the step row and one continuous guide line in the sub shade when open.
8. Thread messages: every message opens with an author line (a dot and the name at 11 px medium in the author's colour, then the time). Yours sit on the right in the selection tint; agents on the left outlined in their colour; sub-agents outlined in the sub shade with the sub-shade dot, the name still in the session's main colour (the sub shade is not a text colour). Every agent reply ends with a `changed · what` or `no change` line.
9. Taking over is two acts: pause, then take over. Verbs are words, never glyphs: running `pause · stop`, paused `resume · take over · stop`, taken over `stop`. `✋` is a state glyph on the session card only. Handing back is written in the composer, which becomes the hand-back note while you hold a step; the note lands in the thread as a message from you with its changed line.
10. Card rows lead somewhere as a whole: the row is the link, it lights on hover and ends with `›`; blue is left to buttons. A place in code (`service.rs:61`) is the small mono tag; a destination (pipeline, findings, why) is a grey word. A card heading carries a pill for a state and a tag for a count.
11. Tabs: the map is pinned first and unclosable; file tabs are mono; an unsaved file carries an amber mark after its name and its close mark stays; a tab a session opened takes that session's colour. Views are never disabled: a view with nothing in it stays clickable and opens to an empty state that names the two doors.
12. The editor is Theia's; sett themes it, it does not redraw it. Information sits where IDEs put it: the gutter (change bars per line in the author's colour, glyphs), quiet hints in or after the line (counts on the declaration, inline blame on the caret line only, rust-analyzer's hints in the same pill), and underlines (a finding is an error-grade wavy underline on the span, a witness a highlighted span). No line is added to the code, no labelled chip sits in it, verbs never render in it. A symbol from another repo is italic in secondary ink. Syntax colours are the `syntax.*` tokens: seven classes at one CIELAB lightness, 7:1 or better in both themes, hues in the gaps between the session colours; comments are mute. The Theia colour theme is generated from those tokens by the tokens build (`@tau-rs/sett-tokens/sett-theme.light.json` and `.dark.json`); the decoration classes are `@tau-rs/sett/editor.css`.

## The map

Terms: a **unit** is a crate or app on the repo board; a **node** is its box, shown at a **tier** (mini · chip · card · sheet) read from its on-screen width; a **port** is what a unit exposes or needs, of a **kind** (rpc, http, cli, topic, crate, sql, pub, redis, fs, tty, declared); the **rail** is the fixed-order list of ports on a unit's flat side; **columns** (driving · domain · driven) hold the **areas** and **items** inside an open unit.

1. **Map first.** The camera is never hijacked: wheel/pinch zoom and drag pan, at every level. Semantics happen by action (click = focus, double-click = open/enter, Esc = up) or by on-screen size, never by a step machine. The tier switches at `map.threshold.*` with a `hysteresis` band before folding back.
2. **Nothing on the layer above moves because you looked closer.** No re-layout on focus; neighbours stay, unrelated ones recede: a node to mute ink and a faint border (its text stays readable), an edge or a dot to `map.far` opacity. Off-view neighbours get border hints (`sett-hint-chip`), grouped when they would overlap, gone the moment they are seen.
3. **Fold, never shrink.** One text size per level. Less room means fewer rows and a `+n`. A node never resizes itself: the camera moves (`zoom`), and the rows swap with one `tier-swap` cross-fade.
4. **Open in place.** A unit opens inside its node on the same board; code opens in a tab of `sett-tabbar`, only by double-click. There is no layer between repo and unit.
5. **Edges carry no labels at rest.** The port row says what and how much; colour and stroke are the kind (`map.kind.*`); the arrow says who uses whom; the line stops `map.size.arrow` before the head; an edge never crosses its own node; a column-skipping link takes the channel below the columns, in its own lane. The `flow` dash runs on the selected unit's edges only.
6. **Externals are an interface, not a column.** Rails on the flat sides of the unit, sections in a fixed order (platform services · third-party services · events · data stores · os · libraries), headers lowercase and mute; a neighbour's matching port is wired straight to ours.
7. **Ports dock, layout wins.** A port always docks; when the neighbour is on the wrong side, the edge takes a detour around the card rather than moving anything.
8. **Chrome docks.** Nothing floats over the drawing: the panel is docked right and its first row is the transient status line (well tint, 1.9 s or the next action); there is no toast; the legend is on demand; the port colours are the legend the rest of the time.
9. **Keyboard.** Esc: tab → unit → focus → level. ↩ open/enter. `f` fit. `o` toggle the inside. Focus-visible rings on every interactive element.
10. **Provenance is visible.** Declared things are dashed (`map.kind.declared`) and say so; illustrative data says so in the tagline; every contract cites a witness `file:line`.

Rejected, keep out: stepped zoom · Bring & Go (moving neighbours to the ports) · edge labels at rest · an outbound column of boxes · floating inspector cards · ghost neighbours arranged callers-left / dependencies-right · a level change between repo and unit · zoom-to-code · a distinct card design per tier · a toast · a node animating its own box · hover transitions · uppercase eyebrows.

## Glyph vocabulary

`✓` done · `●` running · `⏸` paused · `✋` stepped in · `≠` deviation · `!` asks · `·` pending · `⚠` finding. Unicode, sans, in a 12 px column. No icon font.

## Components (v0.1)

chip · frame · selector · session-card · thread (msg, tool, changed, question, deviation, verbs, composer) · map (node, port-row, rail, op-row, area, item, column, edge, link, hint-chip, ghost, panel, position, minimap, crumb, back, cue, code-page, contract-card, legend) · editor inlays · cards (fix, delta, impact, checklist, pipeline, result, what's-new) · split-button · gated-button · tabbar · seg · overlay-toggles · funnel.

Reference rendering: `design/arch-design-system.html` (the page this file was extracted from). Where the page and this file disagree, this file wins.
