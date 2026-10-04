import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const TAGS = ['sett-bottom-panel', 'sett-panel-tab', 'sett-panel-table', 'sett-panel-row', 'sett-panel-output', 'sett-panel-line'];
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const settle = async (el: any) => {
  await el.updateComplete;
  await Promise.all(Array.from(el.querySelectorAll('*')).map((c: any) => c.updateComplete));
  await el.updateComplete;
};
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as any; await settle(el); return el; };
const PANEL = (attrs = '') => `<sett-bottom-panel ${attrs}>
  <sett-panel-tab slot="tabs" value="findings" count="1" tone="bad">Findings</sett-panel-tab>
  <sett-panel-tab slot="tabs" value="checks" count="1" tone="sug">Checks</sett-panel-tab>
  <sett-panel-tab slot="tabs" value="terminal">Terminal</sett-panel-tab>
  <sett-panel-tab slot="tabs" value="whatsnew" count="2">What's new</sett-panel-tab>
  <span slot="act">w1 · refund flow</span>
  <sett-panel-table slot="findings" kind="findings">
    <sett-panel-row level="bad" selected><span>Order → PaymentsHttp</span><span>domain must not depend on clients · blocks</span><span data-mono>order.rs:41</span><span data-mono>core</span></sett-panel-row>
    <sett-panel-row level="sug"><span>team-payments not among reviewers</span><span>owners notified · warns</span><span data-mono>MR !42</span><span data-mono>core</span></sett-panel-row>
  </sett-panel-table>
  <sett-panel-table slot="checks" kind="checks"></sett-panel-table>
  <sett-panel-output slot="checks">$ cargo nextest run</sett-panel-output>
  <sett-panel-output slot="terminal">orderly $ cargo build</sett-panel-output>
  <sett-panel-line slot="whatsnew" when="3 min"><b>main</b> moved: 2 commits</sett-panel-line>
</sett-bottom-panel>`;
const bodySlots = (p: any) => Array.from(p.shadowRoot.querySelectorAll('.body slot')).map((s: any) => s.getAttribute('name'));
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true }));

beforeAll(() => Promise.all(TAGS.map((t) => customElements.whenDefined(t))));

