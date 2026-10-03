import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../src/index.js';
import type { SettSheet } from '../src/map/sett-sheet.js';
import type { SettLink } from '../src/map/sett-link.js';
import { watching } from '../src/map/lines.js';

type El = HTMLElement & { updateComplete: Promise<boolean>; [k: string]: any };
const cssOf = (tag: string) => { const s = (customElements.get(tag) as any).styles; return (Array.isArray(s) ? s : [s]).map((x: any) => x.cssText).join('\n'); };

// happy-dom lays nothing out: boxes come from data-x/y/w/h on the elements
const realRect = Element.prototype.getBoundingClientRect;
beforeAll(() => customElements.whenDefined('sett-sheet'));
beforeEach(() => {
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const n = (a: string) => Number(this.getAttribute(a) ?? 0);
    const x = n('data-x'), y = n('data-y'), w = n('data-w'), h = n('data-h');
    return { x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON: () => ({}) } as DOMRect;
  };
});
afterEach(() => { Element.prototype.getBoundingClientRect = realRect; document.body.innerHTML = ''; });

const box = (x: number, y: number, w: number, h: number) => `data-x="${x}" data-y="${y}" data-w="${w}" data-h="${h}"`;
const SHEET = `<sett-sheet level="items" ${box(0, 0, 800, 400)}>
  <sett-rail slot="exposes" side="exposes" ${box(0, 0, 100, 400)}><sett-port-row key="p" kind="http" side="exposes" ${box(0, 20, 100, 24)}><sett-op-row key="op" kind="route" method="POST" path="/s" handler="a" ${box(0, 44, 100, 19)}></sett-op-row></sett-port-row></sett-rail>
  <sett-column kind="driving" ${box(156, 0, 220, 400)}>
    <sett-area key="r" name="routes" ${box(164, 10, 204, 120)}><sett-item key="a" ${box(172, 40, 188, 18)}>a</sett-item><sett-item key="c" ${box(172, 70, 188, 18)}>c</sett-item></sett-area>
  </sett-column>
  <sett-column kind="domain" ${box(432, 0, 220, 400)}>
    <sett-area key="d" name="domain" ${box(440, 10, 204, 120)}><sett-item key="b" kind="struct" ${box(448, 100, 188, 18)}>b</sett-item><sett-item key="e" ${box(448, 60, 188, 18)}>e</sett-item></sett-area>
  </sett-column>
  <sett-link from="a" to="b" kind="calls"></sett-link>
  <sett-link from="c" to="e" kind="implements"></sett-link>
  <sett-link from="op" to="a" kind="calls" wire></sett-link>
</sett-sheet>`;
const mount = async () => {
  document.body.innerHTML = SHEET;
  const sheet = document.body.firstElementChild as SettSheet & El;
  await sheet.updateComplete;
  await Promise.all(Array.from(sheet.querySelectorAll('sett-link')).map((l) => (l as El).updateComplete));
  sheet.measure();
  await Promise.all(Array.from(sheet.querySelectorAll('sett-link')).map((l) => (l as El).updateComplete));
  return sheet;
};
const link = (sheet: SettSheet, from: string) => sheet.querySelector(`sett-link[from="${from}"]`) as SettLink;
const item = (sheet: SettSheet, key: string) => sheet.querySelector(`[key="${key}"]`) as El;
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('sett-sheet coordinates its links', () => {
  it('uses tokens only and never animates itself', () => {
    const c = cssOf('sett-sheet');
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/); expect(c).not.toMatch(/\d+px/); expect(c).not.toMatch(/animation/);
    expect(c).toContain('padding-bottom: var(--_channel, 0)');
  });
  it('routes every link from the DOM boxes: out of the right edge, a track in the gutter, into the left edge at the family dock', async () => {
    const sheet = await mount();
    const r = link(sheet, 'a').route!;
    expect(r.points[0]).toEqual({ x: 360, y: 49 });                       // right edge of a, does docks at the middle
    expect(r.points[1].x).toBeGreaterThan(376); expect(r.points[1].x).toBeLessThan(432);
    expect(r.points[3]).toEqual({ x: 448, y: 109 });
    const p = link(sheet, 'c').route!;
    expect(p.points[0].y).toBeCloseTo(70 + 18 * 0.3);                      // promises docks at the top
    expect(link(sheet, 'a').backward).toBe(false);
  });
  it('a port wire runs from the rail into the column and takes the port kind colour', async () => {
    const sheet = await mount();
    const w = link(sheet, 'op');
    expect(w.route!.points[0]).toEqual({ x: 100, y: 53.5 });
    expect(w.route!.points.at(-1)).toEqual({ x: 172, y: 49 });
    expect(w.style.getPropertyValue('--_wire')).toBe('var(--sett-map-kind-http-color)');
  });
  it('only rewrites when something moved', async () => {
    const sheet = await mount();
    const before = link(sheet, 'a').route;
    sheet.measure();
    expect(link(sheet, 'a').route).toBe(before);
    item(sheet, 'b').setAttribute('data-y', '130');
    sheet.measure();
    expect(link(sheet, 'a').route).not.toBe(before);
    expect(link(sheet, 'a').route!.points[3].y).toBe(139);
  });
  it('an end hidden by a folded area rides the area edge to the chip and is flagged for the dock dot', async () => {
    const sheet = await mount();
    const area = sheet.querySelector('sett-area[key="d"]') as El;
    area.folded = true; await area.updateComplete;
    area.setAttribute('data-h', '30');                                      // shut
    sheet.measure();
    const r = link(sheet, 'a').route!;
    expect(r.points.at(-1)).toEqual({ x: 440, y: 25 });                     // the chip's left edge, mid height
    expect(r.docked).toEqual({ from: false, to: true });
    area.setAttribute('data-h', '80');                                      // half way shut: the end rides the edge
    sheet.measure();
    expect(link(sheet, 'a').route!.points.at(-1)!.y).toBe(75);
  });
  it('pointing at an item lights its links and the item at the other end, not the item itself', async () => {
    const sheet = await mount();
    item(sheet, 'a').dispatchEvent(new Event('pointerover', { bubbles: true }));
    expect(link(sheet, 'a').lit).toBe(true);
    expect(link(sheet, 'c').lit).toBe(false);
    expect(item(sheet, 'b').lit).toBe(true);
    expect(item(sheet, 'a').lit).toBe(false);
    expect(item(sheet, 'op').lit).toBe(true);                                // the wire ends on a too
    sheet.dispatchEvent(new Event('pointerleave'));
    expect(link(sheet, 'a').lit).toBe(false);
    expect(item(sheet, 'b').lit).toBe(false);
  });
  it('pointing at a link lights it with both ends', async () => {
    const sheet = await mount();
    link(sheet, 'c').dispatchEvent(new CustomEvent('sett-light', { bubbles: true, composed: true, detail: { on: true } }));
    expect(link(sheet, 'c').lit).toBe(true);
    expect(item(sheet, 'c').lit).toBe(true); expect(item(sheet, 'e').lit).toBe(true);
    link(sheet, 'c').dispatchEvent(new CustomEvent('sett-light', { bubbles: true, composed: true, detail: { on: false } }));
    expect(link(sheet, 'c').lit).toBe(false);
  });
  it('selecting an item selects its links from that end and the rest recedes', async () => {
    const sheet = await mount();
    item(sheet, 'b').setAttribute('selected', ''); await tick();
    expect(link(sheet, 'a').selected).toBe(true);
    expect(link(sheet, 'a').anchor).toBe('to');
    expect(link(sheet, 'a').far).toBe(false);
    expect(link(sheet, 'c').selected).toBe(false);
    expect(link(sheet, 'c').far).toBe(true);
    item(sheet, 'b').removeAttribute('selected'); await tick();
    expect(link(sheet, 'a').selected).toBe(false);
    expect(link(sheet, 'c').far).toBe(false);
  });
  it('the filter keeps kinds and families and recedes the rest; the plugs level marks every link', async () => {
    const sheet = await mount();
    sheet.filter = 'promises'; await sheet.updateComplete;
    expect(link(sheet, 'c').far).toBe(false); expect(link(sheet, 'a').far).toBe(true);
    sheet.filter = 'calls'; await sheet.updateComplete;
    expect(link(sheet, 'a').far).toBe(false); expect(link(sheet, 'c').far).toBe(true);
    sheet.filter = ''; sheet.level = 'plugs'; await sheet.updateComplete;
    expect(Array.from(sheet.querySelectorAll('sett-link')).every((l) => (l as SettLink).plug)).toBe(true);
    expect(link(sheet, 'a').far).toBe(false);
  });
  it('a link whose end is missing draws nothing', async () => {
    const sheet = await mount();
    const stray = document.createElement('sett-link'); stray.setAttribute('from', 'a'); stray.setAttribute('to', 'nowhere');
    sheet.appendChild(stray); await tick(); sheet.measure();
    expect((stray as SettLink).route).toBeUndefined();
    expect(link(sheet, 'a').route).toBeDefined();
  });
  it('is watched while connected and released when removed', async () => {
    const before = watching();
    await mount();
    expect(watching()).toBe(before + 1);
    document.body.innerHTML = '';
    expect(watching()).toBe(before);
  });
});

