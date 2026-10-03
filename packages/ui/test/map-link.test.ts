import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import type { SettLink } from '../src/map/sett-link.js';
import { watching } from '../src/map/lines.js';

const cssOf = (tag: string) => { const s = (customElements.get(tag) as any).styles; return (Array.isArray(s) ? s : [s]).map((x: any) => x.cssText).join('\n'); };
const ROUTE = { points: [{ x: 0, y: 9 }, { x: 40, y: 9 }, { x: 40, y: 59 }, { x: 80, y: 59 }], branches: [{ x: 40, y: 30 }], backward: false };
const mount = async (attrs: string, route = ROUTE) => {
  document.body.innerHTML = `<div style="position:relative"><sett-link ${attrs}></sett-link></div>`;
  const el = document.body.querySelector('sett-link') as SettLink;
  el.route = route;
  await el.updateComplete;
  return el;
};
const setReduced = (on: boolean) => { (globalThis as any).matchMedia = () => ({ matches: on }); };

beforeAll(() => customElements.whenDefined('sett-link'));
afterEach(() => { document.body.innerHTML = ''; delete (globalThis as any).matchMedia; });

describe('sett-link', () => {
  it('uses tokens only; the only animation is the flow, and it has a still twin', () => {
    const c = cssOf('sett-link');
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(c).not.toMatch(/\d+px/);
    expect(c.match(/animation:/g)?.length).toBe(1);
    expect(c).toContain('@media (prefers-reduced-motion: reduce)');
    expect(c).toMatch(/\.flow \{ display: none; \}/);
  });
  it('draws the line, the head of its kind, and a branch dot; the family is reflected from the kind', async () => {
    const el = await mount('from="a" to="b" kind="holds"');
    expect(el.getAttribute('family')).toBe('knows');
    const root = el.shadowRoot!;
    expect(root.querySelector('.line')?.getAttribute('d')).toBe('M0.0 9.0 L40.0 9.0 L40.0 59.0 L80.0 59.0');
    expect(root.querySelectorAll('.h.open').length).toBe(1);        // chevron head
    expect(root.querySelectorAll('.t.filled').length).toBe(1);      // ownership diamond at the start
    expect(root.querySelectorAll('.b').length).toBe(1);
    expect(root.querySelector('title')?.textContent).toBe('holds');
    el.kind = 'implements'; await el.updateComplete;
    expect(el.getAttribute('family')).toBe('promises');
    expect(root.querySelectorAll('.h.hollow').length).toBe(1);
    expect(root.querySelector('.t')).toBeNull();
    el.kind = 'refers-to'; await el.updateComplete;
    expect(el.hasAttribute('family')).toBe(false);
    expect(root.querySelector('.h')).toBeNull();
  });
  it('a socket head stops the line short of the box so the socket reads as one', async () => {
    const el = await mount('from="a" to="b" kind="calls-port"');
    expect(el.shadowRoot!.querySelector('.line')?.getAttribute('d')).toBe('M0.0 9.0 L40.0 9.0 L40.0 59.0 L76.0 59.0');
  });
  it('the label joins the kind on hover', async () => {
    const el = await mount('from="a" to="b" kind="calls" label="Arc<Mutex<_>>"');
    expect(el.shadowRoot!.querySelector('title')?.textContent).toBe('calls · Arc<Mutex<_>>');
  });
  it('at the plugs level only the two dots show, until it is lit, selected or a finding', async () => {
    const el = await mount('from="a" to="b" plug');
    const root = el.shadowRoot!;
    expect(root.querySelector('.line')).toBeNull();
    expect(root.querySelectorAll('.plug').length).toBe(2);
    el.lit = true; await el.updateComplete;
    expect(root.querySelector('.line')).not.toBeNull();
    el.lit = false; el.finding = true; await el.updateComplete;
    expect(root.querySelector('.line')).not.toBeNull();
  });
  it('selecting draws it, then flows; deselecting stops the flow', async () => {
    setReduced(false);
    const el = await mount('from="a" to="b"');
    const root = el.shadowRoot!;
    expect(root.querySelector('.flow')).toBeNull();
    el.selected = true; await el.updateComplete; await el.updateComplete; await new Promise((r) => setTimeout(r, 0)); await el.updateComplete;
    expect(root.querySelector('.flow'), 'happy-dom has no path length: the draw is skipped and the flow starts').not.toBeNull();
    el.selected = false; await el.updateComplete;
    expect(root.querySelector('.flow')).toBeNull();
  });
  it('under reduced motion the flow starts at once, no draw', async () => {
    setReduced(true);
    const el = await mount('from="a" to="b" selected');
    expect(el.shadowRoot!.querySelector('mask')).toBeNull();
    expect(el.shadowRoot!.querySelector('.flow')).not.toBeNull();
  });
  it('a selection hidden by a fold gets the blue dock dot where the link plugs in', async () => {
    const el = await mount('from="a" to="b" selected', { ...ROUTE, docked: { to: true } });
    const dock = el.shadowRoot!.querySelector('.dock')!;
    expect(dock.getAttribute('cx')).toBe('80'); expect(dock.getAttribute('cy')).toBe('59');
    el.selected = false; await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.dock')).toBeNull();
  });
  it('a finding stays red and keeps its ink when everything else recedes', () => {
    const c = cssOf('sett-link');
    expect(c).toMatch(/:host\(\[finding\]\) \{ color: var\(--sett-color-bad\); \}/);
    expect(c).toMatch(/:host\(\[far\]\) \{ opacity: var\(--sett-map-far\); \}/);
    expect(c).toMatch(/:host\(\[far\]\[finding\]\) \{ opacity: 1; \}/);
    expect(c).toMatch(/:host\(\[backward\]\) \{ color: var\(--sett-map-status-smell-color\); \}/);
    expect(c).toMatch(/:host\(\[kind='refers-to'\]\) \{ color: var\(--sett-color-line2\); \}/);
  });
  it('a planned link is amber and one step heavier on an amber band under its own line, keeping its pattern and head', async () => {
    const c = cssOf('sett-link');
    expect(c).toMatch(/:host\(\[planned\]\) \{ color: var\(--sett-color-sug\); \}/);
    expect(c).toMatch(/:host\(\[planned\]\) \.line/);
    expect(c).toMatch(/\.band \{[^}]*stroke: var\(--sett-color-sug-bg\);[^}]*stroke-width: var\(--sett-map-size-band\);/);
    // a finding, the smell, a pointer and the selection all outrank the plan's colour
    const order = (sel: string) => c.indexOf(`:host(${sel})`);
    for (const sel of ['[backward]', '[lit]', '[finding]']) expect(order('[planned]')).toBeLessThan(order(sel));
    const el = await mount('from="a" to="b" kind="implements" planned');
    const root = el.shadowRoot!;
    const band = root.querySelector('.band')!;
    expect(band.getAttribute('d')).toBe(root.querySelector('.line')!.getAttribute('d'));
    expect(band.compareDocumentPosition(root.querySelector('.line')!) & Node.DOCUMENT_POSITION_FOLLOWING, 'the band is under the line').toBeTruthy();
    expect(el.getAttribute('family')).toBe('promises');
    expect(root.querySelectorAll('.h.hollow').length).toBe(1);
    el.finding = true; await el.updateComplete;
    expect(root.querySelector('.band'), 'a finding outranks the plan').toBeNull();
    el.finding = false; el.selected = true; await el.updateComplete;
    expect(root.querySelector('.band'), 'the selection keeps the band').not.toBeNull();
  });
  it('at the plugs level an overlay line is drawn, as a finding is', async () => {
    for (const a of ['planned', 'delta="added"', 'delta="removed"']) {
      const el = await mount(`from="a" to="b" plug ${a}`);
      expect(el.shadowRoot!.querySelector('.line'), a).not.toBeNull();
    }
    const el = await mount('from="a" to="b" plug delta="unchanged"');
    expect(el.shadowRoot!.querySelector('.line')).toBeNull();
  });
  it('in the delta a removed link is a ghost cut across its middle; an unchanged one recedes, a finding never', async () => {
    const c = cssOf('sett-link');
    expect(c).toMatch(/:host\(\[delta='removed'\]\) \{ color: var\(--sett-color-line\); \}/);
    expect(c).toMatch(/:host\(\[delta='unchanged'\]\) \{ opacity: var\(--sett-map-far\); \}/);
    expect(c).toMatch(/:host\(\[delta='unchanged'\]\[finding\]\) \{ opacity: 1; \}/);
    const el = await mount('from="a" to="b" delta="removed"');
    const cut = el.shadowRoot!.querySelectorAll('.cut');
    expect(cut.length).toBe(2);
    // the route is 130 long; its middle (65) is on the vertical segment at x = 40, y = 34
    for (const p of cut) expect(p.getAttribute('d')).toMatch(/^M3\d\.\d 3\d\.\d L4\d\.\d 3\d\.\d$/);
    el.delta = 'added'; await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.cut')).toBeNull();
  });
  it('outside a sheet it watches its own ends; inside one the sheet does', async () => {
    document.body.innerHTML = '<div style="position:relative"><sett-item key="a">a</sett-item><sett-item key="b">b</sett-item><sett-link from="a" to="b"></sett-link></div>';
    await (document.body.querySelector('sett-link') as SettLink).updateComplete;
    expect(watching()).toBe(1);
    document.body.innerHTML = '';
    expect(watching()).toBe(0);
  });
});
