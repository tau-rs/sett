import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const TAGS = ['sett-files-view', 'sett-agent-strip', 'sett-tree-row'];
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const settle = async (el: any) => {
  await el.updateComplete;
  await Promise.all(Array.from(el.querySelectorAll('*')).map((c: any) => c.updateComplete));
  await el.updateComplete;
};
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as any; await settle(el); return el; };
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true }));
const heard = (el: Element, type: string) => { const got: any[] = []; el.addEventListener(type, (e: any) => got.push(e.detail ?? null)); return got; };

const VIEW = (attrs = '') => `<sett-files-view projection="directory" ${attrs}>
  <sett-scope-line slot="scope" scope="session" session="yk" scope-id="w1" name="refund flow"></sett-scope-line>
  <sett-agent-strip slot="agents" name="refund flow" group="group 1" agent="a2" open>
    <sett-group-row name="group 1" state="done"></sett-group-row>
    <sett-agent-row session="yk" name="a2 · PgOrderRepo: implement refund()" state="writing" depth="1" selected></sett-agent-row>
  </sett-agent-strip>
  <span slot="tools">filter · ⌘⇧F</span>
  <sett-tree-row kind="folder" name="store" open>
    <sett-tree-row kind="file" name="pg.rs" depth="1" session="yk" letter="M" writer="a2"></sett-tree-row>
    <sett-tree-row kind="file" name="pool.rs" depth="1" dim></sett-tree-row>
  </sett-tree-row>
  <sett-tree-row kind="folder" name="api"></sett-tree-row>
</sett-files-view>`;

beforeAll(() => Promise.all(TAGS.map((t) => customElements.whenDefined(t))));

