import { describe, expect, it } from 'vitest';
import { placeGhosts, type Box } from '../src/index.js';

const open: Box = { x: 1000, y: 500, w: 1500, h: 700 };
const size = (keys: string[]) => (keys.length > 1 ? { w: 440, h: 60 + keys.length * 24 } : { w: 440, h: 120 });

describe('where the ghosts go', () => {
  it('beside the open unit, a gutter away, on the side where the neighbour lies on the system map', () => {
    const out = placeGhosts({ open, size, ghosts: [{ key: 'clients', dir: { dx: -300, dy: 0 } }, { key: 'redis', dir: { dx: 340, dy: 50 } }] });
    const c = out.find((g) => g.keys[0] === 'clients')!, r = out.find((g) => g.keys[0] === 'redis')!;
    expect(c.side).toBe('left'); expect(c.x + c.w).toBe(1000 - 56);
    expect(c.y + c.h / 2).toBe(850);
    expect(r.side).toBe('right'); expect(r.x).toBe(2500 + 56);
    expect(r.y + r.h / 2).toBeGreaterThan(850);   // toward it: a little below the middle
  });
  it('steeper than the box: below or above, toward the neighbour, kept within the open unit\'s extent', () => {
    const [g] = placeGhosts({ open, size, ghosts: [{ key: 'postmark', dir: { dx: 340, dy: 220 } }] });
    expect(g.side).toBe('bottom'); expect(g.y).toBe(1200 + 56);
    expect(g.x + g.w).toBeLessThanOrEqual(2500);
    expect(g.x + g.w / 2).toBeGreaterThan(1750);
  });
  it('never callers-left / dependencies-right: a dependency that lies to the left sits on the left', () => {
    const [g] = placeGhosts({ open, size, ghosts: [{ key: 'dep', dir: { dx: -500, dy: 10 } }] });
    expect(g.side).toBe('left');
  });
  it('ghosts that would overlap merge into one cluster, one key per member', () => {
    const out = placeGhosts({ open, size, ghosts: [{ key: 'postgres', dir: { dx: 340, dy: 0 } }, { key: 'redis', dir: { dx: 340, dy: 5 } }, { key: 'far', dir: { dx: 340, dy: -150 } }] });
    const cluster = out.find((g) => g.keys.length > 1)!;
    expect(cluster.keys).toEqual(['postgres', 'redis']);
    expect(cluster.h).toBe(60 + 2 * 24);
    expect(out.length).toBe(2);
  });
});

describe('where the ghosts go · after the clamp', () => {
  it('a cluster pushed back inside the open unit\'s extent never overlaps the next ghost', () => {
    const small: Box = { x: 0, y: 0, w: 200, h: 200 };
    const out = placeGhosts({ open: small, size: (keys) => ({ w: 100, h: 40 * keys.length }), ghosts: [{ key: 'a', dir: { dx: 1000, dy: -100 } }, { key: 'b', dir: { dx: 1000, dy: -90 } }, { key: 'c', dir: { dx: 1000, dy: -10 } }] });
    for (const p of out) for (const q of out) if (p !== q) expect(p.y + p.h <= q.y || q.y + q.h <= p.y).toBe(true);
  });
});
