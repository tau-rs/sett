# sett · the map · design decisions

Date: 2026-09-28. Source: the arch map PoC handoff (values and behaviour) reviewed against DESIGN.md, HANDOFF.md and the tokens in `packages/tokens/src`. Seven conflicts were settled with the visual companion on real `sett.css`; the screens are under `.superpowers/brainstorm/` (gitignored) and the captures under `.context/`.

## Plain summary

The map (the repo board, its units, and what is inside a unit) becomes a set of Lit elements in sett, reversing the earlier "map primitives are values only" rule. The PoC keeps its geometry, sizes, thresholds and kind semantics. Where the PoC and sett disagree on look, sett wins on four points: no toast, lifted dark accents, lowercase headers, and the motion budget. Where sett's older tokens disagree with the PoC on material, the PoC wins: the map sits on the cool chrome grey with tinted columns, and the warm `map.*` tokens are removed.

## Decisions

| # | question | decision | why |
|---|---|---|---|
| 1 | map as DOM or values only | **Lit components**; ADR reverses DESIGN.md rule 6, `tokens.rs` stays for a future GPU layer | the PoC validated DOM on ripgrep, zero2prod and Zed; the handoff asks for Lit |
| 2 | `sett-toast` | **dropped**; a transient message is the first row of `sett-panel`, well tint, cleared after 1.9 s or on the next action | AGENTS.md forbids toast; P-2 says nothing pops up; rule 8 says chrome docks |
| 3 | how a unit changes tier | **camera only**: 300 ms fit on double-click, continuous on wheel/pinch; a box never resizes itself; tier chosen from on-screen width with a 150 ms cross-fade on the row swap; hysteresis band around each threshold | the box growing on its own read as a slide; the fade was preferred to a snap when seen at quarter speed |
| 3b | flow dash on edges | **selected unit's edges only** | all lit edges turn a hub's neighbourhood into noise; never loses direction when the head is off-screen |
| 4 | dark accents | **sett's lifted values** (sel #5B95E0 · ok #4DB388 · sug #E0A63A · bad #E0665C); PoC values reported back as a deviation | PoC dark accents are 2.4:1 to 4.4:1 on dark paper, all under 4.5:1; sett's pass on paper and bg. Accent text never sits on the well tint (sel 4.4:1, bad 4.0:1 there) |
| 5 | section headers | **lowercase, mute, no letter-spacing** | DESIGN.md type rule holds; one typographic voice for map and chrome |
| 6 | map surface | **cool `bg` board, tinted columns** (`surface.driving/domain/driven/outbound/code` from the PoC); warm `map.*` tokens removed; DESIGN.md opening line rewritten | the PoC is source of truth for values; its tints were picked against the cool grey |
| 7 | naming collisions | ghost neighbour = `sett-ghost`; tab strip reuses `sett-tabbar` + `sett-tab`; border hint = `sett-hint-chip` | no existing element renamed |

## Motion after this spec

DESIGN.md's allowed list becomes: `frame.live`, `frame.waiting`, `item-pulse`, `zoom` (300 ms camera, was `zoom(v2)`), `tier-swap` (150 ms cross-fade), `flow` (1.1 s dash on the selected unit's edges). No hover transitions. All off under `prefers-reduced-motion`.

## Tokens to add

- `surface.driving / domain / driven / outbound / code`, light and dark, from the handoff table.
- `kind.<name>.color` and `kind.<name>.stroke` (DTCG `strokeStyle` with `dashArray`) for rpc, http, cli, topic, crate, sql, pub, redis, fs, tty, declared; colours alias the base palette, `pub` aliases `session.yk.main`.
- `method.get / post / put / patch / delete` aliasing ok / sel / sug / sug / bad; weight 600, 10 px, 44 px column.
- `status.finding / session / smell / entry / port / external` per the handoff.
- `size.map.*` (node.chip 180×110, card.interface 440, card.open 760, port.row 24 / 20, op.row 19, rail 300, column 220, gutter 26, item.row 22, item 18, area.header 26, area.folded 30, arrow 8, halo 2.6 / 3.5, hint.radius 14, minimap 276×120, panel 300, tabs 30, dot 9).
- `threshold.map.*` (lod.mini 110, chip 380, card 760, open 900, enter 900, cue 560, fold.floor 0.7, hint.group 34 / 150, op.fold 6) plus a hysteresis value per threshold.
- `motion.zoom` 300 ms with easing `cubic-bezier(.2,.7,.2,1)`, `motion.tier-swap` 150 ms, `motion.flow` 1.1 s.
- `radius.map.node 6`, `radius.map.hint 14`, `radius.map.code 8`; `shadow.map.focus`, `shadow.map.card`.
- Remove `map.paper / grid / item / itemStroke / itemInk / areaStroke / areaInk / link / linkLit / external / faded-opacity`; `faded-opacity` becomes `opacity.map.far` = 0.28.

## Components

As listed in the handoff, with these substitutions: no `sett-toast`; `sett-frame` (ghost) → `sett-ghost`; `sett-tabs` → existing `sett-tabbar`. One skeleton per thing, tiers as attributes. Stories per tier and state on the three fixtures, plus a "kinds" story rendering the kind table as ports, edges and chips together.

## Lanes

```
lane 0  ADR + issues
lane 1  tokens + DESIGN.md "the map" + fixtures JSON + gap list
  ├─ lane 2  sett-node · sett-port-row · sett-rail · sett-op-row
  ├─ lane 3  sett-area · sett-item · sett-column
  ├─ lane 4  sett-edge · sett-link · sett-hint-chip · sett-ghost
  ├─ lane 5  sett-panel · sett-position · sett-minimap · sett-crumb · sett-back · sett-cue
  └─ lane 6  sett-code-page · sett-contract-card · sett-legend
```

Lanes 2 to 6 are independent once lane 1 merges. Every map story must pass the a11y gate from PR #32 in both themes.

## Known gaps to report to the arch chat

- The PoC artifact is not readable from this account; fixture data and any value not in the handoff must be pasted or exported.
- PoC dark accents replaced by sett's (decision 4).
- PoC section headers set lowercase (decision 5).
- PoC floating toast replaced by a panel status line (decision 2).
- Flow dash scoped to the selected unit (decision 3b).
