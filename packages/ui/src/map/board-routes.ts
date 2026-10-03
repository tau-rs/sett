/**
 * Where the edges of a board run. Pure geometry: boxes in, polylines out.
 * Lines are horizontal and vertical only, on tracks `spacing` apart, in the
 * gaps between the boxes, never through one (DESIGN.md rule 5). What leaves
 * one dock shares a trunk and what reaches one dock joins before it, with a
 * dot where they part (the wiring-diagram grammar of `routes.ts`, settled for
 * the board on #56). A line that has to go back turns around the near end of
 * its own box: the shortest free way, nothing moves to make room (rule 7).
 *
 * A card names its docks (the port dots); a chip does not, and the router
 * places them: one trunk from the middle of a side, the sides facing across
 * columns and top/bottom inside one, arrivals spread along the side in the
 * order they come from.
 */
import type { Box, Pt } from './routes.js';

export type BoardSide = 'R' | 'L' | 'T' | 'B';
export interface BoardEnd {
  /** the box the line leaves or reaches: a unit, or the hint pill standing in for it */
  box: Box;
  /** where on the box's border the line docks; omitted, the router places it (a chip) */
  dock?: Pt;
  /** the side of the box the dock is on; given with `dock` */
  side?: BoardSide;
}
export interface BoardEdge { id: string; from: BoardEnd; to: BoardEnd }
export interface BoardInput {
  /** every box a line must go around: units, pills */
  obstacles: Box[];
  edges: BoardEdge[];
  /** `map.size.track` */
  spacing: number;
  /** the clearance kept around a box, defaults to `spacing` */
  margin?: number;
  /** keep every line inside this box (the window, when lines end on hint pills) */
  within?: Box;
}
export interface BoardRoute {
  /** from the start dock to the end dock */
  points: Pt[];
  /** where a trunk this line is on branches, or where lines into its dock join */
  branches: Pt[];
}

const DIR: Record<BoardSide, [number, number]> = { R: [1, 0], B: [0, 1], L: [-1, 0], T: [0, -1] };
const D = [[1, 0], [0, 1], [-1, 0], [0, -1]] as const;
/** the direction index a line leaves a side by; it arrives at a side moving the other way */
const OUT: Record<BoardSide, number> = { R: 0, B: 1, L: 2, T: 3 };
const OPP: Record<BoardSide, BoardSide> = { R: 'L', L: 'R', T: 'B', B: 'T' };
const BEND = 4, SHARED = 0.15, FOREIGN = 40, TOUCH = 1.5, TOUCH_BEND = 25;

const cx = (b: Box) => b.x + b.w / 2, cy = (b: Box) => b.y + b.h / 2;
const key = (p: Pt) => `${p.x},${p.y}`;

