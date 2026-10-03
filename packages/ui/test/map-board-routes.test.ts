import { describe, expect, it } from 'vitest';
import { boardRoutes, type BoardEdge, type Box, type Pt } from '../src/index.js';
import zed from '../src/map/fixtures/zed.json';

const S = 12;
const square = (pts: Pt[]) => pts.every((p, i) => !i || p.x === pts[i - 1].x || p.y === pts[i - 1].y);
/** does the polyline pass through the inside of `b` (its border excluded) */
const crosses = (pts: Pt[], b: Box) => pts.some((p, i) => {
  if (!i) return false;
  const a = pts[i - 1], x0 = Math.min(a.x, p.x), x1 = Math.max(a.x, p.x), y0 = Math.min(a.y, p.y), y1 = Math.max(a.y, p.y);
  return x1 > b.x + 1 && x0 < b.x + b.w - 1 && y1 > b.y + 1 && y0 < b.y + b.h - 1;
});
const card = (x: number, y: number, w = 440, h = 160): Box => ({ x, y, w, h });
/** a card's port dot: needs on the right border, exposes on the left */
const needs = (b: Box, row: number): { box: Box; dock: Pt; side: 'R' } => ({ box: b, dock: { x: b.x + b.w, y: b.y + 60 + row * 24 }, side: 'R' });
const exposes = (b: Box, row: number): { box: Box; dock: Pt; side: 'L' } => ({ box: b, dock: { x: b.x, y: b.y + 60 + row * 24 }, side: 'L' });

