import { describe, expect, it } from 'vitest';
import { insideOf, itemKindOf, type Fixture } from '../src/index.js';
import zero2prod from '../src/map/fixtures/zero2prod.json' with { type: 'json' };
import zed from '../src/map/fixtures/zed.json' with { type: 'json' };

describe('the inside of a unit, read from the fixtures', () => {
  it('a hexagon has its three columns with their areas, in order', () => {
    const cols = insideOf(zero2prod as unknown as Fixture, 'api');
    expect(cols.map((c) => c.kind)).toEqual(['driving', 'domain', 'driven']);
    expect(cols[0].areas[0].name).toBe('routes · public');
    expect(cols[0].areas[0].items[0]).toMatchObject({ name: 'health_check()', k: 'fn', entry: 1 });
  });
  it('a layered unit has one layer column per layer', () => {
    const cols = insideOf(zed as unknown as Fixture, 'gpui');
    expect(cols.length).toBe(5);
    expect(cols.every((c) => c.kind === 'layer')).toBe(true);
  });
  it('never yields an outbound column: externals are ports, not a column', () => {
    for (const [f, ids] of [[zero2prod, ['api', 'worker']], [zed, Object.keys((zed as any).units)]] as const)
      for (const id of ids) expect(insideOf(f as unknown as Fixture, id).some((c) => (c.kind as string) === 'outbound')).toBe(false);
  });
  it('maps item kinds, external for an item flagged ext', () => {
    expect(itemKindOf({ id: 'a', name: 'A', k: 'trait' })).toBe('trait');
    expect(itemKindOf({ id: 'a', name: 'A', k: 'struct', ext: 1 })).toBe('external');
    expect(itemKindOf({ id: 'a', name: 'A', k: 'weird' })).toBe('fn');
  });
});
