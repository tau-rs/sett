import { describe, expect, it } from 'vitest';
import { LINK_FAMILIES, LINK_KINDS, LINK_KIND_NAMES, familyOf, isLinkKind, itemsOf, kindsOf, linkKindOf, linksOf, wiresOf, type Fixture } from '../src/index.js';
import zero2prod from '../src/map/fixtures/zero2prod.json' with { type: 'json' };
import zed from '../src/map/fixtures/zed.json' with { type: 'json' };
import ripgrep from '../src/map/fixtures/ripgrep.json' with { type: 'json' };

const z2p = zero2prod as unknown as Fixture, zd = zed as unknown as Fixture, rg = ripgrep as unknown as Fixture;

describe('the link vocabulary', () => {
  it('has 21 kinds in four families plus the fallback, and no family carries more than seven heads', () => {
    expect(LINK_KIND_NAMES.length).toBe(22);
    expect(LINK_FAMILIES).toEqual(['does', 'promises', 'knows', 'around']);
    for (const f of LINK_FAMILIES) expect(kindsOf(f).length, f).toBeLessThanOrEqual(7);
    expect(LINK_FAMILIES.reduce((n, f) => n + kindsOf(f).length, 0)).toBe(21);
    expect(familyOf('refers-to')).toBeUndefined();
    expect(LINK_KINDS['refers-to'].head).toBe('none');
  });
  it('keeps the entrenched shapes: hollow triangle is a contract, a diamond at the start is ownership, a socket is an interface', () => {
    expect(LINK_KINDS.implements.head).toBe('hollow-triangle');
    expect(LINK_KINDS.holds.tail).toBe('diamond');
    expect(LINK_KINDS['shares-state'].tail).toBe('hollow-diamond');
    expect(LINK_KINDS['calls-port'].head).toBe('socket');
    expect(LINK_KINDS['depends-on-port'].head).toBe('socket');
    expect(isLinkKind('calls')).toBe(true); expect(isLinkKind('smell')).toBe(false);
  });
  it('inside a family two kinds never share head and tail', () => {
    for (const f of LINK_FAMILIES) {
      const sig = kindsOf(f).map((k) => `${LINK_KINDS[k].head}+${LINK_KINDS[k].tail ?? ''}`);
      expect(new Set(sig).size, f).toBe(sig.length);
    }
  });
});

describe('links read from the fixtures', () => {
  it('a hexagon keeps its pairs as stored, from the dependent to what it depends on', () => {
    const links = linksOf(z2p, 'api');
    expect(links.length).toBe(30);
    expect(links[0]).toEqual({ from: 'subscribe', to: 'newsub', kind: 'uses-type' });
    const smell = links.find((l) => l.finding);
    expect(smell).toMatchObject({ from: 'publish_pub', to: 'insertissue', finding: true });
    expect(smell!.label).toContain('reject_anonymous_users');
  });
  it('a layered unit flips its pairs, so uses points from the public API toward the leaves', () => {
    const items = itemsOf(zd, 'gpui');
    const cols = (f: Fixture, id: string) => Object.fromEntries(f.units[id].areas.flatMap((a) => a.items.map((it) => [it.id, a.col])));
    const col = cols(zd, 'gpui');
    const links = linksOf(zd, 'gpui');
    expect(links.length).toBe(22);
    // leaf first in the fixture, so after the flip almost every link goes from a higher layer to a lower one
    const toward = links.filter((l) => col[l.from] >= col[l.to]).length;
    expect(toward).toBeGreaterThan(links.length * 0.8);
    expect(Object.keys(items).length).toBe(27);
  });
  it('derives a kind from the two items and a smell is the finding overlay, not a kind', () => {
    const fn = (id: string, name = id) => ({ id, name, k: 'fn' });
    const st = (id: string, name = id) => ({ id, name, k: 'struct' });
    expect(linkKindOf(fn('a'), fn('b'))).toBe('calls');
    expect(linkKindOf(fn('a'), st('B', 'Thing::parse'))).toBe('constructs');
    expect(linkKindOf(fn('a'), st('B'))).toBe('uses-type');
    expect(linkKindOf(fn('a'), { id: 'e', name: 'E', k: 'enum' })).toBe('matches-on');
    expect(linkKindOf(st('A'), st('B'))).toBe('holds');
    expect(linkKindOf(st('A'), { id: 't', name: 'T', k: 'trait' })).toBe('implements');
    expect(linkKindOf(fn('a'), { id: 't', name: 'T', k: 'trait', port: 1 })).toBe('calls-port');
    expect(linkKindOf(fn('a'), { id: 't', name: 'T', k: 'trait' })).toBe('uses-type');
    expect(linkKindOf(fn('a'), { id: 'x', name: 'X', k: 'struct', ext: 1 })).toBe('calls-out');
    expect(linkKindOf({ id: 'm', name: 'pub use a · b', k: 'mod' }, fn('a'))).toBe('re-exports');
    expect(linkKindOf(fn('a'), { id: 'm', name: 'm!', k: 'macro' })).toBe('expands');
    expect(linkKindOf(fn('a'), fn('b'), { smell: 1 })).toBe('calls');
    expect(linkKindOf(st('A'), { id: 't', name: 'T', k: 'trait' }, { impl: 1 })).toBe('implements');
  });
  it('every fixture link resolves both ends to an item of the unit', () => {
    for (const [f, ids] of [[z2p, Object.keys(z2p.units)], [zd, Object.keys(zd.units)], [rg, Object.keys(rg.units)]] as const)
      for (const id of ids) {
        const items = itemsOf(f, id);
        for (const l of linksOf(f, id)) { expect(items[l.from], `${f.name} ${id} ${l.from}`).toBeTruthy(); expect(items[l.to], `${f.name} ${id} ${l.to}`).toBeTruthy(); }
      }
  });
  it('port wires: a handled route wires its op row to the handler; a port without handlers wires to its area', () => {
    const wires = wiresOf(z2p, 'api');
    expect(wires.every((w) => w.wire)).toBe(true);
    expect(wires.filter((w) => w.from.startsWith('z2p.http:')).length).toBe(13);
    const sub = wires.find((w) => w.to === 'subscribe');
    expect(sub).toMatchObject({ kind: 'calls', wire: true });
    expect(sub!.from.startsWith('z2p.http:POST /subscriptions')).toBe(true);
    expect(wires).toContainEqual({ from: 'persistence', to: 'needs:z2p.pg', kind: 'calls-out', wire: true });
    expect(wires.filter((w) => w.kind === 'calls-out').length).toBe(4);
  });
});
