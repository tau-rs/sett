/**
 * The board's line coordinator: the edges under one positioned parent are
 * routed together, so trunks, joins and tracks are decided once for all of
 * them (the board analogue of what `sett-sheet` does for links; there is no
 * board element). It rides the shared line watcher and re-routes only when a
 * box it depends on moved.
 *
 * Ends resolve by `key`: the unit (a `sett-node`), its port row when the card
 * shows it (the line docks on the row's dot), else the hint pill that stands
 * in for an off-screen unit (the line ends on the pill, #56 step 3). When a
 * pill is on the board, lines stay inside the window: the nearest ancestor
 * that clips.
 */
import { base } from '@tau-rs/sett-tokens';
import { boardRoutes, type BoardEdge, type BoardEnd, type BoardSide } from './board-routes.js';
import { boxIn, scaleOf, selectorFor, signature, unwatch, watch, type Watched } from './lines.js';
import type { Box, Route } from './routes.js';

const TRACK = parseFloat(base.map.size.track);

/** what the coordinator needs from an edge */
export interface BoardLine extends HTMLElement {
  from: string;
  to: string;
  fromPort?: string;
  toPort?: string;
  route?: Route;
}
/** what it needs from a hint pill: the keys it stands for and the border it sits on */
export interface BoardPill extends HTMLElement { keys: string[]; side: 'left' | 'right' | 'top' | 'bottom' }

/** a pill on the right border is reached from its left, and so on */
const PILL_DOCK: Record<BoardPill['side'], BoardSide> = { right: 'L', left: 'R', top: 'B', bottom: 'T' };

class Board implements Watched {
  readonly lines = new Set<BoardLine>();
  private seen = '';
  constructor(readonly host: HTMLElement) {}
  /** an edge came or went: route again even if no box moved, routes are handed out by position */
  invalidate() { this.seen = ''; }

  measure() {
    const host = this.host;
    if (!host.isConnected || !this.lines.size) return;
    const origin = host.getBoundingClientRect(), scale = scaleOf(host);
    const box = (el: Element) => boxIn(el, host, origin, scale);
    const nodes = [...host.querySelectorAll('sett-node')].filter((n) => !n.parentElement?.closest('sett-node'));
    const pills = [...host.querySelectorAll('sett-hint-chip')] as BoardPill[];
    const ghosts = [...host.querySelectorAll('sett-ghost')];
    const pillBoxes = new Map(pills.map((p) => [p, box(p)]));

    const end = (key: string, port: string | undefined, side: 'from' | 'to'): BoardEnd | undefined => {
      const pill = pills.find((p) => p.keys?.includes(key));
      if (pill) {
        const b = pillBoxes.get(pill)!, s = PILL_DOCK[pill.side] ?? 'L';
        const dock = s === 'L' ? { x: b.x, y: b.y + b.h / 2 } : s === 'R' ? { x: b.x + b.w, y: b.y + b.h / 2 } : s === 'T' ? { x: b.x + b.w / 2, y: b.y } : { x: b.x + b.w / 2, y: b.y + b.h };
        return { box: b, dock, side: s };
      }
      const unit = host.querySelector(selectorFor(key));
      if (!unit) return undefined;
      const b = box(unit);
      const row = port ? unit.querySelector(selectorFor(port)) : null;
      const dot = row?.shadowRoot?.querySelector('[part~="dot"]');
      if (dot) {
        const d = box(dot);
        if (d.w > 0) {
          // the line meets the dot's outer edge: needs on the right border, exposes on the left
          const right = side === 'from';
          return { box: b, dock: { x: right ? d.x + d.w : d.x, y: d.y + d.h / 2 }, side: right ? 'R' : 'L' };
        }
      }
      return { box: b };
    };

    let within: Box | undefined;
    if (pills.length) {
      let w = host.parentElement;
      while (w && getComputedStyle(w).overflow === 'visible') w = w.parentElement;
      if (w) within = box(w);
    }
    const lines = [...this.lines];
    const edges: BoardEdge[] = [];
    const ends = lines.map((l) => [end(l.from, l.fromPort, 'from'), end(l.to, l.toPort, 'to')] as const);
    const obstacles: Box[] = [...nodes.map(box), ...pillBoxes.values(), ...ghosts.map(box)];
    const isPill = (e: BoardEnd) => [...pillBoxes.values()].includes(e.box);
    const seen = (e: BoardEnd) => !within || isPill(e) || (e.box.x < within.x + within.w && e.box.x + e.box.w > within.x && e.box.y < within.y + within.h && e.box.y + e.box.h > within.y);
    // with pills on the board, a line is drawn when its ends are in the window or on a pill, and not pill to pill
    ends.forEach(([a, b], i) => { if (a && b && seen(a) && seen(b) && !(isPill(a) && isPill(b))) edges.push({ id: String(i), from: a, to: b }); });
    const sig = `${signature(obstacles)}|${within ? signature([within]) : ''}|${edges.map((e) => `${signature([e.from.box, e.to.box])}:${e.from.dock?.x},${e.from.dock?.y}:${e.to.dock?.x},${e.to.dock?.y}`).join(';')}`;
    if (sig === this.seen) return;
    this.seen = sig;
    const routes = edges.length ? boardRoutes({ obstacles, edges, spacing: TRACK, within }) : new Map();
    lines.forEach((l, i) => {
      const r = routes.get(String(i));
      l.route = r ? { points: r.points, branches: r.branches, backward: false } : undefined;
    });
  }
}

const boards = new Map<HTMLElement, Board>();
/** an edge joins the board of its parent; the first one wakes the watcher for it */
export function joinBoard(line: BoardLine): void {
  const host = line.parentElement;
  if (!host) return;
  let b = boards.get(host);
  if (!b) { b = new Board(host); boards.set(host, b); watch(b); }
  b.lines.add(line);
  b.invalidate();
}
export function leaveBoard(line: BoardLine): void {
  for (const [host, b] of boards) {
    if (!b.lines.delete(line)) continue;
    b.invalidate();
    if (!b.lines.size) { unwatch(b); boards.delete(host); }
  }
}
/** how many boards are being followed; for tests */
export const boardsWatched = (): number => boards.size;