// the areas level: a → b and c → e join the same two areas; a third link makes routes → domain a bundle and routes → auth a single
const AREAS = SHEET.replace(' level="items"', '').replace('<sett-link from="a"', `<sett-link from="a" to="e" kind="uses-type"></sett-link><sett-link from="c" to="f" kind="calls"></sett-link><sett-link from="b" to="e" kind="holds"></sett-link><sett-link from="a" to="g" kind="calls" finding></sett-link><sett-link from="a"`)
  .replace('</sett-area>\n  </sett-column>\n  <sett-link', `</sett-area><sett-area key="auth" name="auth" ${box(440, 200, 204, 80)}><sett-item key="f" ${box(448, 230, 188, 18)}>f</sett-item><sett-item key="g" ${box(448, 252, 188, 18)}>g</sett-item></sett-area>\n  </sett-column>\n  <sett-link`);
const mountAreas = async () => {
  document.body.innerHTML = AREAS;
  const sheet = document.body.firstElementChild as SettSheet & El;
  const settle = async () => { await sheet.updateComplete; sheet.measure(); await sheet.updateComplete; await Promise.all(Array.from(sheet.shadowRoot!.querySelectorAll('sett-bundle')).map((b) => (b as unknown as El).updateComplete)); };
  await settle();
  return { sheet, settle };
};
const bundlesOf = (sheet: SettSheet) => Array.from(sheet.shadowRoot!.querySelectorAll('sett-bundle'));
const to = (sheet: SettSheet, from: string, key: string) => sheet.querySelector(`sett-link[from="${from}"][to="${key}"]`) as SettLink;