describe('files view', () => {
  it('every part uses tokens only and never animates', () => {
    for (const t of TAGS) {
      const c = cssOf(t);
      expect(c, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(c, t).not.toMatch(/\d+px/);
      expect(c, t).not.toMatch(/animation|transition|opacity/);
    }
  });
  it('the projection seg reports and never switches itself', async () => {
    const v = await mount(VIEW());
    const items = Array.from(v.shadowRoot.querySelectorAll('sett-seg-item')) as any[];
    expect(items.map((i) => i.value)).toEqual(['directory', 'layers']);
    expect(items.map((i) => i.textContent.trim())).toEqual(['directory', 'layers']);
    expect(items.map((i) => i.active)).toEqual([true, false]);
    const got = heard(v, 'sett-projection'); const selects = heard(v, 'sett-select');
    items[1].click();
    expect(got).toEqual([{ value: 'layers' }]);
    expect(selects, 'the seg is not a row').toEqual([]);
    expect(v.projection).toBe('directory');
    expect(items.map((i) => i.active)).toEqual([true, false]);
    v.projection = 'layers';
    await settle(v);
    expect(items.map((i) => i.active)).toEqual([false, true]);
  });
  it('the writer shows only when the view is scoped (LEFT-6)', async () => {
    const v = await mount(VIEW());
    const row = v.querySelector('sett-tree-row[name="pg.rs"]');
    expect(row.shadowRoot.querySelector('.wr')).toBeNull();
    v.scoped = true;
    await settle(v);
    expect(row.shadowRoot.querySelector('.wr').textContent.trim()).toBe('a2');
    expect(row.shadowRoot.querySelector('.sl').getAttribute('data-letter')).toBe('M');
    v.scoped = false;
    await settle(v);
    expect(row.shadowRoot.querySelector('.wr')).toBeNull();
    // outside a files view (the Changes list) a writer is simply shown
    const loose = await mount('<sett-tree-row kind="file" name="pg.rs" writer="a2"></sett-tree-row>');
    expect(loose.shadowRoot.querySelector('.wr').textContent.trim()).toBe('a2');
  });
  it("the presence bar is the session's colour and nothing else marks presence", async () => {
    const v = await mount(VIEW());
    const row = v.querySelector('sett-tree-row[name="pg.rs"]');
    expect(row.shadowRoot.querySelector('.bar')).not.toBeNull();
    expect(v.querySelector('sett-tree-row[name="pool.rs"]').shadowRoot.querySelector('.bar')).toBeNull();
    const c = cssOf('sett-tree-row');
    expect(c).toMatch(/\.bar \{[^}]*width: var\(--sett-size-shell-presence-bar\)/);
    expect(c).toMatch(/\.bar \{[^}]*background: var\(--_scope\)/);
    expect(c).toMatch(/:host\(\[session\]:not\(\[scope\]\)\) \{ --_scope: var\(--_session\)/);
    expect(c).toMatch(/:host\(\[session="tl"\]\)[^}]*--_session: var\(--sett-session-tl-main\)/);
    expect(c).toMatch(/:host\(\[scope='you'\]\) \{ --_scope: var\(--sett-color-sel\)/);
    expect(row.shadowRoot.querySelector('sett-pill, sett-tag')).toBeNull();
    const you = await mount('<sett-tree-row kind="file" name="pool.rs" scope="you" letter="A"></sett-tree-row>');
    expect(you.shadowRoot.querySelector('.bar')).not.toBeNull();
  });
  it('is a tree of rows: folders and areas fold, files and items do not; the strip has a tree of its own', async () => {
    const v = await mount(VIEW());
    expect(v.shadowRoot.querySelector('.tree').getAttribute('role')).toBe('tree');
    const store = v.querySelector('sett-tree-row[name="store"]');
    expect(store.getAttribute('role')).toBe('treeitem');
    expect(store.getAttribute('aria-expanded')).toBe('true');
    expect(store.shadowRoot.querySelector('.cv').textContent).toBe('▾');
    const api = v.querySelector('sett-tree-row[name="api"]');
    expect(api.getAttribute('aria-expanded')).toBe('false');
    const file = v.querySelector('sett-tree-row[name="pg.rs"]');
    expect(file.hasAttribute('aria-expanded')).toBe(false);
    expect(file.getAttribute('aria-level')).toBe('2');
    // the keyboard walks the view's rows and leaves the strip's rows to the strip
    const [, pg, pool, apiRow] = [store, ...Array.from(v.querySelectorAll('sett-tree-row')).slice(1)] as any[];
    expect(store.tabIndex).toBe(0);
    store.focus();
    key(store, 'ArrowDown'); expect(document.activeElement).toBe(pg);
    key(pg, 'ArrowDown'); expect(document.activeElement).toBe(pool);
    key(pool, 'ArrowDown'); expect(document.activeElement).toBe(apiRow);
    key(apiRow, 'ArrowDown'); expect(document.activeElement).toBe(apiRow);
    key(apiRow, 'Home'); expect(document.activeElement).toBe(store);
    const strip = v.querySelector('sett-agent-strip');
    const agent = strip.querySelector('sett-agent-row');
    expect(agent.tabIndex, 'the selected strip row is the strip tab stop').toBe(0);
    const selects = heard(v, 'sett-select');
    key(agent, ' ');
    expect(selects).toEqual([{ kind: 'agent', name: 'a2 · PgOrderRepo: implement refund()', session: 'yk' }]);
    expect(v.querySelector('sett-scope-line').getAttribute('aria-label'), 'LEFT-8: the scope stays').toBe('scope: w1 · refund flow');
    const area = await mount('<sett-tree-row kind="area" name="api · driving" meta="4 items"></sett-tree-row>');
    expect(area.getAttribute('aria-expanded')).toBe('false');
    expect(area.shadowRoot.querySelector('.mt').textContent.trim()).toBe('4 items');
  });
  it('the agent strip: a header that reads the path and folds; rows only when open', async () => {
    const v = await mount(VIEW());
    const strip = v.querySelector('sett-agent-strip');
    const head = strip.shadowRoot.querySelector('.ah');
    expect(head.tagName).toBe('BUTTON');
    expect(head.getAttribute('aria-expanded')).toBe('true');
    expect(head.textContent.replace(/\s+/g, '')).toBe('refundflow›group1›a2▾');
    expect(head.querySelector('b').textContent).toBe('a2');
    expect(strip.shadowRoot.querySelector('.rows').getAttribute('role')).toBe('tree');
    const folds = heard(v, 'sett-fold');
    head.click();
    expect(folds).toEqual([{ kind: 'strip', name: 'refund flow', open: false }]);
    expect(strip.open).toBe(true);
    strip.open = false;
    await settle(strip);
    expect(strip.shadowRoot.querySelector('.rows')).toBeNull();
    expect(head.getAttribute('aria-expanded')).toBe('false');
  });
  it('a tree row reports a select, an open and a fold without changing itself', async () => {
    const row = await mount('<sett-tree-row kind="folder" name="store"></sett-tree-row>');
    const selects = heard(row, 'sett-select'); const opens = heard(row, 'sett-open'); const folds = heard(row, 'sett-fold');
    row.click();
    row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    row.shadowRoot.querySelector('.cv').click();
    expect(selects).toEqual([{ kind: 'folder', name: 'store' }]);
    expect(opens).toEqual([{ kind: 'folder', name: 'store' }]);
    expect(folds).toEqual([{ kind: 'folder', name: 'store', open: true }]);
    expect(row.open).toBe(false); expect(row.selected).toBe(false);
    const staged = await mount('<sett-tree-row kind="file" name="pg.rs" letter="M" stage="not staged"></sett-tree-row>');
    expect(staged.shadowRoot.querySelector('.stage').textContent.trim()).toBe('not staged');
  });
});