/** a chip's docks: the side by geometry, one trunk point per source side, arrivals spread */
function placeDocks(edges: BoardEdge[], spacing: number): Map<string, { from: Required<BoardEnd>; to: Required<BoardEnd> }> {
  const out = new Map<string, { from: Required<BoardEnd>; to: Required<BoardEnd> }>();
  const arrivals = new Map<string, { id: string; box: Box; side: BoardSide; at: number }[]>();
  const sideOf = (a: Box, b: Box): BoardSide => {
    const dx = cx(b) - cx(a), dy = cy(b) - cy(a);
    return Math.abs(dx) < a.w ? (dy > 0 ? 'B' : 'T') : dx > 0 ? 'R' : 'L';
  };
  const mid = (b: Box, s: BoardSide): Pt => (s === 'R' ? { x: b.x + b.w, y: cy(b) } : s === 'L' ? { x: b.x, y: cy(b) } : s === 'T' ? { x: cx(b), y: b.y } : { x: cx(b), y: b.y + b.h });
  for (const e of edges) {
    const fs = e.from.dock ? e.from.side ?? 'R' : sideOf(e.from.box, e.to.box);
    const ts = e.to.dock ? e.to.side ?? 'L' : OPP[e.from.dock ? sideOf(e.from.box, e.to.box) : fs];
    const from = { box: e.from.box, dock: e.from.dock ?? mid(e.from.box, fs), side: fs };
    out.set(e.id, { from, to: { box: e.to.box, dock: e.to.dock ?? { x: 0, y: 0 }, side: ts } });
    if (!e.to.dock) {
      const k = `${key(e.to.box)}|${e.to.box.w}|${ts}`;
      if (!arrivals.has(k)) arrivals.set(k, []);
      arrivals.get(k)!.push({ id: e.id, box: e.to.box, side: ts, at: ts === 'L' || ts === 'R' ? from.dock.y : from.dock.x });
    }
  }
  for (const list of arrivals.values()) {
    list.sort((a, b) => a.at - b.at);
    list.forEach((a, k) => {
      const f = (k + 1) / (list.length + 1), b = a.box;
      const dock = a.side === 'L' ? { x: b.x, y: b.y + b.h * f } : a.side === 'R' ? { x: b.x + b.w, y: b.y + b.h * f } : a.side === 'T' ? { x: b.x + b.w * f, y: b.y } : { x: b.x + b.w * f, y: b.y + b.h };
      out.get(a.id)!.to.dock = { x: Math.round(dock.x), y: Math.round(dock.y) };
    });
    // an arrival within a track of its source's level takes that level, so a near-straight line is straight
    for (const a of list) {
      const to = out.get(a.id)!.to, src = out.get(a.id)!.from.dock, horizontal = a.side === 'L' || a.side === 'R';
      const want = horizontal ? src.y : src.x, have = horizontal ? to.dock.y : to.dock.x;
      const lo = horizontal ? a.box.y : a.box.x, hi = horizontal ? a.box.y + a.box.h : a.box.x + a.box.w;
      const clear = list.every((o) => o === a || Math.abs((horizontal ? out.get(o.id)!.to.dock.y : out.get(o.id)!.to.dock.x) - want) >= spacing);
      if (want !== have && Math.abs(want - have) < spacing && want > lo + spacing / 2 && want < hi - spacing / 2 && clear) to.dock = horizontal ? { x: to.dock.x, y: want } : { x: want, y: to.dock.y };
    }
  }
  return out;
}

/** a binary heap of (cost, state) pairs in typed arrays; `pop` returns the state and leaves its cost in `top` */
class Heap {
  private f = new Float64Array(1024); private s = new Int32Array(1024); private n = 0;
  top = 0;
  get size() { return this.n; }
  clear() { this.n = 0; }
  push(fv: number, sv: number) {
    if (this.n === this.f.length) {
      const f = new Float64Array(this.n * 2), s = new Int32Array(this.n * 2);
      f.set(this.f); s.set(this.s); this.f = f; this.s = s;
    }
    const F = this.f, St = this.s;
    let k = this.n++;
    while (k) {
      const p = (k - 1) >> 1;
      if (F[p] <= fv) break;
      F[k] = F[p]; St[k] = St[p]; k = p;
    }
    F[k] = fv; St[k] = sv;
  }
  pop(): number {
    const F = this.f, St = this.s, sv = St[0];
    this.top = F[0];
    const n = --this.n, lf = F[n], ls = St[n];
    if (n) {
      let k = 0;
      for (;;) {
        const l = 2 * k + 1, r = l + 1;
        let m = -1, mf = lf;
        if (l < n && F[l] < mf) { m = l; mf = F[l]; }
        if (r < n && F[r] < mf) { m = r; mf = F[r]; }
        if (m < 0) break;
        F[k] = F[m]; St[k] = St[m]; k = m;
      }
      F[k] = lf; St[k] = ls;
    }
    return sv;
  }
}

/** the search's working memory, kept between calls: re-routing while panning allocates nothing */
let buf = { g: new Float64Array(0), prev: new Int32Array(0), stamp: new Int32Array(0), run: 0, heap: new Heap() };

