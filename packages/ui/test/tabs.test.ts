import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const TAGS = ['sett-tabbar', 'sett-tab', 'sett-seg', 'sett-seg-item', 'sett-overlay-toggles', 'sett-toggle'];
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).map((s: any) => s.cssText).join('\n');
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as any; await el.updateComplete; return el; };
beforeAll(() => Promise.all(TAGS.map((t) => customElements.whenDefined(t))));

describe('tabs and switches', () => {
  it('use tokens only, never animate, never fade', () => {
    for (const t of TAGS) { const c = cssOf(t); expect(c, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/); expect(c, t).not.toMatch(/\d+px/); expect(c, t).not.toMatch(/animation|opacity/); }
  });
  it('a dirty tab keeps its close mark and adds an amber mark; a pinned tab has no close', async () => {
    const d = await mount('<sett-tab mono dirty>ports.rs</sett-tab>');
    expect(d.shadowRoot.querySelector('.mark')).not.toBeNull(); expect(d.shadowRoot.querySelector('.x')).not.toBeNull();
    expect(cssOf('sett-tab')).toMatch(/\.mark \{ color: var\(--sett-color-sug\)/);
    const p = await mount('<sett-tab pinned>map</sett-tab>');
    expect(p.shadowRoot.querySelector('.x')).toBeNull();
  });
  it('tab fires select on click and close on ✕ without selecting', async () => {
    const t = await mount('<sett-tab mono>a.rs</sett-tab>');
    let sel = 0, cl = 0; t.addEventListener('sett-select', () => sel++); t.addEventListener('sett-close', () => cl++);
    t.click(); expect(sel).toBe(1);
    t.shadowRoot.querySelector('.x').click(); expect(cl).toBe(1); expect(sel).toBe(1);
  });
  it('seg item fires its value; seg has no disabled state', async () => {
    const s = await mount('<sett-seg><sett-seg-item value="review">review</sett-seg-item></sett-seg>');
    let v = ''; s.addEventListener('sett-select', (e: any) => (v = e.detail.value));
    s.querySelector('sett-seg-item').click(); expect(v).toBe('review');
    expect(cssOf('sett-seg-item')).not.toMatch(/disabled|off/);
  });
  it('toggle flips and reports', async () => {
    const t = await mount('<sett-toggle value="plan">plan</sett-toggle>');
    let d: any; t.addEventListener('sett-toggle', (e: any) => (d = e.detail));
    t.click(); await t.updateComplete; expect(d).toEqual({ value: 'plan', on: true }); expect(t.getAttribute('aria-checked')).toBe('true');
  });
});
