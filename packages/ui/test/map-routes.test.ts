import { describe, expect, it } from 'vitest';
import { route, simpleRoute, stretches, type Box, type RouteLink } from '../src/index.js';

const col = (i: number): Box => ({ x: i * 276, y: 0, w: 220, h: 400 });
const bands = [col(0), col(1), col(2)];
const item = (band: number, y: number): Box => ({ x: bands[band].x + 10, y, w: 200, h: 18 });
const link = (id: string, from: [number, number], to: [number, number], trunk = id): RouteLink => ({
  id, trunk, from: { box: item(...from), band: from[0], dock: 0.5 }, to: { box: item(...to), band: to[0], dock: 0.5 },
});
const run = (links: RouteLink[]) => route({ bands, links, spacing: 12, channelTop: 420 });

describe('routes inside a sheet', () => {
  it('an adjacent link leaves the right edge, takes a track in the gutter and enters the left edge; lines are square', () => {
    const { routes, lanes } = run([link('a', [0, 100], [1, 200])]);
    const r = routes.get('a')!;
    expect(r.points).toEqual([{ x: 210, y: 109 }, { x: 248, y: 109 }, { x: 248, y: 209 }, { x: 286, y: 209 }]);
    expect(r.backward).toBe(false); expect(r.branches).toEqual([]); expect(lanes).toBe(0);
    for (let i = 1; i < r.points.length; i++) expect(r.points[i].x === r.points[i - 1].x || r.points[i].y === r.points[i - 1].y).toBe(true);
  });
  it('a link inside one column runs beside it and comes back to the right edge of its target', () => {
    const r = run([link('s', [0, 100], [0, 300])]).routes.get('s')!;
    expect(r.points[0].x).toBe(210); expect(r.points[3].x).toBe(210);
    expect(r.points[1].x).toBeGreaterThan(220); expect(r.points[1].x).toBeLessThan(276);
    expect(r.backward).toBe(false);
  });
  it('a link pointing right to left is a smell', () => {
    const r = run([link('b', [1, 200], [0, 100])]).routes.get('b')!;
    expect(r.backward).toBe(true);
    expect(r.points[0].x).toBe(286); expect(r.points[3].x).toBe(210);
  });
  it('a column-skipping link takes a lane in the channel under the columns', () => {
    const { routes, lanes } = run([link('f', [0, 100], [2, 150])]);
    const r = routes.get('f')!;
    expect(lanes).toBe(1);
    expect(r.points.length).toBe(6);
    expect(r.points[2].y).toBe(426); expect(r.points[3].y).toBe(426);
    expect(r.points[5]).toEqual({ x: 562, y: 159 });
  });
  it('links from one source on one trunk share the track and the nearer stub gets a branch dot', () => {
    const { routes } = run([link('a1', [0, 100], [1, 200], 'a'), link('a2', [0, 100], [1, 300], 'a')]);
    const r1 = routes.get('a1')!, r2 = routes.get('a2')!;
    expect(r1.points[1].x).toBe(r2.points[1].x);
    expect(r1.branches).toEqual([{ x: r1.points[1].x, y: 209 }]);
    expect(r2.branches).toEqual([]);
  });
  it('one trunk can hold a same-column link and a forward link: each enters its target from its own side', () => {
    const { routes } = run([link('fwd', [0, 100], [1, 200], 'a'), link('same', [0, 100], [0, 300], 'a')]);
    const f = routes.get('fwd')!, s = routes.get('same')!;
    expect(f.points[1].x).toBe(s.points[1].x);
    expect(f.points[3].x).toBe(286);                                   // into the left edge of the next column's item
    expect(s.points[3].x).toBe(210);                                   // back into the right edge of its own column's item
  });
  it('two trunks overlapping in the same gutter take different tracks, a track apart', () => {
    const { routes } = run([link('a', [0, 100], [1, 300]), link('b', [0, 150], [1, 250])]);
    const xa = routes.get('a')!.points[1].x, xb = routes.get('b')!.points[1].x;
    expect(Math.abs(xa - xb)).toBe(12);
  });
  it('two trunks that never overlap share a track', () => {
    const { routes } = run([link('a', [0, 100], [1, 120]), link('b', [0, 300], [1, 320])]);
    expect(routes.get('a')!.points[1].x).toBe(routes.get('b')!.points[1].x);
  });
  it('the dock height follows the family share of the box', () => {
    const l = link('a', [0, 100], [1, 200]); l.from.dock = 0.3; l.to.dock = 0.3;
    const r = run([l]).routes.get('a')!;
    expect(r.points[0].y).toBeCloseTo(105.4); expect(r.points[3].y).toBeCloseTo(205.4);
  });
  it('outside a sheet, the simplest square route between two boxes', () => {
    const r = simpleRoute({ x: 0, y: 0, w: 100, h: 18 }, { x: 200, y: 50, w: 100, h: 18 });
    expect(r.points).toEqual([{ x: 100, y: 9 }, { x: 150, y: 9 }, { x: 150, y: 59 }, { x: 200, y: 59 }]);
    expect(simpleRoute({ x: 200, y: 0, w: 100, h: 18 }, { x: 0, y: 0, w: 100, h: 18 }).backward).toBe(true);
  });
  it('says how many tracks each gutter took, and a second pass runs between them', () => {
    const first = run([link('a', [0, 100], [1, 300])]);
    expect(first.tracks).toEqual([1, 0]);
    const second = route({ bands, links: [link('b', [0, 150], [1, 250])], spacing: 12, channelTop: 420, avoid: first.tracks });
    expect(second.routes.get('b')!.points[1].x - first.routes.get('a')!.points[1].x).toBe(6);
    const two = route({ bands, links: [link('b', [0, 100], [1, 300]), link('c', [0, 150], [1, 250])], spacing: 12, channelTop: 420, avoid: first.tracks });
    expect(two.routes.get('b')!.points[1].x - first.routes.get('a')!.points[1].x).toBe(-6);   // an even pass already sits between
  });
});

