---
name: sett
version: 0.13.0
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
  breath: 2.8s
  allowed: [frame.live, frame.waiting, map.presence, map.response, map.events]
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
- On the map, one text size per level, and it never scales: a name inside a unit is 12 px mono, the same size as the area header above it. Scale is handled by folding, never by shrinking; a name too long for its box ends in an ellipsis.
- Weights: 400 body, 500 names and active tabs, 600 headings and primary links. No bold identifiers.
- Labels are lowercase. No uppercase eyebrows, no letter-spacing.

## Spacing, radius, stroke

- 4 px grid. Radii: 3 items and tags, 4 chips, 6 cards, 8 nodes and messages, 10 panes and the frame.
- Strokes: 1 hairline, 1.6 lit (selected item and its links), 3 the frame.

## Motion

Names never move, fade or resize. Life goes into what surrounds them: rings, a sheen behind the text, dots, lines, counters. Every motion has a still twin under `prefers-reduced-motion`, and nothing else may animate.

**Chrome.** The live frame (session gradient, 6 s rotate) and the waiting frame (amber pulse, 1.6 s). The gradient never leaves the frame. Every other frame state is still: editing, collision, planning. Pills and tags never animate. A session's dot breathes while its session is working, wherever that dot sits.

**Map · presence** (always on, slow, `motion.breath`). The ring of an item an agent is working on breathes, never below `map.presence.breathMin`, and a soft sheen in the session's colour sweeps across the item; the item's own colour stays visible under it. The session's badge keeps the same beat; different sessions are offset so three agents read as three. A ring left on an item touched earlier is thin, still, and quieter than any live ring.

**Map · response** (to the hand, fast). Pointing eases the border (`motion.hover`) and turns the item's links blue, together with the item at the other end. Selecting draws the connections outward (`motion.draw`); only then do the `flow` dashes travel, and on the selection alone. Folding eases shut (`motion.fold`) and the arrow turns. The camera fit is `zoom`; a node never resizes itself; its rows swap with `tier-swap`.

**Map · events** (one-shot). A change flashes one ring outward (`item-pulse`). A fixed finding eases back to plain and its count pops out (`motion.pop`). An agent's move is a jump, rendered as a pulse: leaving, a wave closes in on the thing and is swallowed (`wave-in`) and an item cools to its still ring (`cool`); arriving, the thing blooms (`bloom`), two waves in its own shape roll outward (`wave-out`), its badge ignites (`ignite`), and an item gets one quick bright sheen (`kick`). Nothing crosses the space between.

**Where it lands.** One living mark per agent, on the nearest thing you can see: the item; else the folded area's badge; else the unit's box and its badge; else the hint pill at the board's edge. Your selection follows the same rule: a folded area that hides it shows a blue count, and a dock on its border where the links plug in.

**Layers, from the inside out.** The item's own colour · the sheen · your selection, tight to the box · the session ring, one step out (`map.size.ringGap`) · the change flash, past everything. Two signals never need the same pixels. Two agents on one item split one ring; rings never stack.

## Rules the components encode

