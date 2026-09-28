import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).map((s: any) => s.cssText).join('\n');
const mount = async (markup: string) => {
  document.body.innerHTML = markup;
  const el = document.body.firstElementChild as HTMLElement & { updateComplete: Promise<boolean>; open: boolean };
  await el.updateComplete;
  return el;
};
beforeAll(() => Promise.all(['sett-selector', 'sett-menu', 'sett-menu-group', 'sett-menu-item'].map((t) => customElements.whenDefined(t))));

describe('selector and menu', () => {
  it('use tokens only; the only animation is the dot pulse on the frame-pulse token', () => {
    for (const t of ['sett-selector', 'sett-menu', 'sett-menu-group', 'sett-menu-item']) {
      const c = cssOf(t);
      expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(c).not.toMatch(/\d+px/);
      expect(c).not.toMatch(/\d+m?s\b/);
      const kf = c.match(/@keyframes/g) ?? [];
      expect(kf.length).toBeLessThanOrEqual(1);
      if (kf.length) expect(c).toContain('sett-dot-pulse var(--sett-motion-frame-pulse)');
    }
  });
  it('maps state to dot and pill words', async () => {
    const pill = async (m: string) => (await mount(m)).shadowRoot!.querySelector('sett-pill');
    expect(await pill('<sett-selector state="main">main</sett-selector>')).toBeNull();
    expect((await pill('<sett-selector state="asks" count="2">x</sett-selector>'))!.textContent).toBe('asks · 2');
    expect((await pill('<sett-selector state="working" session="tl">x</sett-selector>'))!.getAttribute('session')).toBe('tl');
    const dot = (await mount('<sett-selector state="working">x</sett-selector>')).shadowRoot!.querySelector('.dot')!;
    expect(dot.getAttribute('data-kind')).toBe('session');
    expect(dot.hasAttribute('data-pulse')).toBe(true);
    expect((await mount('<sett-selector state="paused">x</sett-selector>')).shadowRoot!.querySelector('.dot')!.hasAttribute('data-pulse')).toBe(false);
  });
  it('opens on click, closes on Escape, outside click and row choice', async () => {
    const el = await mount('<sett-selector state="main">main<sett-menu slot="menu"><sett-menu-group label="main"><sett-menu-item state="main">main</sett-menu-item></sett-menu-group></sett-menu></sett-selector>');
    (el.shadowRoot!.querySelector('.button') as HTMLElement).click();
    await el.updateComplete;
    expect(el.open).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await el.updateComplete;
    expect(el.open).toBe(false);
    el.open = true; await el.updateComplete;
    document.body.click(); await el.updateComplete;
    expect(el.open).toBe(false);
    el.open = true; await el.updateComplete;
    el.querySelector('sett-menu-item')!.click(); await el.updateComplete;
    expect(el.open).toBe(false);
  });
  it('menu rows never wrap and truncate the name', () => {
    const c = cssOf('sett-menu-item');
    expect(c).toContain('white-space: nowrap');
    expect(c).toMatch(/\.name \{[^}]*text-overflow: ellipsis/);
    expect(c).toMatch(/\.right \{ flex: none/);
  });
});
