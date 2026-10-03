import { describe, expect, it } from 'vitest';
import { insideOf, itemKindOf, type Fixture } from '../src/index.js';
import zero2prod from '../src/map/fixtures/zero2prod.json' with { type: 'json' };
import zed from '../src/map/fixtures/zed.json' with { type: 'json' };
import ripgrep from '../src/map/fixtures/ripgrep.json' with { type: 'json' };

describe('the inside of a unit, read from the fixtures', () => {
  it('a hexagon has its three columns with their areas, in order', () => {
    const cols = insideOf(zero2prod as unknown as Fixture, 'api');
    expect(cols.map((c) => c.kind)).toEqual(['driving', 'domain', 'driven']);
    expect(cols[0].areas[0].name).toBe('routes · public');
    expect(cols[0].areas[0].items[0]).toMatchObject({ name: 'health_check()', k: 'fn', entry: 1 });
  });
  it('a layered unit reads public API left, leaves right, each area still in its own layer', () => {
    const cols = insideOf(zed as unknown as Fixture, 'gpui');
    expect(cols.every((c) => c.kind === 'layer')).toBe(true);
    expect(cols.map((c) => c.label)).toEqual(['L4 · public api', 'L3 · views · window', 'L2 · elements', 'L1 · platform', 'L0 · leaf · geometry']);
    expect(cols.map((c) => c.areas.map((a) => a.id))).toEqual([['pub'], ['views'], ['els'], ['plat'], ['geo', 'color']]);
  });
  it('layers say their depth: the first is the public API, the last the leaves, the rest internals', () => {
    const depths = (f: unknown, id: string) => insideOf(f as Fixture, id).map((c) => c.depth);
    expect(depths(zed, 'gpui')).toEqual(['api', 'internal', 'internal', 'internal', 'leaf']);
    expect(depths(ripgrep, 'grep-cli')).toEqual(['api', 'leaf']);
    expect(depths(ripgrep, 'grep'), 'a single layer is the public API').toEqual(['api']);
    expect(depths(zero2prod, 'api'), 'a hexagon has kinds, not depths').toEqual([undefined, undefined, undefined]);
  });
  it('never yields an outbound column: externals are ports, not a column', () => {
    for (const [f, ids] of [[zero2prod, ['api', 'worker']], [zed, Object.keys((zed as any).units)]] as const)
      for (const id of ids) expect(insideOf(f as unknown as Fixture, id).some((c) => (c.kind as string) === 'outbound')).toBe(false);
  });
  it('maps item kinds, external for an item flagged ext', () => {
    expect(itemKindOf({ id: 'a', name: 'A', k: 'trait' })).toBe('trait');
    expect(itemKindOf({ id: 'a', name: 'A', k: 'struct', ext: 1 })).toBe('external');
    expect(itemKindOf({ id: 'a', name: 'A', k: 'weird' })).toBe('fn');
    for (const k of ['const', 'static', 'type-alias', 'union']) expect(itemKindOf({ id: 'a', name: 'A', k })).toBe(k);
  });
});