export function boardRoutes({ obstacles, edges, spacing: S, margin = S, within }: BoardInput): Map<string, BoardRoute> {
  const docks = placeDocks(edges, S);
  // the grid: whole tracks around everything, padded so a line can go around the outermost box
  const xs = [...obstacles.flatMap((b) => [b.x, b.x + b.w]), ...[...docks.values()].flatMap((d) => [d.from.dock.x, d.to.dock.x])];
  const ys = [...obstacles.flatMap((b) => [b.y, b.y + b.h]), ...[...docks.values()].flatMap((d) => [d.from.dock.y, d.to.dock.y])];
  const pad = margin + 6 * S;
  // inside a window the grid is the window: re-routing while panning costs the window, not the board
  const x0 = within ? within.x : Math.min(...xs) - pad, x1 = within ? within.x + within.w : Math.max(...xs) + pad;
  const y0 = within ? within.y : Math.min(...ys) - pad, y1 = within ? within.y + within.h : Math.max(...ys) + pad;
  const gx = Math.floor(x0 / S), gy = Math.floor(y0 / S);
  const ni = Math.ceil(x1 / S) - gx + 1, nj = Math.ceil(y1 / S) - gy + 1;
  const blocked = new Uint8Array(ni * nj);
  for (const b of obstacles) {
    for (let i = Math.max(0, Math.ceil((b.x - margin) / S) - gx); i <= Math.min(ni - 1, Math.floor((b.x + b.w + margin) / S) - gx); i++)
      for (let j = Math.max(0, Math.ceil((b.y - margin) / S) - gy); j <= Math.min(nj - 1, Math.floor((b.y + b.h + margin) / S) - gy); j++) blocked[i * nj + j] = 1;
  }
  if (within) for (let i = 0; i < ni; i++) for (let j = 0; j < nj; j++) {
    const x = (i + gx) * S, y = (j + gy) * S;
    if (x < within.x || x > within.x + within.w || y < within.y || y > within.y + within.h) blocked[i * nj + j] = 1;
  }
  // who uses each track step and each track point: linked lists in typed arrays, most cells stay empty
  const segHead = new Int32Array(ni * nj * 2).fill(-1), nodeHead = new Int32Array(ni * nj).fill(-1);
  const useNext: number[] = [], useTrunk: number[] = [], useJoin: number[] = [];
  const ids = new Map<string, number>(), idOf = (k: string) => { let v = ids.get(k); if (v === undefined) { v = ids.size; ids.set(k, v); } return v; };
  const segKey = (i: number, j: number, ax: number) => ((i * nj + j) << 1) | ax;
  const push = (head: Int32Array, at: number, t: number, jn: number) => { useNext.push(head[at]); useTrunk.push(t); useJoin.push(jn); head[at] = useNext.length - 1; };
  /** 0: nobody · 1: only lines of this trunk or join · 2: another line */
  const who = (head: Int32Array, at: number, t: number, jn: number) => {
    let u = head[at], own = false;
    if (u < 0) return 0;
    for (; u >= 0; u = useNext[u]) { if (useTrunk[u] === t || useJoin[u] === jn) own = true; else return 2; }
    return own ? 1 : 0;
  };
  const N = ni * nj * 4;
  if (buf.g.length < N) buf = { g: new Float64Array(N), prev: new Int32Array(N), stamp: new Int32Array(N), run: 0, heap: buf.heap };
  const { g, prev, stamp, heap } = buf;

  /** the first track point outside the box's clearance, straight out from the dock */
  const outside = (end: Required<BoardEnd>) => {
    const b = end.box, d = end.dock;
    switch (end.side) {
      case 'R': return { i: Math.floor((b.x + b.w + margin) / S) + 1 - gx, j: Math.round(d.y / S) - gy };
      case 'L': return { i: Math.ceil((b.x - margin) / S) - 1 - gx, j: Math.round(d.y / S) - gy };
      case 'B': return { i: Math.round(d.x / S) - gx, j: Math.floor((b.y + b.h + margin) / S) + 1 - gy };
      default: return { i: Math.round(d.x / S) - gx, j: Math.ceil((b.y - margin) / S) - 1 - gy };
    }
  };

  function search(st: { i: number; j: number }, d0: number, en: { i: number; j: number }, dEnd: number, trunk: number, join: number) {
    const run = ++buf.run;
    const cost0 = (s: number) => (stamp[s] === run ? g[s] : Infinity);
    // the step cost on a free track is 1: a heuristic of 1 per step keeps the search narrow; it may skip a
    // shared stretch far off the straight way, which only costs a trunk joining a little later
    heap.clear();
    // plus the bends it must still take: one when the goal is off both axes, more when it is behind
    const h = (i: number, j: number, d: number) => {
      const di = en.i - i, dj = en.j - j;
      let b: number;
      if (di !== 0 && dj !== 0) b = 1;
      else if (di === 0 && dj === 0) b = d === dEnd ? 0 : 2;
      else { const want = di > 0 ? 0 : di < 0 ? 2 : dj > 0 ? 1 : 3; b = d === want ? (want === dEnd ? 0 : 1) : d === ((want + 2) & 3) ? 2 : 1; }
      return (Math.abs(di) + Math.abs(dj)) * 1.001 + b * BEND;
    };
    const s0 = (st.i * nj + st.j) * 4 + d0; g[s0] = 0; stamp[s0] = run; prev[s0] = -1; heap.push(h(st.i, st.j, d0), s0);
    while (heap.size) {
      const s = heap.pop(), f = heap.top, d = s & 3, c = s >> 2, i = (c / nj) | 0, j = c % nj;
      if (f - h(i, j, d) > cost0(s) + 1e-9) continue;
      if (i === en.i && j === en.j && d === dEnd) return s;
      for (let nd = 0; nd < 4; nd++) {
        if (nd === ((d + 2) & 3)) continue;
        const i2 = i + D[nd][0], j2 = j + D[nd][1];
        if (i2 < 0 || j2 < 0 || i2 >= ni || j2 >= nj) continue;
        if (blocked[i2 * nj + j2] && !(i2 === en.i && j2 === en.j)) continue;
        const bend = nd !== d ? BEND : 0, sk = segKey(i < i2 ? i : i2, j < j2 ? j : j2, nd & 1);
        const us = segHead[sk] < 0 ? 0 : who(segHead, sk, trunk, join);
        let cost = us === 0 ? 1 + bend : us === 1 ? SHARED + bend : FOREIGN + bend;
        const nk = i2 * nj + j2;
        if (nodeHead[nk] >= 0 && who(nodeHead, nk, trunk, join) === 2) cost += nd !== d ? TOUCH_BEND : TOUCH;
        const s2 = (i2 * nj + j2) * 4 + nd, g2 = g[s] + cost;
        if (g2 < cost0(s2)) { g[s2] = g2; stamp[s2] = run; prev[s2] = s; heap.push(g2 + h(i2, j2, nd), s2); }
      }
    }
    return -1;
  }
  function claim(cells: { i: number; j: number }[], t: number, jn: number) {
    for (let k = 1; k < cells.length; k++) {
      const a = cells[k - 1], b = cells[k], ax = a.i === b.i ? 1 : 0;
      push(segHead, segKey(Math.min(a.i, b.i), Math.min(a.j, b.j), ax), t, jn);
    }
    for (const p of cells) push(nodeHead, p.i * nj + p.j, t, jn);
  }

  // long lines first: they claim the tracks, the short ones go around them
  const order = [...edges].sort((p, q) => {
    const a = docks.get(p.id)!, b = docks.get(q.id)!;
    const len = (x: typeof a) => Math.abs(x.from.dock.x - x.to.dock.x) + Math.abs(x.from.dock.y - x.to.dock.y);
    return len(b) - len(a);
  });
  const raw = new Map<string, { pts: Pt[]; trunk: string; join: string }>();
  for (const e of order) {
    const { from, to } = docks.get(e.id)!;
    const trunk = key(from.dock), join = key(to.dock);
    const st = outside(from), en = outside(to);
    const tId = idOf(`t:${trunk}`), jId = idOf(`j:${join}`);
    const inGrid = (c: { i: number; j: number }) => c.i >= 0 && c.j >= 0 && c.i < ni && c.j < nj;
    if (inGrid(st)) blocked[st.i * nj + st.j] = 0;
    const goal = inGrid(st) && inGrid(en) ? search(st, OUT[from.side], en, (OUT[to.side] + 2) & 3, tId, jId) : -1;
    let pts: Pt[];
    if (goal < 0) {
      // nowhere free: the plainest square line, so something is drawn
      const a = from.dock, b = to.dock, o = DIR[from.side];
      const out = { x: a.x + o[0] * margin, y: a.y + o[1] * margin };
      pts = [a, out, { x: out.x, y: b.y }, b];
    } else {
      const cells: { i: number; j: number }[] = [];
      for (let s = goal; s >= 0; s = prev[s]) { const c = s >> 2; cells.push({ i: (c / nj) | 0, j: c % nj }); }
      cells.reverse();
      claim(cells, tId, jId);
      const grid = cells.map((c) => ({ x: (c.i + gx) * S, y: (c.j + gy) * S }));
      // the first and last runs sit level with their docks, off the track if the dock is
      const level = (dock: Pt, side: BoardSide, fromStart: boolean) => {
        const horizontal = side === 'L' || side === 'R', n = grid.length;
        const at = (k: number) => grid[fromStart ? k : n - 1 - k];
        const v0 = horizontal ? at(0).y : at(0).x;
        for (let k = 0; k < n && (horizontal ? at(k).y : at(k).x) === v0; k++) { if (horizontal) at(k).y = dock.y; else at(k).x = dock.x; }
      };
      const horizontal = (side: BoardSide) => side === 'L' || side === 'R';
      const straight = horizontal(from.side) === horizontal(to.side) && grid.every((p) => (horizontal(from.side) ? p.y === grid[0].y : p.x === grid[0].x));
      const apart = horizontal(from.side) ? from.dock.y !== to.dock.y : from.dock.x !== to.dock.x;
      if (straight && apart) {
        // the only run would have to sit at both levels: it steps halfway
        const m = grid.length >> 1, h = horizontal(from.side);
        grid.forEach((p, k) => { if (h) p.y = k < m ? from.dock.y : to.dock.y; else p.x = k < m ? from.dock.x : to.dock.x; });
        grid.splice(m, 0, h ? { x: grid[m].x, y: from.dock.y } : { x: from.dock.x, y: grid[m].y });
      } else {
        level(from.dock, from.side, true);
        level(to.dock, to.side, false);
      }
      pts = [from.dock, ...grid, to.dock];
    }
    raw.set(e.id, { pts: simplify(pts), trunk, join });
  }

  // dots: a corner of one line of a trunk (or a join) that three directions of that group meet at
  const out = new Map<string, BoardRoute>();
  const groups = new Map<string, string[]>();
  for (const [id, r] of raw) for (const gk of [`t:${r.trunk}`, `j:${r.join}`]) { if (!groups.has(gk)) groups.set(gk, []); groups.get(gk)!.push(id); }
  const dots = new Map<string, Pt[]>([...raw.keys()].map((id) => [id, []]));
  for (const ids of groups.values()) {
    if (ids.length < 2) continue;
    const lines = ids.map((id) => raw.get(id)!.pts);
    const candidates = new Map<string, Pt>();
    for (const pts of lines) for (let k = 1; k < pts.length - 1; k++) candidates.set(key(pts[k]), pts[k]);
    for (const p of candidates.values()) {
      const dirs = new Set<string>();
      const on: number[] = [];
      lines.forEach((pts, li) => {
        let touched = false;
        for (let k = 1; k < pts.length; k++) {
          const a = pts[k - 1], b = pts[k];
          const inside = (a.x === b.x && p.x === a.x && p.y >= Math.min(a.y, b.y) && p.y <= Math.max(a.y, b.y)) || (a.y === b.y && p.y === a.y && p.x >= Math.min(a.x, b.x) && p.x <= Math.max(a.x, b.x));
          if (!inside) continue;
          touched = true;
          for (const q of [a, b]) if (q.x !== p.x || q.y !== p.y) dirs.add(`${Math.sign(q.x - p.x)},${Math.sign(q.y - p.y)}`);
        }
        if (touched) on.push(li);
      });
      if (dirs.size >= 3) for (const li of on) { const list = dots.get(ids[li])!; if (!list.some((q) => q.x === p.x && q.y === p.y)) list.push(p); }
    }
  }
  for (const [id, r] of raw) out.set(id, { points: r.pts, branches: dots.get(id)! });
  return out;
}

/** drop repeated points and the middle of straight runs */
function simplify(pts: Pt[]): Pt[] {
  const p = pts.filter((q, k) => !k || q.x !== pts[k - 1].x || q.y !== pts[k - 1].y);
  return p.filter((q, k) => k === 0 || k === p.length - 1 || !((p[k - 1].x === q.x && q.x === p[k + 1].x) || (p[k - 1].y === q.y && q.y === p[k + 1].y)));
}
