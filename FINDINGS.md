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
| 2026-10-02 | shell page, daily flow | no page draws the **`detected` chip** of a `you` session (spec §4: "the git chip counts the changes; commit is one click from the chip; `Delegate the rest`") | sett draws it with a `sel` label, `changes detected · n files`, doors `delegate the rest` · `commit` (#63); to confirm or redraw |
| 2026-10-02 | session flow, shell page | the **gate of a group has no glyph** on any page (the pages write `judge` as a tag; DESIGN.md rule 7 writes `gate`); the session card's glyph column needs one per gate word | sett reads the gate through the existing glyphs: `✓` done · `●` running · `●` gate in amber · `!` failed in red · `·` waiting (#63); no new glyph |
| 2026-10-03 | map design spec, `sett-cue` | the cue's subject is gone: the PoC's bar counted toward "zoom in to enter" (`map.threshold.cue` → `enter`), and DESIGN.md opens a unit by double-click or ↩ only (rule 4, #65). What the bar counts toward in V1 is not said | `sett-cue` is built with the host's values (`value` · `from` · `threshold`) and no subject of its own; the stories count toward the next tier (#39). To name: the tier, the fold floor (#75), or drop the cue |
| 2026-10-03 | map design spec, lane 5 | the PoC page is in no workspace any more; position, back and cue have no readable drawing (the flow pages draw only a breadcrumb and a floating minimap) | looks taken from DESIGN.md and the tokens (#39); to confirm or redraw |

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
| 2026-10-02 | session | the session card's group row is `sett-plan-row kind="group"`, with its elements inside it and its sub-agents folded under the group | the Sessions view (lane C) owns `sett-group-row`; one name per element (#63) |
| 2026-10-02 | session | `stepped-in` is `taken-over` on the card's rows; the old value still draws for one release | step in is gone from the vocabulary (rule 9) |
| 2026-10-02 | plan, daily | a planned element's hint is a `sett-hint` pill after the code at its site, next to `◇`, not a right-aligned count | rule 12: the hint sits at the site; the counts stay the declaration's |
| 2026-10-03 | map | `sett-back` and `sett-crumb` sit in a docked strip on top of the map's pane, with the cue at its right end; the map design spec has the back pill floating top-left | map rule 8: nothing floats over the drawing (#39) |
| 2026-10-03 | map | the minimap is in the foot of `sett-panel`; `flows/map-focus.html` floats it bottom-right over the map | map rule 8 (#39) |
| 2026-10-03 | map | `sett-panel` is the map's own pane, inside the centre, beside the shell's inspector and never in it | the inspector is about the selection (shell rule 6); the panel is about where you are (#39) |
| 2026-10-03 | map | pointing eases a border or a background (`motion.hover`) on the back pill and a position row; #39 and the map design spec said "no hover transitions" | DESIGN.md § Motion (#52) replaced that line; text still never eases |
||||||| parent of e9a9746 (feat(ui): card layouts: checklist rows and how, result pills, plan delta, What's new doors, fix card (shell lane E))
| 2026-10-02 | review (merge) | the how is one plain line, `squash · from the forge's default · delete branch · archive session`; no radios, no checkboxes | the strategy is read from the forge, never chosen in arch (ADR 0016); the gated button under it is the only verb |
| 2026-10-02 | review (merged) | two pills on the result, `merged` in ok and `archived` plain; the page has one `merged · archived` | merged is the forge's fact, archived is arch's, restorable (ADR 0003) |
| 2026-10-02 | daily (What's new) | the door words `show · open · place · follow` are grey and end with `›`; the page draws them in blue | rule 10: the row is the link, blue is left to buttons |
| 2026-10-02 | daily (fix card), review | the fix card's hunk and a review hunk draw the sign from the line's kind; the text is the code only | one line element for both pages; a flagged line (the one a remark points at) keeps its `+` |
| 2026-10-02 | daily (Ask) | the `make it so → plan` door sits under the answer, not inside it; witnesses are mono tags that are links, `open all` after them | no button inside a message (thread rule 8: a reply ends with its changed line); a place in code is the small mono tag (rule 10) |
| 2026-10-02 | daily (commit) | the behind line reads `main moved 2 commits · with an agent · update myself`, agent door first and bold; the page puts `update myself` first | P-1 |
| 2026-10-02 | session (deviation) | the denied write names its check as `core · element scope`; the page reads `waves/scope` | the element-scope veto is the core's one rule in V1 (spec §8, §13.12); waves are a V2 policy |
| 2026-10-02 | session (gate failed) | the four doors are option rows under the question, `accept as is` carries `recorded override`, `later` stays; the hint is a one-line input under the question, not the composer | the gate asks like any ask (spec §6); the override is a record (ADR 0013) |
| 2026-10-03 | plan (shaping) | the planned elements are not painted amber on the Map; the plan reads in the left pane's rows, the intent bar and the `plan` toggle | `sett-item` has no planned look yet; the recipe composes, it adds none (#67) |
| 2026-10-03 | plan (shaping) | a planned element's row in the Sessions view is the sub-agent row with its dot in `sug`, under its group; the page writes `W1` / `W2` as a mark on a flat row | the Sessions view has no element row; groups are rows, not marks (#62, #67) |
| 2026-10-03 | plan (shaping) | no `↺ start over` in the planner's heading; the bar shows a plan chip `plan · refund flow · 5 elements · open`, drawn in the recipe | the inspector's heading holds words, verbs live in its fixed bar (rule 1); `sett-chip` has no `plan` kind (#67) |
