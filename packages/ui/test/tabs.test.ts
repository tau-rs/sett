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
  it("a file tab opened in a scope is underlined in that scope's colour: the active tab's top bar", () => {
    const c = cssOf('sett-tab');
    // the bar is the active tab's; a plain tab's is sel, a scoped tab's comes from --_scope
    expect(c).toMatch(/:host \{[^}]*--_bar: var\(--sett-color-sel\);/);
    expect(c).toMatch(/:host\(\[active\]\) \{[^}]*box-shadow: inset 0 var\(--sett-stroke-lit\) 0 var\(--_bar\);/);
    expect(c).toContain(':host([scope]), :host([session]) { --_bar: var(--_scope); }');
    // scopeStyles: a session's colour, sel for you
    expect(c).toContain(":host([scope='session']) { --_scope: var(--_session);");
    expect(c).toContain(":host([scope='you']) { --_scope: var(--sett-color-sel);");
    // an inactive scoped tab carries no mark: the bar is drawn by the active rule and by nothing else
    expect(c.match(/var\(--_bar\)/g)).toHaveLength(1);
  });
  it('session alone still works and means scope session', async () => {
    expect(cssOf('sett-tab')).toContain(':host([session]:not([scope])) { --_scope: var(--_session); }');
    const t = await mount('<sett-tab mono active session="tl">pg.rs</sett-tab>');
    expect(t.session).toBe('tl');
    expect(t.hasAttribute('scope')).toBe(false);
    const y = await mount('<sett-tab mono active scope="you">pool.rs</sett-tab>');
    expect(y.scope).toBe('you');
    expect(y.getAttribute('scope')).toBe('you');
  });
  it('the label of a scoped tab stays ink2, ink when active: the scope colours the bar, never the name', () => {
    const c = cssOf('sett-tab');
    expect(c).not.toMatch(/[^-]color: var\(--_(session|scope|bar)\)/);
    expect(c).toMatch(/:host \{[^}]*[^-]color: var\(--sett-color-ink2\);/);
    expect(c).toMatch(/:host\(\[active\]\) \{[^}]*[^-]color: var\(--sett-color-ink\);/);
    // the focus ring still wins over the bar: it comes later, at the same weight
    expect(c.indexOf(':host(:focus-visible)')).toBeGreaterThan(c.indexOf(':host([active])'));
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
  it('the right end never wraps; when room runs out the tabs give way by scrolling, a tab never shrinks (#33)', async () => {
    const bar = cssOf('sett-tabbar');
    expect(bar).toMatch(/\.r \{[^}]*flex: none;[^}]*white-space: nowrap;/);
    expect(bar).toMatch(/\.tabs \{[^}]*display: flex;[^}]*min-width: 0;[^}]*overflow-x: auto;/);
    expect(cssOf('sett-tab')).toMatch(/:host \{[^}]*flex: none;/);
    const el = await mount('<sett-tabbar><sett-tab pinned>map</sett-tab><span slot="right">⌘1 map</span></sett-tabbar>');
    expect(el.shadowRoot.querySelector('.tabs').getAttribute('role'), 'only the tabs are the tablist').toBe('tablist');
  });
});
