import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const TAGS = ['sett-findings-view', 'sett-rule-row', 'sett-finding-row'];
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const settle = async (el: any) => {
  await el.updateComplete;
  await Promise.all(Array.from(el.querySelectorAll('*')).map((c: any) => c.updateComplete));
  await el.updateComplete;
};
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as any; await settle(el); return el; };
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true }));
const heard = (el: Element, type: string) => { const got: any[] = []; el.addEventListener(type, (e: any) => got.push(e.detail ?? null)); return got; };

const VIEW = (attrs = 'count="3" blocks="1"') => `<sett-findings-view ${attrs}>
  <sett-scope-line slot="scope"></sett-scope-line>
  <sett-rule-row name="leaky-port" level="blocks" count="1" open>
    <sett-finding-row name="Order → PaymentsHttp" at="order.rs:41" depth="1"></sett-finding-row>
  </sett-rule-row>
  <sett-rule-row name="cycle" count="2">
    <sett-finding-row name="store ↔ api" at="store/pg.rs:12" depth="1"></sett-finding-row>
    <sett-finding-row name="api ↔ domain" at="api/service.rs:8" depth="1"></sett-finding-row>
  </sett-rule-row>
</sett-findings-view>`;

beforeAll(() => Promise.all(TAGS.map((t) => customElements.whenDefined(t))));

describe('findings view', () => {
  it('every part uses tokens only and never animates', () => {
    for (const t of TAGS) {
      const c = cssOf(t);
      expect(c, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(c, t).not.toMatch(/\d+px/);
      expect(c, t).not.toMatch(/animation|transition|opacity/);
    }
  });
  it('the count line says how many and how many block, as the app wrote them', async () => {
    const v = await mount(VIEW());
    expect(v.shadowRoot.querySelector('.count').textContent.trim()).toBe('3 · 1 block');
    v.blocks = '0';
    await settle(v);
    expect(v.shadowRoot.querySelector('.count').textContent.trim()).toBe('3');
    v.count = undefined;
    await settle(v);
    expect(v.shadowRoot.querySelector('.count'), 'no count, no line: the empty state').toBeNull();
  });
  it("a rule row: its name, its count, the finding glyph in its level's colour", async () => {
    const v = await mount(VIEW());
    const [block, warn] = Array.from(v.querySelectorAll('sett-rule-row')) as any[];
    expect(block.shadowRoot.querySelector('.nm').textContent).toBe('leaky-port');
    expect(block.shadowRoot.querySelector('.mt').textContent).toBe('1');
    const lv = block.shadowRoot.querySelector('.lv');
    expect(lv.textContent).toBe('⚠');
    expect(lv.getAttribute('aria-label')).toBe('blocks');
    expect(warn.level, 'a rule warns unless it blocks').toBe('warns');
    expect(warn.shadowRoot.querySelector('.lv').getAttribute('aria-label')).toBe('warns');
    const c = cssOf('sett-rule-row');
    expect(c).toMatch(/\.lv \{[^}]*color: var\(--sett-color-sug\)/);
    expect(c).toMatch(/:host\(\[level='blocks'\]\) \.lv \{ color: var\(--sett-color-bad\)/);
  });
  it('a finding row: what breaks the rule, then where', async () => {
    const v = await mount(VIEW());
    const f = v.querySelector('sett-finding-row');
    expect(f.shadowRoot.querySelector('.nm').textContent).toBe('Order → PaymentsHttp');
    expect(f.shadowRoot.querySelector('.at').textContent).toBe('order.rs:41');
    expect(f.getAttribute('role')).toBe('treeitem');
    expect(f.getAttribute('aria-level')).toBe('2');
    expect(f.shadowRoot.querySelector('.cv'), 'a finding does not fold').toBeNull();
  });
  it('a finding row selects with its rule and place, and changes nothing itself', async () => {
    const v = await mount(VIEW());
    const got = heard(v, 'sett-select'); const opened = heard(v, 'sett-open');
    const f = v.querySelector('sett-finding-row');
    f.click();
    expect(got, 'the click is the finding row\'s alone, not its rule\'s (#115)').toEqual([{ kind: 'finding', name: 'Order → PaymentsHttp', rule: 'leaky-port', at: 'order.rs:41' }]);
    expect(f.selected).toBe(false);
    f.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
    expect(opened).toEqual([{ kind: 'finding', name: 'Order → PaymentsHttp', rule: 'leaky-port', at: 'order.rs:41' }]);
  });
  it('the chevron asks to fold; the app sets open', async () => {
    const v = await mount(VIEW());
    const got = heard(v, 'sett-fold'); const selects = heard(v, 'sett-select');
    const rule = v.querySelector('sett-rule-row[name="cycle"]');
    expect(rule.getAttribute('aria-expanded')).toBe('false');
    expect(rule.shadowRoot.querySelector('.kids'), 'folded, the findings are not drawn').toBeNull();
    rule.shadowRoot.querySelector('.cv').click();
    expect(got).toEqual([{ kind: 'rule', name: 'cycle', open: true }]);
    expect(selects, 'the chevron is the fold and nothing else').toEqual([]);
    expect(rule.open).toBe(false);
  });
  it('one tab stop; Up and Down move between the shown rows, folded findings left out', async () => {
    const v = await mount(VIEW());
    const rows = Array.from(v.querySelectorAll('sett-rule-row, sett-finding-row')) as any[];
    expect(rows.map((r) => r.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    rows[0].focus();
    key(rows[0], 'ArrowDown');
    expect(document.activeElement).toBe(rows[1]);
    key(rows[1], 'ArrowDown');
    expect(document.activeElement, 'cycle is folded: its findings are skipped').toBe(rows[2]);
    key(rows[2], 'ArrowUp');
    expect(document.activeElement).toBe(rows[1]);
    key(rows[1], 'ArrowLeft');
    expect(document.activeElement, 'Left steps out to the rule').toBe(rows[0]);
  });
  it('with only an empty state in it, the body is not a tree', async () => {
    const v = await mount('<sett-findings-view><sett-scope-line slot="scope"></sett-scope-line><div>no findings</div></sett-findings-view>');
    expect(v.shadowRoot.querySelector('.tree').hasAttribute('role')).toBe(false);
    const full = await mount(VIEW());
    expect(full.shadowRoot.querySelector('.tree').getAttribute('role')).toBe('tree');
    expect(full.shadowRoot.querySelector('.tree').getAttribute('aria-label')).toBe('findings');
  });
  it('the selected finding holds the tab stop', async () => {
    const v = await mount(VIEW());
    const f = v.querySelector('sett-finding-row');
    f.selected = true;
    await settle(v);
    await settle(f);
    expect(f.tabIndex).toBe(0);
    expect(f.getAttribute('aria-selected')).toBe('true');
    expect(v.querySelector('sett-rule-row').tabIndex).toBe(-1);
  });
});
