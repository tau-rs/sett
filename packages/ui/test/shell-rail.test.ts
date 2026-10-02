import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const TAGS = ['sett-activity-rail', 'sett-rail-item'];
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const mount = async (m: string) => {
  document.body.innerHTML = m;
  const el = document.body.firstElementChild as any;
  await el.updateComplete;
  await Promise.all(Array.from(el.children).map((c: any) => c.updateComplete));
  await el.updateComplete;
  return el;
};
const RAIL = (attrs = '') => `<sett-activity-rail aria-label="views" ${attrs}>
  <sett-rail-item value="sessions" active badge="1" badge-label="1 asks you"><svg slot="glyph"></svg>Sessions</sett-rail-item>
  <sett-rail-item value="files"><svg slot="glyph"></svg>Files</sett-rail-item>
  <sett-rail-item value="findings" badge="2" tone="bad" badge-label="2 new blocking findings"><svg slot="glyph"></svg>Findings</sett-rail-item>
</sett-activity-rail>`;
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true }));

beforeAll(() => Promise.all(TAGS.map((t) => customElements.whenDefined(t))));

describe('activity rail', () => {
  it('uses tokens only and never animates', () => {
    for (const t of TAGS) {
      const c = cssOf(t);
      expect(c, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(c, t).not.toMatch(/\d+px/);
      expect(c, t).not.toMatch(/animation|transition|opacity/);
    }
  });
  it('is a vertical tablist of tabs, the active one selected', async () => {
    const rail = await mount(RAIL());
    expect(rail.getAttribute('role')).toBe('tablist');
    expect(rail.getAttribute('aria-orientation')).toBe('vertical');
    const [sessions, files] = rail.querySelectorAll('sett-rail-item');
    expect(sessions.getAttribute('role')).toBe('tab');
    expect(sessions.getAttribute('aria-selected')).toBe('true');
    expect(files.getAttribute('aria-selected')).toBe('false');
  });
  it('keeps the badges and the scope bar when the left pane is closed', async () => {
    const rail = await mount(RAIL('closed scope="session" session="tl"'));
    expect(rail.hasAttribute('closed')).toBe(true);
    const [sessions, , findings] = rail.querySelectorAll('sett-rail-item');
    expect(sessions.shadowRoot.querySelector('.badge').textContent.trim()).toBe('1');
    expect(findings.shadowRoot.querySelector('.badge').getAttribute('data-tone')).toBe('bad');
    expect(sessions.hasAttribute('active')).toBe(true);
    // closed is a fact for the consumer: no rule reads it, in the rail or in the item
    for (const t of TAGS) expect(cssOf(t), t).not.toContain('closed');
  });
  it('the active bar is sel on main and the scope colour otherwise', () => {
    const rail = cssOf('sett-activity-rail');
    expect(rail).toMatch(/:host \{[^}]*--_rail-bar: var\(--sett-color-sel\);/);
    expect(rail).toMatch(/:host\(\[scope='session'\]\), :host\(\[scope='you'\]\), :host\(\[scope='plan'\]\) \{ --_rail-bar: var\(--_scope\); \}/);
    const item = cssOf('sett-rail-item');
    expect(item).toMatch(/border-left: var\(--sett-size-shell-scope-bar\) solid transparent/);
    expect(item).toMatch(/:host\(\[active\]\) \{[^}]*border-left-color: var\(--_rail-bar, var\(--sett-color-sel\)\);/);
  });
  it('fires sett-view with active false for another item, true for the active one, and changes nothing itself', async () => {
    const rail = await mount(RAIL());
    const seen: any[] = [];
    rail.addEventListener('sett-view', (e: any) => seen.push(e.detail));
    const [sessions, files] = rail.querySelectorAll('sett-rail-item');
    files.click();
    sessions.click();
    expect(seen).toEqual([{ value: 'files', active: false }, { value: 'sessions', active: true }]);
    await rail.updateComplete;
    expect(sessions.active).toBe(true);
    expect(files.active).toBe(false);
  });
  it('Enter and Space activate the focused item', async () => {
    const rail = await mount(RAIL());
    const seen: any[] = [];
    rail.addEventListener('sett-view', (e: any) => seen.push(e.detail.value));
    const [, files, findings] = rail.querySelectorAll('sett-rail-item');
    key(files, 'Enter');
    key(findings, ' ');
    expect(seen).toEqual(['files', 'findings']);
  });
  it('one tab stop, on the active item; arrow keys move focus and wrap', async () => {
    const rail = await mount(RAIL());
    const [sessions, files, findings] = rail.querySelectorAll('sett-rail-item');
    expect([sessions.tabIndex, files.tabIndex, findings.tabIndex]).toEqual([0, -1, -1]);
    sessions.focus();
    key(sessions, 'ArrowDown');
    expect(document.activeElement).toBe(files);
    key(files, 'ArrowDown');
    expect(document.activeElement).toBe(findings);
    key(findings, 'ArrowDown');
    expect(document.activeElement).toBe(sessions);
    key(sessions, 'ArrowUp');
    expect(document.activeElement).toBe(findings);
    key(findings, 'Home');
    expect(document.activeElement).toBe(sessions);
    key(sessions, 'End');
    expect(document.activeElement).toBe(findings);
  });
  it('with no active item the first one is the tab stop', async () => {
    const rail = await mount('<sett-activity-rail><sett-rail-item value="a">A</sett-rail-item><sett-rail-item value="b">B</sett-rail-item></sett-activity-rail>');
    const [a, b] = rail.querySelectorAll('sett-rail-item');
    expect([a.tabIndex, b.tabIndex]).toEqual([0, -1]);
  });
  it('the label is always rendered: never an icon alone, never vertical', async () => {
    const rail = await mount(RAIL());
    for (const item of rail.querySelectorAll('sett-rail-item')) {
      const slots = Array.from(item.shadowRoot.querySelectorAll('slot')) as HTMLSlotElement[];
      expect(slots.map((s) => s.getAttribute('name'))).toEqual(['glyph', null]);
      expect(item.textContent.trim()).not.toBe('');
    }
    const c = cssOf('sett-rail-item');
    expect(c).not.toMatch(/display: none|visibility|writing-mode|text-indent|rotate/);
  });
  it('a badge reads its label; an item without a count has no badge', async () => {
    const rail = await mount(RAIL());
    const [sessions, files] = rail.querySelectorAll('sett-rail-item');
    const badge = sessions.shadowRoot.querySelector('.badge');
    expect(badge.getAttribute('data-tone')).toBe('sug');
    expect(badge.getAttribute('aria-label')).toBe('1 asks you');
    expect(files.shadowRoot.querySelector('.badge')).toBeNull();
  });
});
