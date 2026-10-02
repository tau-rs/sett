/**
 * Where the links of a sheet run. Pure geometry: boxes in, polylines out.
 * Lines are horizontal and vertical only, each on its own track in a gutter
 * (`map.size.track` apart), one trunk per source item and family with a dot
 * at each branch (wiring-diagram convention). Adjacent bands meet through
 * the gutter between them; a link skipping a band takes a lane in the
 * channel under the columns (rule 5); a link inside one band runs beside it,
 * never over a name; a link pointing right to left is a smell (rule 11).
 */
export interface Box { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }
export interface RouteEnd {
  box: Box;
  /** the band (rail or column) the end sits in, left to right */
  band: number;
  /** where on the box the line docks, as a share of its height (`map.link.<family>.dock`) */
  dock: number;
}
export interface RouteLink {
  id: string;
  from: RouteEnd;
  to: RouteEnd;
  /** links with the same trunk id and the same source leave the item on one line */
  trunk: string;
}
export interface RouteInput {
  /** the x extents of the rails and columns, left to right */
  bands: Box[];
  links: RouteLink[];
  /** `map.size.track` */
  spacing: number;
  /** where the channel under the columns begins */
  channelTop: number;
}
export interface Route {
  points: Pt[];
  /** where this link's stub leaves a trunk shared with another link */
  branches: Pt[];
  /** points right to left: a smell */
  backward: boolean;
  /** an end that sits on a folded area instead of the item it names: the dock dot lands there */
  docked?: { from?: boolean; to?: boolean };
}
export interface RouteOutput { routes: Map<string, Route>; lanes: number }

type Side = 'L' | 'R';
interface Interval { id: string; min: number; max: number; stubs: { y: number; dir: Side }[]; track: number }
interface Tree { links: RouteLink[]; exit: Side; g1: number; far: Map<number, RouteLink[]>; near: RouteLink[] }

const dockY = (e: RouteEnd) => e.box.y + e.box.h * e.dock;
const left = (b: Box) => b.x, right = (b: Box) => b.x + b.w;

/** greedy interval colouring, picking among the free tracks the one that crosses the fewest placed stubs */
function place(intervals: Interval[], gap: number): number {
  const placed: Interval[] = [];
  let tracks = 0;
  for (const a of [...intervals].sort((p, q) => p.min - q.min || q.max - p.max)) {
    let best = -1, bestCost = Infinity;
    for (let t = 0; t <= tracks; t++) {
      if (placed.some((b) => b.track === t && b.max + gap > a.min && a.max + gap > b.min)) continue;
      let cost = 0;
      for (const b of placed) {
        for (const s of a.stubs) if (((s.dir === 'R' && b.track > t) || (s.dir === 'L' && b.track < t)) && b.min < s.y && s.y < b.max) cost++;
        for (const s of b.stubs) if (((s.dir === 'R' && t > b.track) || (s.dir === 'L' && t < b.track)) && a.min < s.y && s.y < a.max) cost++;
      }
      if (cost < bestCost) { bestCost = cost; best = t; }
    }
    a.track = best;
    placed.push(a);
    tracks = Math.max(tracks, best + 1);
  }
  return tracks;
}

/** a point strictly inside an axis-aligned segment */
const inside = (p: Pt, a: Pt, b: Pt) =>
  (a.x === b.x && p.x === a.x && p.y > Math.min(a.y, b.y) && p.y < Math.max(a.y, b.y)) ||
  (a.y === b.y && p.y === a.y && p.x > Math.min(a.x, b.x) && p.x < Math.max(a.x, b.x));

