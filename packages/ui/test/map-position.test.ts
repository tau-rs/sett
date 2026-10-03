import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

type El = HTMLElement & { updateComplete: Promise<boolean>; [k: string]: any };
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const mount = async (m: string) => {
  document.body.innerHTML = m; const el = document.body.firstElementChild as El; await el.updateComplete;
  await Promise.all(Array.from(el.querySelectorAll('sett-position-row')).map((r) => (r as El).updateComplete));
  await new Promise((r) => setTimeout(r)); // slotchange
  await Promise.all(Array.from(el.querySelectorAll('sett-position-row')).map((r) => (r as El).updateComplete));
  return el;
};
const TRAIL = `<sett-position>
  <sett-position-row key="board" level="board">zero2prod</sett-position-row>
  <sett-position-row key="api" level="unit" current>api</sett-position-row>
  <sett-position-row key="routes" level="area" future>routes · public</sett-position-row>
</sett-position>`;
const rows = (el: El) => Array.from(el.querySelectorAll('sett-position-row')) as El[];
const heard = (el: Element) => { const got: any[] = []; el.addEventListener('sett-go', (e: any) => got.push(e.detail)); return got; };

beforeAll(() => Promise.all(['sett-position', 'sett-position-row'].map((t) => customElements.whenDefined(t))));

describe('sett-position', () => {
  it('uses tokens only; pointing eases the background with motion.hover and has a still twin', () => {
    for (const t of ['sett-position', 'sett-position-row']) {
      expect(cssOf(t)).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(cssOf(t)).not.toMatch(/\d+px/);
      expect(cssOf(t)).not.toMatch(/animation|opacity/);
    }
    const css = cssOf('sett-position-row');
    expect(css.match(/transition:[^;]+;/g)).toEqual(['transition: background-color var(--sett-motion-hover) ease;', 'transition: none;']);
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{ :host \{ transition: none; \} \}/);
  });
  it('numbers its rows in the order given', async () => {
    const el = await mount(TRAIL);
    expect(rows(el).map((r) => r.shadowRoot!.querySelector('.n')!.textContent)).toEqual(['1', '2', '3']);
    expect(rows(el).map((r) => r.shadowRoot!.querySelector('.lv')!.textContent)).toEqual(['board', 'unit', 'area']);
  });
  it('a past row is a button that goes back; the current row is a place and leads nowhere', async () => {
    const el = await mount(TRAIL); const got = heard(el); const [past, current] = rows(el);
    expect(past.getAttribute('role')).toBe('button');
    expect(past.tabIndex).toBe(0);
    past.click();
    expect(got).toEqual([{ n: 1, key: 'board', future: false }]);
    expect(current.hasAttribute('role')).toBe(false);
    expect(current.hasAttribute('tabindex')).toBe(false);
    expect(current.getAttribute('aria-current')).toBe('step');
    current.click();
    expect(got).toHaveLength(1);
  });
  it('a future row goes forward, by Enter or Space too', async () => {
    const el = await mount(TRAIL); const got = heard(el); const future = rows(el)[2];
    future.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    future.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    future.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(got).toEqual([{ n: 3, key: 'routes', future: true }, { n: 3, key: 'routes', future: true }]);
  });
  it('a row that becomes current stops being a button', async () => {
    const el = await mount(TRAIL); const [past] = rows(el);
    past.current = true; await past.updateComplete;
    expect(past.hasAttribute('role')).toBe(false);
    past.current = false; await past.updateComplete;
    expect(past.getAttribute('role')).toBe('button');
  });
});