describe('sett-sheet at the areas level', () => {
  it('is the default level', async () => {
    const { sheet } = await mountAreas();
    expect(sheet.level).toBe('areas'); expect(sheet.getAttribute('level')).toBe('areas');
  });
  it('draws one bundle per group with lines leaving: pairs counted, header to header, tinted by the column it leaves', async () => {
    const { sheet } = await mountAreas();
    const bs = bundlesOf(sheet);
    expect(bs.map((b) => b.from)).toEqual(['r']);
    const r = bs[0];
    expect(r.origin).toBe('driving'); expect(r.name).toBe('routes');
    expect(r.branches.map((b) => `${b.to}×${b.count}`)).toEqual(['d×3', 'auth×1']);
    const d = r.branches[0], pts = [...d.shared, ...d.own.slice(1)];
    expect(pts[0]).toEqual({ x: 368, y: 23 });                              // the right edge of the routes header, mid height
    expect(pts.at(-1)).toEqual({ x: 440, y: 23 });                          // the left edge of the domain header
    // a port with one wire: a single line from the port row's header to the area's
    expect(link(sheet, 'op').route!.points[0]).toEqual({ x: 100, y: 32 });
    expect(link(sheet, 'op').route!.points.at(-1)).toEqual({ x: 164, y: 23 });
  });
  it('nothing leaves an item: the links of a bundle are not drawn, a pair of one link is that link from the header, with a dot where it leaves the double line', async () => {
    const { sheet } = await mountAreas();
    expect(to(sheet, 'a', 'b').route).toBeUndefined();
    expect(to(sheet, 'a', 'e').route).toBeUndefined();
    const single = to(sheet, 'c', 'f').route!;
    expect(single.points.at(-1)).toEqual({ x: 440, y: 213 });               // the auth header
    expect(single.branches).toEqual([single.points[0]]);
    expect(single.points[0].y).toBe(23);
    expect(to(sheet, 'b', 'e').route).toBeUndefined();                       // inside one area: nothing leaves it
  });
  it('a finding stays item to item and is counted in no bundle', async () => {
    const { sheet } = await mountAreas();
    const f = to(sheet, 'a', 'g').route!;
    expect(f.points[0]).toEqual({ x: 360, y: 49 }); expect(f.points.at(-1)).toEqual({ x: 448, y: 261 });
  });
  it('the arrow end opens a pair into its links; the pair keeps its track; an opened line closes it', async () => {
    const { sheet, settle } = await mountAreas();
    const before = bundlesOf(sheet)[0].branches[1].own[0].x;
    const seen: any[] = [];
    sheet.addEventListener('sett-open', (e) => seen.push((e as CustomEvent).detail));
    bundlesOf(sheet)[0].shadowRoot!.querySelectorAll('g[role="button"]')[1].dispatchEvent(new Event('click'));
    await settle();
    expect(sheet.open).toBe('r>d'); expect(seen).toEqual([{ from: 'r', to: 'd', open: true }]);
    expect(to(sheet, 'a', 'b').route!.points[0]).toEqual({ x: 360, y: 49 });
    expect(to(sheet, 'c', 'e').route).toBeDefined();
    const r = bundlesOf(sheet)[0];
    expect(r.branches[0].open).toBe(true);
    expect(to(sheet, 'c', 'f').route!.points[1].x).toBe(before);             // the single kept its track
    expect(to(sheet, 'c', 'f').route!.branches).toEqual([]);                 // and is alone now: no double line to leave
    to(sheet, 'a', 'b').dispatchEvent(new Event('click', { bubbles: true }));
    await settle();
    expect(sheet.open).toBe(''); expect(to(sheet, 'a', 'b').route).toBeUndefined();
  });
  it('the shared stretch opens everything leaving the area; closing one pair keeps the others open by name', async () => {
    const { sheet, settle } = await mountAreas();
    bundlesOf(sheet)[0].shadowRoot!.querySelectorAll('g[role="button"]')[0].dispatchEvent(new Event('click'));
    await settle();
    expect(sheet.open).toBe('r');
    expect(to(sheet, 'a', 'b').route!.points[0].x).toBe(360); expect(to(sheet, 'c', 'f').route!.points[0].x).toBe(360);
    to(sheet, 'c', 'f').dispatchEvent(new Event('click', { bubbles: true }));
    await settle();
    expect(sheet.open).toBe('r>d');
  });
  it('a click on a single line opens its pair', async () => {
    const { sheet, settle } = await mountAreas();
    to(sheet, 'c', 'f').dispatchEvent(new Event('click', { bubbles: true }));
    await settle();
    expect(sheet.open).toBe('r>auth'); expect(to(sheet, 'c', 'f').route!.points[0]).toEqual({ x: 360, y: 79 });
  });
  it('pointing at an item draws its links, lit, and the pair line still counts every link', async () => {
    const { sheet, settle } = await mountAreas();
    item(sheet, 'a').dispatchEvent(new Event('pointerover', { bubbles: true }));
    await settle();
    expect(to(sheet, 'a', 'b').lit).toBe(true); expect(to(sheet, 'a', 'b').route!.points[0].x).toBe(360);
    expect(to(sheet, 'c', 'e').route).toBeUndefined();
    expect(bundlesOf(sheet)[0].branches[0].count).toBe(3);
  });
  it('pointing at an area lights the lines that touch it', async () => {
    const { sheet, settle } = await mountAreas();
    sheet.querySelector('sett-area[key="auth"]')!.dispatchEvent(new Event('pointerover', { bubbles: true }));
    await settle();
    expect(bundlesOf(sheet)[0].branches.map((b) => b.lit)).toEqual([false, true]);
    expect(to(sheet, 'c', 'f').lit).toBe(true);
    expect(to(sheet, 'c', 'f').route!.points.at(-1)).toEqual({ x: 440, y: 213 });  // still header to header
  });
  it('a click on an item pins it, several at once: their links are drawn, everything else recedes', async () => {
    const { sheet, settle } = await mountAreas();
    item(sheet, 'a').dispatchEvent(new CustomEvent('sett-select', { bubbles: true, composed: true }));
    item(sheet, 'f').dispatchEvent(new CustomEvent('sett-select', { bubbles: true, composed: true }));
    await tick(); await settle();
    expect(item(sheet, 'a').selected).toBe(true); expect(item(sheet, 'f').selected).toBe(true);
    expect(to(sheet, 'a', 'b').selected).toBe(true); expect(to(sheet, 'a', 'b').route).toBeDefined();
    expect(to(sheet, 'c', 'f').selected).toBe(true); expect(to(sheet, 'c', 'f').route!.points[0].x).toBe(360);
    expect(bundlesOf(sheet).every((b) => b.far)).toBe(true);
    item(sheet, 'a').dispatchEvent(new CustomEvent('sett-select', { bubbles: true, composed: true }));
    await tick(); await settle();
    expect(item(sheet, 'a').selected).toBe(false); expect(to(sheet, 'a', 'b').route).toBeUndefined();
  });
  it('a branch that carries nothing the filter keeps recedes', async () => {
    const { sheet, settle } = await mountAreas();
    sheet.filter = 'promises'; await settle();
    expect(bundlesOf(sheet)[0].branches.map((b) => b.far)).toEqual([false, true]);
  });
  it('the level is the default for what was not opened by hand: at plugs an opened pair keeps its lines; at items there is no bundle', async () => {
    const { sheet, settle } = await mountAreas();
    sheet.level = 'plugs'; sheet.open = 'r>d'; await settle();
    expect(bundlesOf(sheet).length).toBe(0);
    expect(to(sheet, 'a', 'b').plug).toBe(false); expect(to(sheet, 'c', 'f').plug).toBe(true);
    sheet.level = 'items'; await settle();
    expect(bundlesOf(sheet).length).toBe(0); expect(to(sheet, 'c', 'f').route!.points[0].x).toBe(360);
  });
  it('item links drawn on demand run between the tracks of the pair lines', async () => {
    const { sheet, settle } = await mountAreas();
    const trunk = bundlesOf(sheet)[0].branches[0].shared[1].x;
    item(sheet, 'a').dispatchEvent(new Event('pointerover', { bubbles: true }));
    await settle();
    expect(bundlesOf(sheet)[0].branches[0].shared[1].x).toBe(trunk);         // the summary did not move
    const xs = ['b', 'e'].map((k) => to(sheet, 'a', k).route!.points[1].x);
    for (const x of xs) expect(Math.abs(x - trunk) % 12).toBe(6);
  });
});