export function route({ bands, links, spacing, channelTop }: RouteInput): RouteOutput {
  const routes = new Map<string, Route>();
  const gutters = bands.length - 1;
  const trees = new Map<string, Tree>();
  for (const l of links) {
    const d = l.to.band - l.from.band;
    if (l.from.band < 0 || l.to.band < 0 || l.from.band >= bands.length || l.to.band >= bands.length) continue;
    let exit: Side, g1: number;
    const same = d === 0;
    if (same) { exit = l.from.band < gutters ? 'R' : 'L'; g1 = exit === 'R' ? l.from.band : l.from.band - 1; }
    else if (d > 0) { exit = 'R'; g1 = l.from.band; }
    else { exit = 'L'; g1 = l.from.band - 1; }
    if (g1 < 0 || g1 >= gutters) continue;
    const key = `${l.trunk}|${exit}`;
    let t = trees.get(key);
    if (!t) { t = { links: [], exit, g1, far: new Map(), near: [] }; trees.set(key, t); }
    t.links.push(l);
    if (Math.abs(d) >= 2) { const g2 = d > 0 ? l.to.band - 1 : l.to.band; const arr = t.far.get(g2) ?? []; arr.push(l); t.far.set(g2, arr); }
    else t.near.push(l);
  }

  // tracks in each gutter: one interval per trunk, one per return into a far band
  const perGutter: Interval[][] = Array.from({ length: gutters }, () => []);
  const intervalOf = new Map<string, Interval>();
  const FAR = channelTop + 1e6; // a trunk reaching the channel spans down to it, whatever its lane
  for (const [key, t] of trees) {
    const ys = dockY(t.links[0].from);
    const near = t.near.map((l) => dockY(l.to));
    const back: Side = t.exit === 'R' ? 'L' : 'R';
    const stubs = [{ y: ys, dir: back }, ...t.near.map((l) => ({ y: dockY(l.to), dir: l.to.band === l.from.band ? back : t.exit }))];
    const a: Interval = { id: key, min: Math.min(ys, ...near), max: t.far.size ? FAR : Math.max(ys, ...near), stubs, track: 0 };
    perGutter[t.g1].push(a); intervalOf.set(key, a);
    for (const [g2, ls] of t.far) {
      const yt = ls.map((l) => dockY(l.to));
      const b: Interval = { id: `${key}|${g2}`, min: Math.min(...yt), max: FAR, stubs: yt.map((y) => ({ y, dir: t.exit })), track: 0 };
      perGutter[g2].push(b); intervalOf.set(b.id, b);
    }
  }
  const trackX = (g: number, k: number, n: number) => {
    const x0 = right(bands[g]), x1 = left(bands[g + 1]);
    const s = Math.min(spacing, (x1 - x0) / (n + 1));
    return (x0 + x1) / 2 - ((n - 1) * s) / 2 + k * s;
  };
  const counts = perGutter.map((iv) => place(iv, spacing / 2));
  const xOf = (iv: Interval, g: number) => trackX(g, iv.track, counts[g]);

  // lanes in the channel: one per trunk that reaches it
  const laneIv: Interval[] = [];
  const laneOf = new Map<string, Interval>();
  for (const [key, t] of trees) {
    if (!t.far.size) continue;
    const xs = [xOf(intervalOf.get(key)!, t.g1), ...[...t.far.keys()].map((g2) => xOf(intervalOf.get(`${key}|${g2}`)!, g2))];
    const iv: Interval = { id: key, min: Math.min(...xs), max: Math.max(...xs), stubs: [], track: 0 };
    laneIv.push(iv); laneOf.set(key, iv);
  }
  const lanes = place(laneIv, spacing / 2);
  const laneY = (iv: Interval) => channelTop + spacing * (iv.track + 0.5);

  for (const [key, t] of trees) {
    const a = intervalOf.get(key)!;
    const tx = xOf(a, t.g1);
    const segs: [Pt, Pt][] = [];
    const drawn: { l: RouteLink; pts: Pt[]; backward: boolean }[] = [];
    for (const l of t.links) {
      const ys = dockY(l.from), yt = dockY(l.to);
      const sx = t.exit === 'R' ? right(l.from.box) : left(l.from.box);
      const far = Math.abs(l.to.band - l.from.band) >= 2;
      const enterFromLeft = l.to.band === l.from.band ? t.exit === 'L' : t.exit === 'R';
      const ex = enterFromLeft ? left(l.to.box) : right(l.to.box);
      let pts: Pt[];
      if (!far) pts = [{ x: sx, y: ys }, { x: tx, y: ys }, { x: tx, y: yt }, { x: ex, y: yt }];
      else {
        const g2 = t.exit === 'R' ? l.to.band - 1 : l.to.band;
        const tx2 = xOf(intervalOf.get(`${key}|${g2}`)!, g2);
        const ly = laneY(laneOf.get(key)!);
        pts = [{ x: sx, y: ys }, { x: tx, y: ys }, { x: tx, y: ly }, { x: tx2, y: ly }, { x: tx2, y: yt }, { x: ex, y: yt }];
      }
      for (let i = 1; i < pts.length; i++) segs.push([pts[i - 1], pts[i]]);
      drawn.push({ l, pts, backward: l.to.band < l.from.band });
    }
    for (const { l, pts, backward } of drawn) {
      const branches = pts.slice(1, -1).filter((p) => segs.some(([a, b]) => inside(p, a, b)));
      routes.set(l.id, { points: pts, branches, backward });
    }
  }
  return { routes, lanes };
}

/** the simplest square route between two boxes, for a link outside any sheet */
export function simpleRoute(from: Box, to: Box, dock = 0.5): Route {
  const ys = from.y + from.h * dock, yt = to.y + to.h * dock;
  const forward = to.x >= from.x + from.w;
  const sx = forward ? right(from) : left(from), ex = forward ? left(to) : right(to);
  const mx = (sx + ex) / 2;
  return { points: [{ x: sx, y: ys }, { x: mx, y: ys }, { x: mx, y: yt }, { x: ex, y: yt }], branches: [], backward: !forward };
}
