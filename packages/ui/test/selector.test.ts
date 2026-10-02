import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import { SCOPE_LOCK, scopeText, type Scope } from '../src/scope.js';

const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).map((s: any) => s.cssText).join('\n');
const mount = async (markup: string) => {
  document.body.innerHTML = markup;
  const el = document.body.firstElementChild as HTMLElement & { updateComplete: Promise<boolean>; open: boolean };
  await el.updateComplete;
  return el;
};
const words = (el: HTMLElement) => el.shadowRoot!.querySelector('.words')!.textContent!.replace(/\s+/g, ' ').trim();
const button = (el: HTMLElement) => el.shadowRoot!.querySelector('.button')!;
beforeAll(() => Promise.all(['sett-selector', 'sett-menu', 'sett-menu-group', 'sett-menu-item', 'sett-scope-line'].map((t) => customElements.whenDefined(t))));

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

describe('the selector as scope selector', () => {
  const cases: [string, Scope][] = [
    ['scope="main"', { kind: 'main' }],
    ['scope="session" session="yk" scope-id="w1" name="refund flow"', { kind: 'session', id: 'w1', name: 'refund flow' }],
    ['scope="you" name="fix-pool-size"', { kind: 'you', name: 'fix-pool-size' }],
    ['scope="plan" name="refund flow"', { kind: 'plan', name: 'refund flow' }],
  ];
  it('one source: for each kind the words are scopeText, and the same as the scope line writes', async () => {
    for (const [attrs, scope] of cases) {
      const sel = await mount(`<sett-selector ${attrs}>typed by the consumer</sett-selector>`);
      const inSelector = words(sel);
      // the words are never typed by the consumer: no default slot while a scope is set
      expect(sel.shadowRoot!.querySelector('slot:not([name])'), attrs).toBeNull();
      const inLine = words(await mount(`<sett-scope-line ${attrs}></sett-scope-line>`));
      expect(inSelector, attrs).toBe(scopeText(scope));
      expect(inSelector, attrs).toBe(inLine);
    }
  });
  it('the dot, the border and the words take the scope colour; main stays neutral', async () => {
    const el = await mount('<sett-selector scope="session" session="tl" scope-id="w2" name="webhook retries"></sett-selector>');
    expect(el.shadowRoot!.querySelector('.dot')!.getAttribute('data-kind')).toBe('scope');
    const c = cssOf('sett-selector');
    expect(c).toMatch(/\.dot\[data-kind='scope'\] \{ background: var\(--_scope\); \}/);
    expect(c).toContain(":host([scope='session']) .button, :host([scope='you']) .button, :host([scope='plan']) .button { border-color: var(--_scope); color: var(--_scope); }");
    expect(c).not.toMatch(/\[scope='main'\]\) \.button/);
    expect(c).toMatch(/\.button \{[^}]*font-family: var\(--sett-font-mono\);/);
  });
  it('locked shows the glyph after the words and says so in the accessible name', async () => {
    const open = await mount('<sett-selector scope="you" name="fix-pool-size"></sett-selector>');
    expect(open.shadowRoot!.querySelector('.lock')).toBeNull();
    expect(button(open).getAttribute('aria-label')).toBe('scope: you · fix-pool-size');
    const locked = await mount('<sett-selector scope="you" name="fix-pool-size" locked></sett-selector>');
    const lock = locked.shadowRoot!.querySelector('.lock')!;
    expect(lock.textContent).toBe(SCOPE_LOCK);
    expect(lock.previousElementSibling).toBe(locked.shadowRoot!.querySelector('.words'));
    expect(words(locked)).toBe('you · fix-pool-size');
    expect(button(locked).getAttribute('aria-label')).toBe('scope: you · fix-pool-size, locked');
  });
  it('with a scope, state still drives the pill and the pulse: same pill, same words', async () => {
    const asks = await mount('<sett-selector scope="session" session="tl" scope-id="w2" name="webhook retries" state="asks" count="2" locked></sett-selector>');
    const pill = asks.shadowRoot!.querySelector('sett-pill')!;
    expect(pill.textContent).toBe('asks · 2');
    expect(pill.getAttribute('kind')).toBe('sug');
    expect(asks.shadowRoot!.querySelector('.dot')!.getAttribute('data-kind')).toBe('scope');
    expect(button(asks).getAttribute('aria-label')).toBe('scope: w2 · webhook retries, locked, asks · 2');
    const working = await mount('<sett-selector scope="session" scope-id="w1" name="refund flow" state="working"></sett-selector>');
    expect(working.shadowRoot!.querySelector('.dot')!.hasAttribute('data-pulse')).toBe(true);
    expect(working.shadowRoot!.querySelector('sett-pill')!.textContent).toBe('working');
    expect((await mount('<sett-selector scope="main"></sett-selector>')).shadowRoot!.querySelector('sett-pill')).toBeNull();
  });
  it('without scope it behaves as before: the slot is the name, state drives the dot, no scope words, no lock', async () => {
    const el = await mount('<sett-selector state="yours" locked>feat/refund</sett-selector>');
    expect(el.hasAttribute('scope')).toBe(false);
    expect(el.shadowRoot!.querySelector('slot:not([name])')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('.words')).toBeNull();
    expect(el.shadowRoot!.querySelector('.lock')).toBeNull();
    expect(button(el).hasAttribute('aria-label')).toBe(false);
    expect(el.shadowRoot!.querySelector('.dot')!.getAttribute('data-kind')).toBe('sel');
    expect(el.shadowRoot!.querySelector('slot[name="menu"]')).not.toBeNull();
  });
  it('an ungrouped row (main) sits directly in the menu, as an option of the listbox', async () => {
    const menu = await mount('<sett-menu><sett-menu-item state="main">main</sett-menu-item><sett-menu-group label="planning"><sett-menu-item state="asks">plan · refund flow</sett-menu-item></sett-menu-group></sett-menu>');
    expect(menu.firstElementChild!.getAttribute('role')).toBe('option');
    expect(cssOf('sett-menu')).toContain('::slotted(sett-menu-item:first-child) { margin-top: var(--sett-space-1); }');
  });
});