describe('the stretches of a tree', () => {
  const tree = (...ys: number[]) => {
    const links = ys.map((y, i) => link(`l${i}`, [0, 100], [1, y], 't'));
    const { routes } = run(links);
    return stretches(links.map((l) => ({ id: l.id, points: routes.get(l.id)!.points })));
  };
  it('a line alone shares nothing', () => {
    const s = tree(200).get('l0')!;
    expect(s.shared).toEqual([]); expect(s.own.length).toBe(4);
  });
  it('two lines share the trunk down to where the nearer one turns; the farther goes on alone', () => {
    const s = tree(200, 300);
    const x = s.get('l0')!.own[0].x;
    expect(s.get('l0')!.shared).toEqual([{ x: 210, y: 109 }, { x, y: 109 }, { x, y: 209 }]);
    expect(s.get('l0')!.own).toEqual([{ x, y: 209 }, { x: 286, y: 209 }]);
    expect(s.get('l1')!.shared).toEqual([{ x: 210, y: 109 }, { x, y: 109 }, { x, y: 209 }]);
    expect(s.get('l1')!.own).toEqual([{ x, y: 209 }, { x, y: 309 }, { x: 286, y: 309 }]);
  });
  it('lines leaving up and down share only the stub out of the source', () => {
    const s = tree(50, 300);
    const x = s.get('l0')!.own[0].x;
    expect(s.get('l0')!.shared).toEqual([{ x: 210, y: 109 }, { x, y: 109 }]);
    expect(s.get('l1')!.own[0]).toEqual({ x, y: 109 });
  });
  it('a line through the channel shares the trunk as far as another one follows it', () => {
    const links = [link('near', [0, 100], [1, 300], 't'), link('far', [0, 100], [2, 150], 't')];
    const { routes } = run(links);
    const s = stretches(links.map((l) => ({ id: l.id, points: routes.get(l.id)!.points })));
    const x = routes.get('near')!.points[1].x;
    expect(s.get('far')!.shared.at(-1)).toEqual({ x, y: 309 });
    expect(s.get('far')!.own[0]).toEqual({ x, y: 309 });
    expect(s.get('near')!.own).toEqual([{ x, y: 309 }, { x: 286, y: 309 }]);
  });
});