describe('routes on the board', () => {
  it('a line forward leaves its dock, runs square in the gap and lands on the other dock', () => {
    const a = card(0, 0), b = card(700, 200);
    const r = boardRoutes({ obstacles: [a, b], edges: [{ id: 'e', from: needs(a, 0), to: exposes(b, 1) }], spacing: S }).get('e')!;
    expect(r.points[0]).toEqual({ x: 440, y: 60 });
    expect(r.points[r.points.length - 1]).toEqual({ x: 700, y: 284 });
    expect(square(r.points)).toBe(true);
    expect(crosses(r.points, a) || crosses(r.points, b)).toBe(false);
    expect(r.points[1].y).toBe(60);                      // leaves level with its dock
    expect(r.points[r.points.length - 2].y).toBe(284);   // arrives level with its dock
    expect(r.branches).toEqual([]);
  });

  it('a line going back turns around the near end of its own card and never crosses either card (step 2 · A)', () => {
    const a = card(700, 0), b = card(0, 40);
    const r = boardRoutes({ obstacles: [a, b], edges: [{ id: 'back', from: needs(a, 0), to: exposes(b, 0) }], spacing: S }).get('back')!;
    expect(square(r.points)).toBe(true);
    expect(crosses(r.points, a)).toBe(false);
    expect(crosses(r.points, b)).toBe(false);
    expect(r.points[1].x).toBeGreaterThan(1140);        // out to the right first
    expect(r.points[r.points.length - 2].x).toBeLessThan(0); // in from the left last
    const top = Math.min(...r.points.map((p) => p.y)), bottom = Math.max(...r.points.map((p) => p.y));
    expect(top < 0 || bottom > 160).toBe(true);          // around an end, not through
    expect(bottom - top).toBeLessThan(260);              // the near end: it does not wander
  });

  it('lines leaving one dock share a trunk with a dot where they branch', () => {
    const a = card(0, 200), b = card(700, 0), c = card(700, 420);
    const out = boardRoutes({ obstacles: [a, b, c], edges: [{ id: 'ab', from: needs(a, 0), to: exposes(b, 0) }, { id: 'ac', from: needs(a, 0), to: exposes(c, 0) }], spacing: S });
    const ab = out.get('ab')!, ac = out.get('ac')!;
    expect(ab.points.slice(0, 2)).toEqual(ac.points.slice(0, 2));
    expect(ab.branches.length).toBe(1);
    expect(ac.branches).toEqual(ab.branches);
  });

  it('lines into one dock join before it, with a dot where they join', () => {
    const a = card(0, 0), b = card(0, 420), c = card(700, 200);
    const out = boardRoutes({ obstacles: [a, b, c], edges: [{ id: 'ac', from: needs(a, 0), to: exposes(c, 0) }, { id: 'bc', from: needs(b, 0), to: exposes(c, 0) }], spacing: S });
    const ac = out.get('ac')!, bc = out.get('bc')!;
    expect(ac.points.slice(-2)).toEqual(bc.points.slice(-2));
    expect(ac.branches.length).toBe(1);
    expect(bc.branches).toEqual(ac.branches);
  });

  it('lines of different trunks never run on one track', () => {
    const a = card(0, 0), b = card(0, 420), c = card(700, 0), d = card(700, 420);
    const out = boardRoutes({ obstacles: [a, b, c, d], edges: [{ id: 'ad', from: needs(a, 0), to: exposes(d, 0) }, { id: 'bc', from: needs(b, 0), to: exposes(c, 0) }], spacing: S });
    const seg = (pts: Pt[]) => pts.slice(1).map((p, i) => [pts[i], p] as const);
    for (const [p, q] of seg(out.get('ad')!.points)) for (const [r, s] of seg(out.get('bc')!.points)) {
      const vertical = p.x === q.x && r.x === s.x && p.x === r.x, horizontal = p.y === q.y && r.y === s.y && p.y === r.y;
      if (vertical) expect(Math.min(Math.max(p.y, q.y), Math.max(r.y, s.y)) - Math.max(Math.min(p.y, q.y), Math.min(r.y, s.y))).toBeLessThanOrEqual(0);
      if (horizontal) expect(Math.min(Math.max(p.x, q.x), Math.max(r.x, s.x)) - Math.max(Math.min(p.x, q.x), Math.min(r.x, s.x))).toBeLessThanOrEqual(0);
    }
  });

  it('chip tier: without docks, one trunk leaves the middle of a side; across columns the sides face, in one column top and bottom', () => {
    const a: Box = { x: 0, y: 0, w: 180, h: 110 }, b: Box = { x: 270, y: 0, w: 180, h: 110 }, c: Box = { x: 0, y: 220, w: 180, h: 110 };
    const out = boardRoutes({ obstacles: [a, b, c], edges: [{ id: 'ab', from: { box: a }, to: { box: b } }, { id: 'ac', from: { box: a }, to: { box: c } }], spacing: S });
    const ab = out.get('ab')!.points, ac = out.get('ac')!.points;
    expect(ab[0]).toEqual({ x: 180, y: 55 });
    expect(ab[ab.length - 1].x).toBe(270);
    expect(ac[0]).toEqual({ x: 90, y: 110 });
    expect(ac[ac.length - 1].y).toBe(220);
  });

  it('chip tier: several lines into one side land spread along it, ordered by where they come from', () => {
    const t: Box = { x: 400, y: 200, w: 180, h: 110 };
    const up: Box = { x: 0, y: 0, w: 180, h: 110 }, down: Box = { x: 0, y: 400, w: 180, h: 110 };
    const out = boardRoutes({ obstacles: [t, up, down], edges: [{ id: 'd', from: { box: down }, to: { box: t } }, { id: 'u', from: { box: up }, to: { box: t } }], spacing: S });
    const u = out.get('u')!.points.slice(-1)[0], d = out.get('d')!.points.slice(-1)[0];
    expect(u.x).toBe(400); expect(d.x).toBe(400);
    expect(u.y).toBeLessThan(d.y);
  });

  it('a line to a stand-in (the hint pill) stays inside the window it is given', () => {
    const a = card(100, 100), pill: Box = { x: 1300, y: 600, w: 90, h: 28 };
    const within: Box = { x: 0, y: 0, w: 1400, h: 900 };
    const r = boardRoutes({ obstacles: [a, pill], within, edges: [{ id: 'p', from: needs(a, 0), to: { box: pill, dock: { x: 1300, y: 614 }, side: 'L' } }], spacing: S }).get('p')!;
    expect(r.points.slice(-1)[0]).toEqual({ x: 1300, y: 614 });
    for (const p of r.points) { expect(p.x).toBeGreaterThanOrEqual(0); expect(p.x).toBeLessThanOrEqual(1400); expect(p.y).toBeGreaterThanOrEqual(0); expect(p.y).toBeLessThanOrEqual(900); }
  });

  it('zed\'s board at card zoom: every line square, none through a card, inside the time budget', () => {
    const K = 440 / 180, R = (zed as any).repos.zed;
    const boxes: Record<string, Box> = Object.fromEntries(R.units.map((u: any) => [u.id, card(Math.round(u.x * K), Math.round(u.y * K), 440, 180)]));
    const edges: BoardEdge[] = R.edges.map((e: any, i: number) => ({ id: `${i}`, from: needs(boxes[e.f], i % 4), to: exposes(boxes[e.t], 0) }));
    const obstacles = Object.values(boxes);
    // the fastest of several runs: the budget is about the router, not about a busy machine
    let out = boardRoutes({ obstacles, edges, spacing: S }), ms = Infinity;
    for (let k = 0; k < 10; k++) { const t0 = performance.now(); out = boardRoutes({ obstacles, edges, spacing: S }); ms = Math.min(ms, performance.now() - t0); }
    expect(out.size).toBe(edges.length);
    for (const e of edges) {
      const pts = out.get(e.id)!.points;
      expect(square(pts)).toBe(true);
      for (const b of obstacles) expect(crosses(pts, b)).toBe(false);
    }
    // 8 ms on a developer's machine (about 6.5 on an M-series laptop); shared CI runners get three times that
    expect(ms).toBeLessThan(process.env.CI ? 24 : 8);
  });
});

