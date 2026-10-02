import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import { scopeText } from '../src/scope.js';

const TAGS = ['sett-status-bar', 'sett-status-item'];
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const mount = async (m: string) => {
  document.body.innerHTML = m;
  const el = document.body.firstElementChild as any;
  await el.updateComplete;
  await Promise.all(Array.from(el.querySelectorAll('sett-status-item')).map((c: any) => c.updateComplete));
  return el;
};
const BAR = `<sett-status-bar>
  <sett-status-item scope="session" session="yk" scope-id="w1" name="refund flow"><span data-tone="sug">2 behind main</span></sett-status-item>
  <sett-status-item label="Sessions"><b>2</b> running · <span data-tone="sug">1 asks</span></sett-status-item>
  <sett-status-item label="Findings" href="#findings"><b>2</b> · <span data-tone="bad">1 blocks</span></sett-status-item>
  <sett-status-item slot="right">Ln 14, Col 9 · rust</sett-status-item>
  <sett-status-item slot="right"><span data-tone="ok">Map up to date · 2 s</span></sett-status-item>
</sett-status-bar>`;
const text = (el: any, sel: string) => el.shadowRoot.querySelector(sel).textContent.replace(/\s+/g, ' ').trim();

beforeAll(() => Promise.all(TAGS.map((t) => customElements.whenDefined(t))));

describe('status bar', () => {
  it('uses tokens only and never animates', () => {
    for (const t of TAGS) {
      const c = cssOf(t);
      expect(c, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(c, t).not.toMatch(/\d+px/);
      expect(c, t).not.toMatch(/animation|transition|opacity/);
    }
  });
  it('is a group named status, at the status height, with the right items pushed right', async () => {
    const bar = await mount(BAR);
    expect(bar.getAttribute('role')).toBe('group');
    expect(bar.getAttribute('aria-label')).toBe('status');
    expect(Array.from(bar.shadowRoot.querySelectorAll('slot')).map((s: any) => s.getAttribute('name'))).toEqual([null, 'right']);
    const c = cssOf('sett-status-bar');
    expect(c).toMatch(/height: var\(--sett-size-shell-status\)/);
    expect(c).toMatch(/\.right \{[^}]*margin-left: auto/);
  });
  it('holds no button: every item is a link, and Tab reaches each of them', async () => {
    const bar = await mount(BAR);
    const items = Array.from(bar.querySelectorAll('sett-status-item')) as any[];
    expect(items.length).toBe(5);
    expect(bar.shadowRoot.querySelector('button, [role="button"]')).toBeNull();
    for (const item of items) {
      expect(item.shadowRoot.querySelector('button, [role="button"]'), item.textContent).toBeNull();
      const anchor = item.shadowRoot.querySelector('a[href]');
      const reachable = anchor ? !anchor.hasAttribute('tabindex') : item.getAttribute('role') === 'link' && item.tabIndex === 0;
      expect(reachable, item.textContent).toBe(true);
    }
  });
  it('the scope item writes the scope with scopeText, after a dot in the scope colour', async () => {
    const session = await mount('<sett-status-item scope="session" session="tl" scope-id="w1" name="refund flow">2 behind main</sett-status-item>');
    expect(text(session, '.scope')).toBe(scopeText({ kind: 'session', id: 'w1', name: 'refund flow' }));
    expect(session.shadowRoot.querySelector('.dot')).not.toBeNull();
    expect(cssOf('sett-status-item')).toMatch(/\.dot \{[^}]*background: var\(--_scope\);/);
    const main = await mount('<sett-status-item scope="main">up to date</sett-status-item>');
    expect(text(main, '.scope')).toBe(scopeText({ kind: 'main' }));
    const plan = await mount('<sett-status-item scope="plan" name="refund flow"></sett-status-item>');
    expect(text(plan, '.scope')).toBe(scopeText({ kind: 'plan', name: 'refund flow' }));
    const you = await mount('<sett-status-item scope="you" name="fix-pool-size" locked>2 changed</sett-status-item>');
    expect(text(you, '.scope')).toBe(scopeText({ kind: 'you', name: 'fix-pool-size' }));
    expect(you.shadowRoot.querySelector('.lock').getAttribute('aria-label')).toBe('locked');
    const plain = await mount('<sett-status-item label="Sessions"><b>2</b> running</sett-status-item>');
    expect(plain.shadowRoot.querySelector('.dot')).toBeNull();
    expect(plain.shadowRoot.querySelector('.scope')).toBeNull();
    expect(text(plain, '.label')).toBe('Sessions');
  });
  it('without href the host is the link and Enter clicks it', async () => {
    const item = await mount('<sett-status-item label="Sessions"><b>2</b> running</sett-status-item>');
    expect(item.getAttribute('role')).toBe('link');
    expect(item.tabIndex).toBe(0);
    let clicks = 0;
    item.addEventListener('click', () => clicks++);
    item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(clicks).toBe(1);
    item.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(clicks).toBe(1);
  });
  it('with href it renders an anchor and the host stops being one', async () => {
    const item = await mount('<sett-status-item label="Findings" href="#findings"><b>2</b></sett-status-item>');
    expect(item.shadowRoot.querySelector('a').getAttribute('href')).toBe('#findings');
    expect(item.hasAttribute('role')).toBe(false);
    expect(item.hasAttribute('tabindex')).toBe(false);
    item.href = undefined;
    await item.updateComplete;
    expect(item.shadowRoot.querySelector('a')).toBeNull();
    expect(item.getAttribute('role')).toBe('link');
  });
  it('counts are ink and medium, tones are the accent colours', () => {
    const c = cssOf('sett-status-item');
    expect(c).toMatch(/::slotted\(b\) \{ font-weight: var\(--sett-font-weight-medium\); color: var\(--sett-color-ink\); \}/);
    for (const tone of ['sug', 'bad', 'ok']) expect(c).toContain(`::slotted([data-tone='${tone}']) { color: var(--sett-color-${tone}); }`);
  });
});
