import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import '../src/index.js';
import { GROUP_STATES, GROUP_TONE } from '../src/shell/sett-sessions-view.js';

const TAGS = ['sett-sessions-view', 'sett-view-section', 'sett-session-row', 'sett-group-row', 'sett-agent-row', 'sett-element-row', 'sett-file-row', 'sett-changes-row', 'sett-new-session-row'];
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
// the session dot's breath (dotStyles) is the one motion allowed in these rows; everything else must be still
const stillCss = (tag: string) => cssOf(tag).replace(/\.dot\[data-pulse\][^}]*\}/g, '').replace(/@keyframes sett-dot-pulse[^}]*\}[^}]*\}/g, '').replace(/@media \(prefers-reduced-motion: reduce\)[^}]*\}[^}]*\}/g, '');
const settle = async (el: any) => {
  await el.updateComplete;
  await Promise.all(Array.from(el.querySelectorAll('*')).map((c: any) => c.updateComplete));
  await el.updateComplete;
};
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as any; await settle(el); return el; };
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true }));
const heard = (el: Element, type: string) => { const got: any[] = []; el.addEventListener(type, (e: any) => got.push(e.detail ?? null)); return got; };

const VIEW = (attrs = '', sessionAttrs = 'open') => `<sett-sessions-view ${attrs}>
  <sett-view-section label="needs you" count="1">
    <sett-session-row scope="session" session="tl" name="webhook retries" state="asks you" tone="sug"></sett-session-row>
  </sett-view-section>
  <sett-view-section label="running" count="1">
    <sett-session-row scope="session" session="yk" name="refund flow" state="gate · group 1 → group 2" tone="session" ${sessionAttrs}>
      <sett-group-row name="group 1" state="done" depth="1" open>
        <sett-agent-row session="yk" name="a2 · PgOrderRepo: implement refund()" state="writing" depth="2" open>
          <sett-file-row letter="M" name="store/pg.rs" counts="+18 −2" depth="3"></sett-file-row>
        </sett-agent-row>
      </sett-group-row>
      <sett-group-row kind="gate" name="gate · group 1 → group 2" state="judge" depth="1"></sett-group-row>
      <sett-changes-row depth="1" meta="2 ahead · MR !42 · gated"></sett-changes-row>
    </sett-session-row>
  </sett-view-section>
  <sett-new-session-row slot="foot"></sett-new-session-row>
</sett-sessions-view>`;

beforeAll(() => Promise.all(TAGS.map((t) => customElements.whenDefined(t))));