describe('bottom panel', () => {
  it('every part uses tokens only and never animates', () => {
    for (const t of TAGS) {
      const c = cssOf(t);
      expect(c, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(c, t).not.toMatch(/\d+px/);
      expect(c, t).not.toMatch(/animation|transition|opacity/);
    }
  });
  it('renders only the active body, as a tabpanel', async () => {
    const p = await mount(PANEL('active="checks"'));
    expect(bodySlots(p)).toEqual(['checks']);
    expect(p.shadowRoot.querySelector('.body').getAttribute('role')).toBe('tabpanel');
    p.active = 'terminal';
    await settle(p);
    expect(bodySlots(p)).toEqual(['terminal']);
  });
  it('fills a host with a height: the body takes what the strip leaves, the terminal takes the body', () => {
    const c = cssOf('sett-bottom-panel');
    expect(c).toMatch(/:host \{[^}]*display: flex;[^}]*flex-direction: column;/);
    expect(c).toMatch(/\.strip \{[^}]*flex: none;/);
    expect(c).toMatch(/\.body \{[^}]*flex: 1;[^}]*min-height: 0;[^}]*overflow: auto;/);
    expect(c).toContain(":host([active='terminal']) .body { display: flex; flex-direction: column; }");
    expect(c).toContain("::slotted([slot='terminal']) { flex: 1 1 auto; min-height: 0; }");
  });
  it('the lists keep their flow: only the terminal grows, and nothing is a fixed height but the strip', () => {
    const c = cssOf('sett-bottom-panel');
    expect(c.match(/::slotted\([^)]*\)/g)).toEqual(["::slotted([slot='terminal'])"]);
    // the one flex body is the terminal's (asserted above): findings, checks and what's new stay in block flow
    expect(c.match(/\.body \{ display: flex/g)).toHaveLength(1);
    expect(c.match(/(^|[^-])height:[^;]*/gm)?.map((h) => h.trim())).toEqual(['height: var(--sett-size-shell-strip)']);
  });
  it('closed keeps the tabs and their counts on a strip, and shows no body', async () => {
    const p = await mount(PANEL('active="findings" closed'));
    expect(p.shadowRoot.querySelector('.body')).toBeNull();
    expect(p.shadowRoot.querySelector('slot[name="tabs"]')).not.toBeNull();
    const tabs = Array.from(p.querySelectorAll('sett-panel-tab')) as any[];
    expect(tabs.map((t) => t.shadowRoot.querySelector('.badge')?.textContent.trim() ?? null)).toEqual(['1', '1', null, '2']);
    expect(tabs.map((t) => t.shadowRoot.querySelector('.badge')?.getAttribute('data-tone') ?? null)).toEqual(['bad', 'sug', null, null]);
    expect(cssOf('sett-bottom-panel')).toMatch(/\.strip \{[^}]*height: var\(--sett-size-shell-strip\)/);
  });
  it('the strip is a tablist of tabs; the open tab is the selected one, none when closed', async () => {
    const p = await mount(PANEL('active="checks"'));
    expect(p.shadowRoot.querySelector('.tabs').getAttribute('role')).toBe('tablist');
    const tabs = Array.from(p.querySelectorAll('sett-panel-tab')) as any[];
    expect(tabs.every((t) => t.getAttribute('role') === 'tab' && t.tabIndex === 0)).toBe(true);
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false', 'false']);
    expect(tabs.map((t) => t.hasAttribute('active'))).toEqual([false, true, false, false]);
    p.closed = true;
    await settle(p);
    expect(tabs.map((t) => t.hasAttribute('active'))).toEqual([false, false, false, false]);
  });
  it('a tab fires sett-select with its value, by click, Enter and Space; the panel changes nothing itself', async () => {
    const p = await mount(PANEL('active="findings" closed'));
    const seen: string[] = [];
    p.addEventListener('sett-select', (e: any) => seen.push(e.detail.value));
    const [, checks, terminal, whatsnew] = p.querySelectorAll('sett-panel-tab');
    checks.click();
    key(terminal, 'Enter');
    key(whatsnew, ' ');
    expect(seen).toEqual(['checks', 'terminal', 'whatsnew']);
    await settle(p);
    expect(p.active).toBe('findings');
    expect(p.closed).toBe(true);
  });
  it('the caret fires sett-toggle with the state asked for, and does not flip the panel', async () => {
    const p = await mount(PANEL('active="findings"'));
    const seen: boolean[] = [];
    p.addEventListener('sett-toggle', (e: any) => seen.push(e.detail.closed));
    const caret = () => p.shadowRoot.querySelector('.caret');
    expect(caret().getAttribute('aria-expanded')).toBe('true');
    caret().click();
    expect(seen).toEqual([true]);
    await settle(p);
    expect(p.closed).toBe(false);
    p.closed = true;
    await settle(p);
    expect(caret().getAttribute('aria-expanded')).toBe('false');
    caret().click();
    expect(seen).toEqual([true, false]);
  });
  it('the table has the roles of a table and the header of its kind', async () => {
    const p = await mount(PANEL('active="findings"'));
    const [findings, checks] = p.querySelectorAll('sett-panel-table');
    const heads = (t: any) => Array.from(t.shadowRoot.querySelectorAll('[role="row"] [role="columnheader"]')).map((h: any) => h.textContent.trim());
    expect(findings.getAttribute('role')).toBe('table');
    expect(heads(findings)).toEqual(['level', 'finding', 'rule', 'witness', 'origin']);
    expect(heads(checks)).toEqual(['state', 'check', 'where', 'result', 'when']);
    const row = findings.querySelector('sett-panel-row');
    expect(row.getAttribute('role')).toBe('row');
    expect(Array.from(row.children).every((c: any) => c.getAttribute('role') === 'cell')).toBe(true);
    expect(row.shadowRoot.querySelector('[role="cell"] .lv')).not.toBeNull();
  });
  it('header and rows share one column grid, set by the table kind', () => {
    const t = cssOf('sett-panel-table');
    expect(t).toMatch(/:host \{[^}]*--_cols:/);
    expect(t).toMatch(/:host\(\[kind='checks'\]\) \{ --_cols:/);
    expect(t).toMatch(/\.head \{[^}]*grid-template-columns: var\(--_cols\)/);
    expect(cssOf('sett-panel-row')).toMatch(/grid-template-columns: var\(--_cols/);
  });
  it('a row is focusable and opens by click or Enter; selected takes the sel tint', async () => {
    const p = await mount(PANEL('active="findings"'));
    const [first, second] = p.querySelectorAll('sett-panel-row');
    expect(first.tabIndex).toBe(0);
    let opened: Element[] = [];
    p.addEventListener('sett-open', (e: any) => opened.push(e.target));
    second.click();
    key(first, 'Enter');
    expect(opened).toEqual([second, first]);
    const c = cssOf('sett-panel-row');
    expect(c).toMatch(/:host\(\[selected\]\) \{ background: var\(--sett-color-sel-bg\); \}/);
    expect(c).toMatch(/:host\(\[level='bad'\]\) \.lv \{ background: var\(--sett-color-bad\); \}/);
    // bad on the sel tint is under 4.5:1 in dark: on a selected row a tone falls back to ink
    expect(c).toMatch(/:host\(\[selected\]\) ::slotted\(\[data-tone\]\) \{ color: var\(--sett-color-ink\); \}/);
  });
  it('rows never wrap and cells end in an ellipsis; mono cells are 11 px mute', () => {
    const c = cssOf('sett-panel-row');
    expect(c).toMatch(/:host \{[^}]*white-space: nowrap/);
    expect(c).toMatch(/:host \{[^}]*height: var\(--sett-size-shell-row\)/);
    expect(c).toMatch(/::slotted\(\*\) \{[^}]*overflow: hidden;[^}]*text-overflow: ellipsis/);
    expect(c).toMatch(/::slotted\(\[data-mono\]\) \{ font-family: var\(--sett-font-mono\); font-size: var\(--sett-font-size-sm\); color: var\(--sett-color-mute\); \}/);
  });
  it('the output is a mono block that keeps its line breaks', () => {
    const c = cssOf('sett-panel-output');
    expect(c).toMatch(/font-family: var\(--sett-font-mono\)/);
    expect(c).toMatch(/font-size: var\(--sett-font-size-md\)/);
    expect(c).toMatch(/white-space: pre/);
    expect(c).toMatch(/border-top: var\(--sett-stroke-hair\) solid var\(--sett-color-line2\)/);
  });
  it("a what's new line is a link with its time at the right", async () => {
    const line = await mount('<sett-panel-line when="3 min"><b>main</b> moved: 2 commits</sett-panel-line>');
    expect(line.getAttribute('role')).toBe('link');
    expect(line.tabIndex).toBe(0);
    expect(line.shadowRoot.querySelector('.when').textContent).toBe('3 min');
    let clicks = 0;
    line.addEventListener('click', () => clicks++);
    key(line, 'Enter');
    expect(clicks).toBe(1);
    const anchor = await mount('<sett-panel-line when="1 h" href="#new"><b>refund flow</b> is 2 behind main</sett-panel-line>');
    expect(anchor.shadowRoot.querySelector('a').getAttribute('href')).toBe('#new');
    expect(anchor.hasAttribute('role')).toBe(false);
    const bare = await mount('<sett-panel-line><b>main</b> moved</sett-panel-line>');
    expect(bare.shadowRoot.querySelector('.when')).toBeNull();
  });
});