1. Verbs live in a pane's fixed bar or in a chip. There is no modal component. A menu is an anchored disclosure under its selector: it never dims or traps the screen and closes on Esc, on a click outside, or when a row is chosen. That is allowed under P-2; a popup that blocks is not.
2. A blocked or waiting state is a `pill` wherever its subject is named: selector, menu row, gated button reason, session-card row. Same pill, same words.
3. Agent door first and bold in every pair, manual second and plain; the "me first" setting swaps both. Verbs are lowercase. A done chip keeps full contrast: its kind label turns ok with `✓`, and it gains a plain `dismiss` verb. A blocked primary button (the gated merge, hand back before the note) is a dashed blue outline with blue text at full contrast, never a faded fill; its reason sits under it as pills that link to what unblocks it.
4. Chips and cards separate with `·`; identifiers are mono.
5. Dark mode is required from day one.
6. The map is DOM (ADR 0001): `sett-*` elements read the `map.*` tokens as CSS variables. `tokens.rs` is still generated from the same DTCG source for any GPU layer, but nothing in sett depends on one existing. The map's own rules are the section "The map" below.
7. Session-card rows: the glyph carries the state; the right cell says only what the glyph cannot (`asks · n`, `paused`, `deviation`, `resolve`, `you`) in plain secondary ink, never a pill and never the session's own name. The current row takes the session's tint. A **group** row is a lane of the plan with its gate; its right cell reads the gate in the same plain words: `done` · `running` · `gate` · `failed n/m` · `waiting`. A **resolve** row is the element a conflict adds to the plan, both intents in context: `⇄` in `sug`, since it needs a hand, not a fix. Sub-agents fold under their group (under their step when the plan has no groups), folded by default, with the count and a glyph run on that row and one continuous guide line in the sub shade when open.
8. Thread messages: every message opens with an author line (a dot and the name at 11 px medium in the author's colour, then the time). Yours sit on the right in the selection tint; agents on the left outlined in their colour; sub-agents outlined in the sub shade with the sub-shade dot, the name still in the session's main colour (the sub shade is not a text colour). Every agent reply ends with a `changed · what` or `no change` line.
9. Taking over is two acts: pause, then take over one element. Verbs are words, never glyphs: running `pause · stop`, paused `resume · take over · stop`, taken over `stop`. `✋` is a state glyph on the session card only. Handing back is written in the composer, which becomes the hand-back note while you hold an element; the note lands in the thread as a message from you with its changed line. **Focus** and **Lock** are the two scope verbs and are not taking over: Focus changes what the shell is about, Lock pins it, and neither changes who writes (see "The shell").
10. Card rows lead somewhere as a whole: the row is the link, it lights on hover and ends with `›`; blue is left to buttons. A place in code (`service.rs:61`) is the small mono tag; a destination (pipeline, findings, why) is a grey word. A card heading carries a pill for a state and a tag for a count.
11. Tabs: the map is pinned first and unclosable; file tabs are mono; an unsaved file carries an amber mark after its name and its close mark stays; a file tab is underlined in the colour of the scope it was opened in: the session's, or `sel` for you. Views are never disabled: a view with nothing in it stays clickable and opens to an empty state that names the two doors.
12. The editor is Theia's; sett themes it, it does not redraw it. Information sits where IDEs put it: the gutter (change bars per line in the author's colour, glyphs), quiet hints in or after the line (counts on the declaration, inline blame on the caret line only, rust-analyzer's hints in the same pill), and underlines (a finding is an error-grade wavy underline on the span, a witness a highlighted span). No line is added to the code, no labelled chip sits in it, verbs never render in it. A planned element is a gutter glyph and a hint pill at its site, in `sug`, never an inserted line. Your own change bars are `sel`. A symbol from another repo is italic in secondary ink. Syntax colours are the `syntax.*` tokens: seven classes at one CIELAB lightness, 7:1 or better in both themes, hues in the gaps between the session colours; comments are mute. The Theia colour theme is generated from those tokens by the tokens build (`@tau-rs/sett-tokens/sett-theme.light.json` and `.dark.json`); the decoration classes are `@tau-rs/sett/editor.css`.

## The shell

Terms: the **scope** is the worktree the shell is about: `main`, a focused session's worktree, a `you` session (your own work, detected from your writes, never declared), or a plan being shaped; **Focus** makes a session the scope and **Lock** pins a focus; a **group** is a set of plan elements run together and a **gate** is the checks that run when it ends; the **bar** is the one line on top; the **activity rail** picks what the left pane shows; the **inspector** is the right pane; the **bottom panel** is the one under the centre. Sizes are `size.shell.*`.

1. **One bar.** Brand, repo › scope selector, chips, Ask. A chip sits in the bar only if it carries a verb. Nothing is written twice.
2. **The activity rail never hides.** Three labels, Sessions · Files · Findings, each a glyph over a horizontal label: never icons alone, never vertical text. Its badges (asks you, a new blocking finding) stay when the left pane is closed. When a session is the scope, the active label carries a bar in that session's colour.
3. **The scope is written in three places, with the same words and the same colour**: the scope line at the top of the left pane, the selector in the bar, the frame. `main` is neutral; `w1 · refund flow` takes the session's colour; `you · fix-pool-size` takes `sel`, with `🔒` when locked; `plan · refund flow` takes `sug`. The scope line is an indicator, never a control.
4. **Looking is not jumping.** A click selects and shows; only a visible Focus changes the scope, and Esc gives it back. Switching views never changes it.
5. **The frame says the state of the scope**: idle, grey · live, the session gradient · waiting, amber pulse · editing, `sel` (your uncommitted work) · collision, `bad` (a collision or a deviation) · planning, amber dashed. Planning is dashed because the waiting frame's still twin is solid amber, and the two must differ with motion off; dashed already means "not real yet" on the map and on a blocked button. Focus, the `sel` ring inside the frame, is the selection and never a state of the scope.
6. **The inspector is about the selection.** The session card lives there, with its verbs bar and the composer; it is never pinned in the left pane.
7. **The bottom panel lists what already exists**: Findings · Checks · Terminal · What's new, nothing else. Closed, it is a strip of its tabs with their counts. Every finding and check row names its origin.
8. **The status bar is counts and states**, each a link to the view that owns it; never a verb. What the analyser knows least is a state there too, on the Map item: `n crates guessed` in `sug` (syntax-level facts, warns, never blocks), `n bins not analyzed` in `mute` (outside the unit); the item leads to the Checks tab, which holds the reason.
9. **Colour is the only presence mark on a file**: a bar in the session's colour on a file an agent is writing; the writer's name appears only when that session is the scope.

## The map

Terms: a **unit** is a crate or app on the repo board; a **node** is its box, shown at a **tier** (mini · chip · card · sheet) read from its on-screen width; a **port** is what a unit exposes or needs, of a **kind** (rpc, http, cli, topic, crate, sql, pub, redis, fs, tty, declared); the **rail** is the fixed-order list of ports on a unit's flat side; **columns** hold the **areas** and **items** inside an open unit, under one of two column rules: hexagon (driving · domain · driven) or layers (public API · internals · leaves).

1. **Map first.** The camera is never hijacked: wheel/pinch zoom and drag pan, at every level. Semantics happen by action (click = focus, double-click = open/enter, Esc = up) or by on-screen size, never by a step machine. The tier switches at `map.threshold.*` with a `hysteresis` band before folding back.
2. **Nothing on the layer above moves because you looked closer.** No re-layout on focus; neighbours stay, unrelated ones recede: a node to mute ink and a faint border (its text stays readable), an edge or a dot to `map.far` opacity. Inside a unit the same holds for one area: its name focuses it (the arrow beside it folds), its links open down to the items, in and out, and the items they reach keep full ink; every other item and area recedes by colour, never by opacity, every other line goes to `map.far`, a finding never recedes, and Esc or the name again leaves. Off-view neighbours get border hints (`sett-hint-chip`), grouped when they would overlap, gone the moment they are seen.
3. **Fold, never shrink.** One text size per level. Less room means fewer rows and a `+n`. A node never resizes itself: the camera moves (`zoom`), and the rows swap with one `tier-swap` cross-fade. A folded area is a chip and what is under it moves up; the plugs of the items it hides sit on the chip's edge. Zooming out, an open unit keeps its place on the board and its areas fold, down to `map.threshold.foldFloor` of the scale it opened at; below that it closes to a card.
4. **Open in place.** A unit opens inside its node on the same board, by double-click or ↩ and by nothing else: a closed node has no foot, an open one keeps `▴ close`. Code opens in a tab of `sett-tabbar`, only by double-click or ↩: the page is the head (`file:line`, the unit) and the `callers` and `calls` portals around the editor, which stays Theia's (rule 12); without one the body is a read-only listing. There is no layer between repo and unit.
5. **Edges carry no labels at rest.** The port row says what and how much; colour and stroke are the kind (`map.kind.*`); the arrow says who uses whom; the line stops `map.size.arrow` before the head; an edge never crosses its own node; a column-skipping link takes the channel below the columns, in its own lane. The `flow` dash belongs to the selection alone; pointing at something turns its links blue, without dashes.
6. **Externals are an interface, not a column.** Rails on the flat sides of the unit, sections in a fixed order (platform services · third-party services · events · data stores · os · libraries · unresolved), headers lowercase and mute; a neighbour's matching port is wired straight to ours. Unresolved, always last, holds the externals without an owner; an item's unresolved links fold to one pill.
7. **Ports dock, layout wins.** A port always docks; when the neighbour is on the wrong side, the edge takes a detour around the card rather than moving anything.
8. **Chrome docks.** Nothing floats over the drawing: the panel is docked on the right of the map's pane and its first row is the transient status line (well tint, `map.statusHold` or the next action); back, the crumb and the cue sit in one strip on top of the pane, back first; the minimap is in the panel's foot, only when the map exceeds the viewport; there is no toast; the legend is on demand: a section of the panel under the position, folded to one row until asked for, and the place where links are filtered by family and by kind (a filter that is on is said on the folded row); the port colours are the legend the rest of the time.
9. **Keyboard.** Esc: tab → unit → focus → level. ↩ open/enter. `f` fit. `o` toggle the inside. Focus-visible rings on every interactive element.
10. **Provenance is visible.** Three confidences: *resolved* is firm ink, *guessed* (a crate the analyser could not type-check) is the lightest ink and warns, *declared* is dashed (`map.kind.declared`) and says so; areas come from the module tree and `.arch/areas.toml`, never from a line in source, so no story shows an `@arch` annotation; illustrative data says so in the tagline; every contract cites a witness `file:line`.
11. **Uses points left to right**, under both column rules: hexagon runs driving → domain → driven, layers runs public API → internals → leaves. Layers take the same tints by depth: the first column the driving tint, the last the driven tint, the ones between the domain tint. A link that points right to left is a smell and is drawn as one.
12. **Links have a grammar.** Inside a unit a link is a square line on a track in the gutter (`map.size.track` apart), one trunk per source item and family with a dot at each branch; a link inside a column runs beside it, never over a name. The line pattern is the family (`map.link.*`: solid *does* · dashed *promises* · dotted *knows* · dash-dot *around*), the head is the kind, a diamond at the start is ownership; the kind's name shows on hover only. The lighter the line, the less the analyser knows: *guessed* is lighter, *refers to* the lightest. A finding is red and heavier on any kind and never recedes. Links never carry presence: pointing turns an item's links blue with the item at the other end, selecting draws them outward and the `flow` travels on them alone, and a folded area that hides an end takes the line on its edge with a blue dock dot. At rest the sheet shows the **areas level**: one line per pair of areas, header to header, and nothing leaves an item. A stretch that carries two or more links is a double line (`map.size.bundle`, `bundleGap` inside), edges in `mute`, the inside in the hue of the column it leaves (`map.origin.*`); it branches like a pipe junction, passes over another with a halo, and a pair of exactly one link leaves it as that link's own line with a small dot. The summary is opened by hand, never by a mode: the arrow end opens that pair into its links, the shared stretch everything leaving the area, an opened line closes it; clicking items pins their links, several at once, and the rest recedes to `map.far`. Opening moves no other line. A finding stays item to item at every level; the plugs · areas · items switch is only the default for what was not opened by hand.
13. **Four overlays paint, none moves anything**: sessions · plan · findings · delta, each a toggle. Outline is the session (its ring), fill is the plan or the finding; an item may carry all four. A planned item is dashed amber on the amber tint, with its group in a plain tag: dashed is "not real yet", and that is what tells it from a port, which is solid. A finding outranks the plan; your selection keeps its solid line. In the delta, what is unchanged recedes by colour (mute ink, a faint line, never opacity), what is added or changed is drawn as it is, what is removed is a dashed ghost with its name struck through. A link cannot take the dashes, its pattern is its family: a planned link is amber and one step heavier on the amber tint band (`map.size.band`), keeping its pattern and head, which tells it from a topic wire, a thin amber line; a finding outranks it and the selection turns it blue over the band. In the delta a link is added, removed or unchanged: added is drawn as it is, removed is a ghost in the palest ink cut across its middle by two short strokes, unchanged recedes to `map.far` like any unrelated line. Like a finding, a planned, added or removed link stays item to item at every level, never summed into an area's line. While the plan or the delta is on, the legend keys it: a planned item and link; added, removed and unchanged.
14. **An item's name says its kind**, in one box for every kind: `subscribe()`, `impl PgSubscriberRepo`, `mod routes`, `register_extension!`. A trait is a step heavier, an external takes the external fill. A `const`, `static`, type alias or `union` has its Rust word written before the bare name by the item itself (`const SESSION_TTL`, `type PgTransaction`), and only that word takes a colour, its kind's in the editor: `syntax.constant` for the values a `reads` link ends on, `syntax.type` for the types. The name stays ink, and a receding item takes the word back to grey with it. Rejected: the whole name in a syntax colour, the keyword blue (blue is the selection, the entry and the pointed link).

Rejected, keep out: stepped zoom · Bring & Go (moving neighbours to the ports) · edge labels at rest · an outbound column of boxes · floating inspector cards · ghost neighbours arranged callers-left / dependencies-right · a level change between repo and unit · an `open` or `enter` link on a node · zoom-to-code · a distinct card design per tier · a toast · a node animating its own box · uppercase eyebrows · a text that moves or fades · a sliding gradient outside the frame · a ring, spark or wire travelling between items · a tint that hides an item's own colour · stacked rings.

## Glyph vocabulary

`✓` done · `●` running · `⏸` paused · `✋` taken over · `≠` deviation · `!` asks · `⇄` resolve · `·` pending · `⚠` finding · `🔒` locked scope. Unicode, sans, in a 12 px column. No icon font.

## Components (v0.1)

shell (activity-rail, scope-line, sessions-view, files-view, changes-list, intent-bar, inspector, hunk, bottom-panel, status-bar) · chip · frame · selector · session-card · thread (msg, tool, changed, question, deviation, verbs, composer) · map (node, port-row, rail, op-row, sheet, column, area, item, edge, link, bundle, hint-chip, ghost, panel, position, minimap, crumb, back, cue, code-page, contract-card, legend) · editor inlays · cards (fix, delta, impact, checklist, pipeline, result, what's-new) · split-button · gated-button · tabbar · seg · overlay-toggles · funnel.

Reference rendering: `design/arch-design-system.html` (the page this file was extracted from). Where the page and this file disagree, this file wins.
