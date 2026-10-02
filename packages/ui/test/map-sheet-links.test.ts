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
const SHEET = `<sett-sheet ${box(0, 0, 800, 400)}>
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
