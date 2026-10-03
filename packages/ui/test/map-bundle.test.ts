import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import type { SettBundle, BundleBranch } from '../src/index.js';

type El = SettBundle & { updateComplete: Promise<boolean> };
const cssOf = (tag: string) => { const s = (customElements.get(tag) as any).styles; return (Array.isArray(s) ? s : [s]).map((x: any) => x.cssText).join('\n'); };
const trunk = [{ x: 0, y: 10 }, { x: 50, y: 10 }, { x: 50, y: 40 }];
const branches = (): BundleBranch[] => [
  { to: 'b', name: 'B', count: 3, shared: trunk, own: [{ x: 50, y: 40 }, { x: 100, y: 40 }] },
  { to: 'c', name: 'C', count: 1, shared: trunk, own: [{ x: 50, y: 40 }, { x: 50, y: 80 }, { x: 100, y: 80 }] },
];
const mount = async (bs: BundleBranch[], attrs = '') => {
  document.body.innerHTML = `<sett-bundle from="a" name="A" ${attrs}></sett-bundle>`;
  const el = document.body.firstElementChild as El;
  el.branches = bs; await el.updateComplete;
  return el;
};
const q = (el: El, sel: string) => Array.from(el.shadowRoot!.querySelectorAll(sel));

describe('sett-bundle', () => {
  beforeAll(() => customElements.whenDefined('sett-bundle'));
  it('uses tokens only; the only motion is the hover ease, off under reduced motion', () => {
    const c = cssOf('sett-bundle');
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/); expect(c).not.toMatch(/\d+px/); expect(c).not.toMatch(/animation/);
    expect(c).toContain('var(--sett-map-size-bundle)'); expect(c).toContain('var(--sett-map-size-bundle-gap)');
    expect(c).toContain('var(--sett-map-origin-driving)'); expect(c).toContain('var(--sett-map-origin-domain)'); expect(c).toContain('var(--sett-map-origin-driven)');
    expect(c).toMatch(/prefers-reduced-motion: reduce\) \{\s*\.edge, \.in, \.head \{ transition: none/);
  });
  it('draws halos, then edges, then insides, so a junction opens like a pipe', async () => {
    const el = await mount(branches());
    const classes = q(el, 'path.halo, path.edge, path.in').map((p) => p.classList[0]);
    expect(classes).toEqual(['halo', 'halo', 'edge', 'edge', 'in', 'in']);
  });
  it('a pair of several links runs to an arrow, stopping before the head; a single one only lends its shared stretch', async () => {
    const el = await mount(branches());
    const edges = q(el, 'path.edge').map((p) => p.getAttribute('d'));
    expect(edges).toContain('M0.0 10.0 L50.0 10.0 L50.0 40.0 L92.0 40.0');
    expect(edges).toContain('M0.0 10.0 L50.0 10.0 L50.0 40.0');
    expect(q(el, 'path.head').length).toBe(1);
  });
  it('the arrow end opens that pair, the shared stretch everything leaving the area', async () => {
    const el = await mount(branches());
    const seen: any[] = [];
    el.addEventListener('sett-open', (e) => seen.push((e as CustomEvent).detail));
    const buttons = q(el, 'g[role="button"]');
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['4 links leaving A · open them all', '3 links · A → B · open']);
    (buttons[1] as SVGGElement).dispatchEvent(new Event('click'));
    (buttons[0] as SVGGElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(seen).toEqual([{ from: 'a', to: 'b', open: true }, { from: 'a', to: undefined, open: true }]);
  });
  it('an opened pair is not drawn but stays reachable, to close it', async () => {
    const el = await mount([{ to: 'b', name: 'B', count: 3, shared: [], own: [...trunk, { x: 100, y: 40 }], open: true }]);
    expect(q(el, 'path.edge').length).toBe(0);
    const button = q(el, 'g[role="button"]')[0];
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const seen: any[] = [];
    el.addEventListener('sett-open', (e) => seen.push((e as CustomEvent).detail));
    button.dispatchEvent(new Event('focus')); await el.updateComplete;
    expect(q(el, 'path.edge.lit').length).toBe(1);
    button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(seen).toEqual([{ from: 'a', to: 'b', open: false }]);
  });
  it('pointing at a branch lights it; lit, far and backward are classes on its lines', async () => {
    const el = await mount([{ ...branches()[0], backward: true }, { ...branches()[1], count: 2, far: true }]);
    expect(q(el, 'g.faded path.edge').length).toBe(1);
    expect(q(el, 'path.edge.backward').length).toBe(1);
    q(el, 'g[role="button"]')[1].dispatchEvent(new Event('pointerenter')); await el.updateComplete;
    expect(q(el, 'path.edge.lit').length).toBe(1);
    q(el, 'g[role="button"]')[0].dispatchEvent(new Event('pointerenter')); await el.updateComplete;
    expect(q(el, 'path.edge.lit').length).toBe(2);
  });
  it('reflects origin and far', async () => {
    const el = await mount(branches(), 'origin="driven" far');
    expect(el.origin).toBe('driven'); expect(el.far).toBe(true);
  });
});
