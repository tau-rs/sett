# ADR 0002 · the map moves: presence, response, events

Date: 2026-10-02 · Status: accepted · Amends ADR 0001 decision 3 (motion budget) · Ledger: #52

## Context

ADR 0001 kept motion to a camera fit, a tier cross-fade and a flow dash, with no hover transitions. Reviewing the inside of a unit with real agents on it, the map read as dead: nothing said who was working where, and state changes snapped. The owner asked for a map whose elements feel alive without costing readability. Each candidate motion was built, shown alone and in collision with the others, in both themes, and judged.

## Decision

1. **Names never move, fade or resize.** Motion lives in rings, a sheen behind the text, dots, lines and counters.
2. **Three families**, each with one job: presence (an agent is here: breathing ring, sheen, badge), response (to the hand: hover, select, fold), events (one-shot: change flash, finding pop, the agent's move).
3. **An agent's move is a jump rendered as a pulse.** A wave closes in on what it leaves; what it reaches blooms and sends two waves in its own shape. Nothing crosses the space between.
4. **One living mark per agent, on the nearest visible thing**: item, folded area's badge, unit's box, hint pill at the edge. Selection follows the same rule.
5. **Every signal has its own layer** around an item, so two never need the same pixels.
6. **Elements animate themselves.** The application only says which agent is live where; when that flips, the element plays its own departure or arrival.

The normative text is DESIGN.md § Motion; every duration and easing is a `motion.*` token.

## Consequences

- AGENTS.md's motion rule now points at DESIGN.md § Motion instead of naming three motions.
- The camera rule from ADR 0001 stands: a node never resizes itself.
- One honest consequence: there is more to keep consistent. The shared helpers in `packages/ui/src/map/motion.ts` exist so no element re-implements a pulse.
- Every motion has a still twin under `prefers-reduced-motion`: live is a thicker ring than touched; nothing else changes.
- Lane 2's elements were built before this and assert "never animates"; the node's badge and arrival pulse are a follow-up.
