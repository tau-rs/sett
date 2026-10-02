# Findings for arch-design (from:sett)

What sett refuses from the arch pages or the spec, and what it cannot read one way. This file stands in for `arch-design` issues labelled `from:sett` until that repository is seeded (it is empty on 2026-10-02); each row becomes an issue there and is struck here when it does. The ledger of sett's own work stays on GitHub (#59 and its lanes).

Synced to: no ADR yet (`arch-design` holds none on 2026-10-02). DESIGN.md wins on look; the ADRs will win on behaviour and vocabulary.

## Refusals

| date | what the page or spec needs | why sett refuses | what would work instead |
|---|---|---|---|
| 2026-10-02 | the **Update dialog** of the git flow (spec §2 "still useful": Rebase · Merge · Stash · Shelve · Keep) | sett has no dialog, modal or toast and adds none (DESIGN.md P-2, rule 1) | an inspector layout, or a chip in the bar carrying those verbs; sett builds nothing for it until it is redrawn |
| 2026-10-02 | **white text on amber** for the rail badges (shell page) | about 2:1 in dark, under the 4.5:1 gate | the badge's text is `paper`, shipped in lane B (#72) |

## Gaps (the pages or the spec say two things, or say nothing)

| date | where | gap | sett's call meanwhile |
|---|---|---|---|
| 2026-10-02 | spec §6, shell page | **"step in"** survives as the gate chip's verb; the owner's correction and §4 list the bar's verbs as answer · open · take over · commit · merge | the gate chip's verb is `open` (#72, #73) |
| 2026-10-02 | shell page and the four flow pages, editor line 10 | `//! @arch area: store` is still drawn; spec §13.4 drops the annotation (areas come from the module tree and `.arch/areas.toml`) | no story shows an `@arch` line (#77); the pages should drop it |
| 2026-10-02 | spec §5, map | the **fold floor** sentence reads three ways with three different looks | not built; #75 waits for the owner's pick |
| 2026-10-02 | spec §13.7, §13.10, §13.19, §13.22 | no page renders the new states: `plan · none · hand-made branch`, the `resolve` element, `n crates guessed`, `n bins not analyzed` | sett took the looks on #77 (plain checklist row; `⇄` in amber; amber and mute states on the status bar's Map item, linked to Checks); to confirm or redraw |
| 2026-10-02 | shell page | plugin items (chip kind, status-bar count, Plugins tab) and presence pills are still drawn; spec §8 has no plugin system in V1 | not built; names reserved (#66) |
| 2026-10-02 | `arch-fixtures` (handoff §7) | the repository is empty; stories cannot load `fixtures-for-ui/` | stories use sett's own fixtures (ripgrep, zero2prod, zed), to export (#70) |
| 2026-10-02 | fixtures, links | a layered unit's links are stored leaf → public, a hexagon's user → used; one convention is needed before links are drawn | #38 |
| 2026-10-02 | analyser output | lane 4 needs a kind per link and how the analyser knows it; `sett-item` needs the kinds const · static · alias · union | #69, #68 |

## Deviations (what sett changed from the pages, and why)

| date | page | sett draws | why |
|---|---|---|---|
| 2026-10-02 | shell | the planning frame **dashed amber**, not solid amber | solid amber is the waiting frame's picture for anyone with reduced motion (#60) |
| 2026-10-02 | shell | the status bar on `bg`, not `well` | DESIGN.md keeps accent words off `well` |
| 2026-10-02 | shell | no lock button on the scope line; `🔒` only when locked | the scope line is an indicator, never a control |
| 2026-10-02 | shell | the bottom panel's tag is `sett-bottom-panel` | the map owns `sett-panel` (#39) |
| 2026-10-02 | shell | 10.5 px instead of 9 to 10 px on badges and rail labels | the type scale starts at 10.5 |
| 2026-10-02 | shell | the lock inside the selector's box; `main` has a neutral dot; a plan is one amber box `plan · refund flow` | spec §4; no `main › plan › …` crumb |
| 2026-10-02 | map | a closed node has no foot at all: `▾ open` and `enter ›` both go | "enter" was the PoC's jump to a level DESIGN.md rejects (#65) |
| 2026-10-02 | map | layer labels fall left to right `L4 · public api … L0 · leaf` | layers read public API left, leaves right (#74) |
| 2026-10-02 | shell, session, plan | the Sessions view reads `group 1`, `gate · group 1 → group 2`; the pages still read `Lane W1`, `Gate W1 → W2` | the owner's vocabulary: group and gate; waves are a V2 policy (#62) |
| 2026-10-02 | shell | the new-session door reads `+ new session · delegate`; the pages read `· manual or delegate` | a you session is detected, never declared (LEFT-7) |
| 2026-10-02 | sessions wireflow | the full-paths toggle (☰) sits beside the `changed · all files` seg, not in the first stage's header | a button inside a `tree` fails the a11y gate (`aria-required-children`); one setting per list matches "remembered per session" (#62) |
| 2026-10-02 | shell | a sub-agent row shows a dot in the sub shade only, no glyph run or guide line | a 24 px row with a name and a state tag has no room for the card's idiom (#62) |
| 2026-10-02 | shell | on a selected row the status letter and tone words go `ink` | `bad` and session colours on the `sel` tint are 4.3:1 in dark (#62) |