describe('routes on the board · level ends', () => {
  it('a near-straight chip line is straight: the arrival takes its source\'s level when it is within a track', () => {
    const a: Box = { x: 0, y: 0, w: 180, h: 110 }, b: Box = { x: 400, y: 8, w: 180, h: 110 };
    const r = boardRoutes({ obstacles: [a, b], edges: [{ id: 'e', from: { box: a }, to: { box: b } }], spacing: S }).get('e')!;
    expect(r.points).toEqual([{ x: 180, y: 55 }, { x: 400, y: 55 }]);
  });
  it('a straight run between docks at two levels steps halfway, it never slants', () => {
    const a = card(0, 0), b = card(700, 4);
    const r = boardRoutes({ obstacles: [a, b], edges: [{ id: 'e', from: needs(a, 0), to: exposes(b, 0) }], spacing: S }).get('e')!;
    expect(square(r.points)).toBe(true);
    expect(r.points[0]).toEqual({ x: 440, y: 60 });
    expect(r.points.slice(-1)[0]).toEqual({ x: 700, y: 64 });
  });
});

describe('routes on the board · close boxes', () => {
  it('two boxes a track or so apart, docks at two levels: one step, never a slant', () => {
    const a: Box = { x: 0, y: 0, w: 100, h: 60 }, b: Box = { x: 140, y: 0, w: 100, h: 60 };
    const r = boardRoutes({ obstacles: [a, b], edges: [{ id: 'e', from: { box: a, dock: { x: 100, y: 20 }, side: 'R' }, to: { box: b, dock: { x: 140, y: 25 }, side: 'L' } }], spacing: S }).get('e')!;
    expect(square(r.points)).toBe(true);
    expect(r.points[0]).toEqual({ x: 100, y: 20 });
    expect(r.points.slice(-1)[0]).toEqual({ x: 140, y: 25 });
  });
});