describe('sessions view', () => {
  it('every part uses tokens only, and only the session dot may breathe', () => {
    for (const t of TAGS) {
      const c = stillCss(t);
      expect(c, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(c, t).not.toMatch(/\d+px/);
      expect(c, t).not.toMatch(/animation|transition|opacity/);
    }
  });
  it('is a tree of sections and rows, with levels from the depth', async () => {
    const v = await mount(VIEW());
    expect(v.shadowRoot.querySelector('[role="tree"]')).not.toBeNull();
    expect(v.querySelector('sett-view-section').getAttribute('role')).toBe('group');
    expect(v.querySelector('sett-view-section').getAttribute('aria-label')).toBe('needs you');
    const rows = Array.from(v.querySelectorAll('sett-session-row, sett-group-row, sett-agent-row, sett-file-row, sett-changes-row')) as any[];
    expect(rows.every((r) => r.getAttribute('role') === 'treeitem')).toBe(true);
    expect(rows.map((r) => r.getAttribute('aria-level'))).toEqual(['1', '1', '2', '3', '4', '2', '2']);
    const session = v.querySelector('sett-session-row[open]');
    expect(session.getAttribute('aria-expanded')).toBe('true');
    expect(session.shadowRoot.querySelector('.kids').getAttribute('role')).toBe('group');
    expect(v.querySelector('sett-file-row').hasAttribute('aria-expanded')).toBe(false);
  });
  it('renders children only while open, and the chevron asks to fold rather than folding', async () => {
    const v = await mount(VIEW('', ''));
    const session = v.querySelector('sett-session-row[name="refund flow"]');
    expect(session.shadowRoot.querySelector('slot')).toBeNull();
    expect(session.shadowRoot.querySelector('.cv').textContent).toBe('▸');
    const folds = heard(v, 'sett-fold');
    session.shadowRoot.querySelector('.cv').click();
    expect(folds).toEqual([{ kind: 'session', name: 'refund flow', session: 'yk', open: true }]);
    expect(session.open).toBe(false);
    session.open = true;
    await settle(session);
    expect(session.shadowRoot.querySelector('.kids slot')).not.toBeNull();
    expect(session.shadowRoot.querySelector('.cv').textContent).toBe('▾');
  });
  it('a click on a nested row selects that row only, never the rows around it (#115)', async () => {
    const v = await mount(VIEW());
    const agent = v.querySelector('sett-agent-row'), file = v.querySelector('sett-file-row');
    const selects = heard(v, 'sett-select'), opens = heard(v, 'sett-open');
    agent.shadowRoot.querySelector('.row').click();
    expect(selects.map((d: any) => d.kind)).toEqual(['agent']);
    file.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
    expect(opens.map((d: any) => d.kind)).toEqual(['file']);
  });
  it('a click selects, Enter and the Focus button focus, and nothing changes the row itself', async () => {
    const v = await mount(VIEW());
    const row = v.querySelector('sett-session-row[name="refund flow"]');
    const selects = heard(v, 'sett-select'); const focuses = heard(v, 'sett-focus');
    row.click();
    expect(selects).toEqual([{ kind: 'session', name: 'refund flow', session: 'yk' }]);
    expect(row.selected).toBe(false);
    expect(row.shadowRoot.querySelector('sett-button')).toBeNull();
    row.selected = true;
    await settle(row);
    const button = row.shadowRoot.querySelector('sett-button');
    expect(button.textContent.trim()).toBe('focus');
    button.click();
    key(row, 'Enter');
    expect(focuses).toEqual([{ kind: 'session', name: 'refund flow', session: 'yk' }, { kind: 'session', name: 'refund flow', session: 'yk' }]);
    expect(selects.length, 'the button is not a click on the row').toBe(1);
  });
  it('scoped shows the scope tag in the session tint instead of the button; the dot is the scope colour', async () => {
    const v = await mount(VIEW());
    const row = v.querySelector('sett-session-row[name="refund flow"]');
    row.selected = true; row.scoped = true;
    await settle(row);
    expect(row.shadowRoot.querySelector('sett-button')).toBeNull();
    const tag = row.shadowRoot.querySelector('.scope');
    expect(tag.textContent.trim()).toBe('scope');
    expect(tag.getAttribute('kind')).toBe('session');
    expect(tag.getAttribute('session')).toBe('yk');
    expect(cssOf('sett-session-row')).toMatch(/\.dot \{[^}]*background: var\(--_scope\)/);
    const you = await mount('<sett-session-row scope="you" name="fix-pool-size" state="🔒 locked" scoped></sett-session-row>');
    expect(you.shadowRoot.querySelector('.scope').getAttribute('kind')).toBe('sel');
  });
  it('isolated: the header is a link that unfocuses, and so is Esc', async () => {
    const v = await mount(VIEW('isolated count="4"'));
    const header = v.shadowRoot.querySelector('.all');
    expect(header.getAttribute('role')).toBe('link');
    expect(header.querySelector('b').textContent).toBe('‹ all sessions');
    expect(header.textContent).toContain('· 4');
    const got = heard(v, 'sett-unfocus');
    header.click();
    key(v.querySelector('sett-file-row'), 'Escape');
    expect(got.length).toBe(2);
    const plain = await mount(VIEW());
    expect(plain.shadowRoot.querySelector('.all')).toBeNull();
    key(plain.querySelector('sett-file-row'), 'Escape');
    expect(heard(plain, 'sett-unfocus').length).toBe(0);
  });
  it('the keyboard: one tab stop, Up and Down between shown rows, Right and Left fold and step', async () => {
    const v = await mount(VIEW());
    const [asks, refund, group, agent, file, gate, changes] = Array.from(v.querySelectorAll('sett-session-row, sett-group-row, sett-agent-row, sett-file-row, sett-changes-row')) as any[];
    expect([asks, refund, group, agent, file, gate, changes].map((r) => r.tabIndex)).toEqual([0, -1, -1, -1, -1, -1, -1]);
    asks.focus();
    key(asks, 'ArrowDown'); expect(document.activeElement).toBe(refund);
    key(refund, 'ArrowDown'); expect(document.activeElement).toBe(group);
    key(group, 'ArrowRight'); expect(document.activeElement).toBe(agent);
    const folds = heard(v, 'sett-fold');
    key(agent, 'ArrowLeft'); expect(document.activeElement).toBe(agent);
    expect(folds.length).toBe(1); expect(folds[0].open).toBe(false);
    key(agent, 'ArrowDown'); expect(document.activeElement).toBe(file);
    key(file, 'ArrowLeft'); expect(document.activeElement).toBe(agent);
    key(agent, 'End'); expect(document.activeElement).toBe(changes);
    expect(refund.tabIndex).toBe(-1); expect(changes.tabIndex).toBe(0);
    key(changes, 'ArrowDown'); expect(document.activeElement).toBe(changes);
    // folded rows are skipped
    gate.open = false; agent.open = false; await settle(v);
    key(changes, 'ArrowUp'); expect(document.activeElement).toBe(gate);
    key(gate, 'ArrowUp'); expect(document.activeElement).toBe(agent);
    key(agent, 'ArrowRight');
    expect(folds[folds.length - 1]).toMatchObject({ kind: 'agent', open: true });
    const selects = heard(v, 'sett-select'); const opens = heard(v, 'sett-open');
    key(agent, ' '); expect(selects).toEqual([{ kind: 'agent', name: 'a2 · PgOrderRepo: implement refund()', session: 'yk' }]);
    key(file, 'Enter'); expect(opens).toEqual([{ kind: 'file', name: 'store/pg.rs' }]);
  });
  it("group rows say rule 7's words, with the tone each implies; a gate row reads judge in sug", () => {
    const design = readFileSync(resolve(process.cwd(), '../../DESIGN.md'), 'utf8');
    const rule = design.split('\n').find((l) => /^7\. (\*\*)?Session-card rows/.test(l))!;
    const words = rule.split('its right cell reads the gate in the same plain words: ')[1].split('.')[0].split(' · ').map((w) => w.replace(/`/g, ''));
    expect(GROUP_STATES).toEqual(words);
    expect(GROUP_TONE).toEqual({ done: 'ok', running: 'default', gate: 'sug', failed: 'bad', waiting: 'sug', judge: 'sug' });
  });
  it('rows show their state as a tag, their meta in mono, and the file row its letter, counts and viewed mark', async () => {
    const v = await mount(VIEW());
    const tagOf = (el: any) => el.shadowRoot.querySelector('sett-tag');
    expect(tagOf(v.querySelector('sett-session-row[name="webhook retries"]')).getAttribute('kind')).toBe('sug');
    expect(tagOf(v.querySelector('sett-group-row[name="group 1"]')).getAttribute('kind')).toBe('ok');
    const failed = await mount('<sett-group-row name="group 2" state="failed 1/3"></sett-group-row>');
    expect(tagOf(failed).getAttribute('kind')).toBe('bad');
    expect(tagOf(failed).textContent.trim()).toBe('failed 1/3');
    const gate = await mount(VIEW()).then((x) => x.querySelector('sett-group-row[kind="gate"]'));
    expect(tagOf(gate).getAttribute('kind')).toBe('sug');
    expect(gate.shadowRoot.querySelector('.cv').textContent).toBe('');
    const file = await mount('<sett-file-row letter="D" name="old.rs" counts="−40" viewed></sett-file-row>');
    expect(file.shadowRoot.querySelector('.sl').getAttribute('data-letter')).toBe('D');
    expect(file.shadowRoot.querySelector('.mt').textContent.trim()).toBe('−40');
    expect(file.shadowRoot.querySelector('.viewed').textContent.trim()).toBe('✓');
    expect(cssOf('sett-file-row')).toMatch(/\.nm \{[^}]*font-family: var\(--sett-font-mono\)/);
    const meta = await mount('<sett-session-row scope="you" name="fix-pool-size" meta="main · 2 files" dim></sett-session-row>');
    expect(meta.shadowRoot.querySelector('.mt').textContent.trim()).toBe('main · 2 files');
    const changes = await mount('<sett-changes-row meta="2 ahead · MR !42 · gated"></sett-changes-row>');
    expect(changes.shadowRoot.querySelector('.nm').textContent.trim()).toBe('changes');
    const opens = heard(changes, 'sett-open');
    changes.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(opens).toEqual([{ kind: 'changes', name: 'changes' }]);
  });
  it('the new-session row is a link, mute, outside the tree', async () => {
    const v = await mount(VIEW());
    const door = v.querySelector('sett-new-session-row');
    expect(door.getAttribute('role')).toBe('link');
    expect(door.tabIndex).toBe(0);
    expect(door.shadowRoot.textContent.replace(/\s+/g, ' ').trim()).toBe('+ new session · delegate');
    expect(v.shadowRoot.querySelector('[role="tree"] slot[name="foot"]')).toBeNull();
    expect(cssOf('sett-new-session-row')).toMatch(/color: var\(--sett-color-mute\)/);
  });
  it('a plan element has its own row: a sug dot, its name, no fold; the keyboard reaches it and a click selects it', async () => {
    const v = await mount(`<sett-sessions-view>
      <sett-session-row scope="plan" name="refund flow" state="shaping" tone="sug" open>
        <sett-group-row name="group 1" state="2 elements" depth="1" open>
          <sett-element-row name="E1 · OrderRepo: add refund()" depth="2"></sett-element-row>
          <sett-element-row name="E2 · PgOrderRepo: implement refund()" depth="2" state="asks"></sett-element-row>
        </sett-group-row>
      </sett-session-row>
    </sett-sessions-view>`);
    const [plan, group, e1, e2] = Array.from(v.querySelectorAll('sett-session-row, sett-group-row, sett-element-row')) as any[];
    expect(e1.kind).toBe('element');
    expect(e1.foldable).toBe(false);
    expect(e1.shadowRoot.querySelector('.cv').textContent).toBe('');
    expect(e1.shadowRoot.querySelector('.nm').textContent).toBe('E1 · OrderRepo: add refund()');
    expect(e1.shadowRoot.querySelector('sett-tag')).toBeNull();
    expect(e2.shadowRoot.querySelector('sett-tag').getAttribute('kind')).toBe('sug');
    expect(cssOf('sett-element-row')).toMatch(/\.dot \{[^}]*background: var\(--sett-color-sug\);/);
    plan.focus();
    key(plan, 'ArrowDown'); key(group, 'ArrowDown'); expect(document.activeElement).toBe(e1);
    key(e1, 'ArrowDown'); expect(document.activeElement).toBe(e2);
    const picked = heard(v, 'sett-select');
    e2.shadowRoot.querySelector('.row').click();
    expect(picked.at(-1)).toMatchObject({ kind: 'element', name: 'E2 · PgOrderRepo: implement refund()' });
  });
});
