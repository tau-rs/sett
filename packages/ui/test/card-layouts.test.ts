import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const settle = async (el: any) => {
  await el.updateComplete;
  await Promise.all(Array.from(el.querySelectorAll('*')).map((c: any) => c.updateComplete));
  await el.updateComplete;
};
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as any; await settle(el); return el; };
const heard = (el: Element, type: string) => { const got: any[] = []; el.addEventListener(type, (e: any) => got.push(e.detail ?? null)); return got; };

const CHECKLIST = `<sett-card variant="checklist"><span slot="title">merge !44 → main</span><sett-pill slot="state" kind="sug">2 blocking</sett-pill>
  <sett-card-row mark="✓" kind="ok" nav="rate limits">plan 6/6 realized · 2 gates passed</sett-card-row>
  <sett-card-row mark="⚠" kind="sug" nav="jump">remarks asking for a change · 2 open</sett-card-row>
  <sett-card-row mark="⚠" kind="sug" nav="next unread">files viewed · 3 / 6</sett-card-row>
  <sett-card-row mark="✓" kind="ok">current with main<span slot="right">40 min</span></sett-card-row>
  <sett-card-row mark="·" kind="mute">approved<span slot="right">not yet</span></sett-card-row>
  <sett-card-row mark="·" kind="mute">plan · none · hand-made branch</sett-card-row>
  <span slot="how">squash · from the forge's default · delete branch · archive session</span>
  <sett-gated-button slot="acts" blocked>approve · merge<sett-pill slot="reason" kind="sug">2 remarks open</sett-pill><sett-pill slot="reason" kind="sug">3 files unviewed</sett-pill></sett-gated-button>
  <span slot="note">arch never merges on its own</span></sett-card>`;

beforeAll(() => Promise.all(['sett-card', 'sett-card-row', 'sett-kv-row', 'sett-gated-button'].map((t) => customElements.whenDefined(t))));

describe('card layouts', () => {
  it('kv rows use tokens only and never animate', () => {
    const c = cssOf('sett-kv-row');
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(c).not.toMatch(/\d+px/);
    expect(c).not.toMatch(/animation|transition|opacity/);
  });
  it('checklist: a link row is a link, a fact row is not; the how block and the note sit under the rows; the merge is gated', async () => {
    const card = await mount(CHECKLIST);
    const rows = Array.from(card.querySelectorAll('sett-card-row')) as any[];
    expect(rows.map((r) => r.getAttribute('role'))).toEqual(['link', 'link', 'link', null, null, null]);
    expect(rows.map((r) => r.shadowRoot.querySelector('.g').textContent)).toEqual(['✓', '⚠', '⚠', '✓', '·', '·']);
    const order = Array.from(card.shadowRoot.querySelectorAll('h5, .sub, slot:not([name]), .how, .acts, .note')).map((n: any) => n.className || n.tagName.toLowerCase());
    expect(order).toEqual(['h5', 'slot', 'how', 'acts', 'note']);
    expect(card.shadowRoot.querySelector('.how slot').assignedElements()[0].textContent).toContain('from the forge');
    const gated = card.querySelector('sett-gated-button');
    expect(gated.blocked).toBe(true);
    expect(Array.from(gated.querySelectorAll('sett-pill')).map((p: any) => p.textContent)).toEqual(['2 remarks open', '3 files unviewed']);
    const got = heard(card, 'sett-go');
    rows[1].click();
    expect(got).toEqual([{ nav: 'jump' }]);
    // a block exists only when its slot has content: no empty how bar under a card without one
    const bare = await mount('<sett-card><span slot="title">rows</span><sett-card-row mark="·">fact</sett-card-row></sett-card>');
    expect(bare.shadowRoot.querySelectorAll('.sub, .how, .acts, .note').length).toBe(0);
    const note = document.createElement('span'); note.slot = 'note'; note.textContent = 'later'; bare.append(note);
    await new Promise((r) => setTimeout(r, 0)); await settle(bare);
    expect(bare.shadowRoot.querySelector('.note slot').assignedElements()[0].textContent).toBe('later');
  });
  it('result: two pills on the heading, the note under the rows', async () => {
    const card = await mount(`<sett-card variant="result"><span slot="title">!44</span><sett-pill slot="state" kind="ok">merged</sett-pill><sett-pill slot="state">archived</sett-pill>
      <sett-card-row mark="✓" kind="ok" nav="github">squashed 5 commits into 1</sett-card-row>
      <span slot="note">branch and worktree gone · plan and threads kept · restorable · the row moves to Done</span></sett-card>`);
    expect(card.shadowRoot.querySelector('h5 .r slot').assignedElements().map((p: any) => `${p.getAttribute('kind') ?? 'default'}:${p.textContent}`)).toEqual(['ok:merged', 'default:archived']);
    expect(card.shadowRoot.querySelector('.note slot').assignedElements()[0].textContent).toContain('restorable');
  });
  it("what's new: a glyph column with a session-coloured dot, every line a door", async () => {
    const card = await mount(`<sett-card variant="whatsnew"><span slot="title">what's new</span><span slot="sub">from: your save · a pull</span>
      <sett-card-row mark="◆" kind="sel" nav="show">map · ship() → Notifier removed</sett-card-row>
      <sett-card-row mark="+1" kind="bad" nav="open">finding · api → store at pg.rs:41</sett-card-row>
      <sett-card-row mark="1" kind="sug" nav="place">unplaced · AuditLog</sett-card-row>
      <sett-card-row mark="●" kind="session" session="tl" nav="follow">refund flow · told at next step</sett-card-row>
      <sett-card-row mark="✓" kind="ok">tests 41 green</sett-card-row>
      <sett-button slot="acts" variant="primary">mark as seen</sett-button></sett-card>`);
    const rows = Array.from(card.querySelectorAll('sett-card-row')) as any[];
    expect(rows.map((r) => r.shadowRoot.querySelector('.nav')?.textContent ?? null)).toEqual(['show', 'open', 'place', 'follow', null]);
    expect(rows[3].getAttribute('session')).toBe('tl');
    const c = cssOf('sett-card-row');
    expect(c).toMatch(/:host\(\[kind='session'\]\) \.g \{ color: var\(--_session\)/);
    expect(c).toMatch(/:host\(\[session="tl"\]\) \{ --_session: var\(--sett-session-tl-main\)/);
    expect(c).toMatch(/\.g \{ min-width: var\(--sett-space-3\)/);
    expect(card.shadowRoot.querySelector('.sub slot').assignedElements()[0].textContent).toBe('from: your save · a pull');
  });
  it('kv row: the label in its column, the value, mono on demand, a link at the right', async () => {
    const kv = await mount('<sett-kv-row label="files" mono>store/pg.rs +12 · store/pool.rs +8<a slot="right">pick hunks</a></sett-kv-row>');
    expect(kv.shadowRoot.querySelector('.k').textContent).toBe('files');
    expect(kv.shadowRoot.querySelector('.v slot:not([name])').assignedNodes()[0].textContent).toContain('store/pg.rs');
    expect(kv.shadowRoot.querySelector('slot[name="right"]').assignedElements()[0].textContent).toBe('pick hunks');
    const c = cssOf('sett-kv-row');
    expect(c).toMatch(/:host\(\[mono\]\) \.v \.t \{ font-family: var\(--sett-font-mono\)/);
    expect(c).toMatch(/grid-template-columns: calc\(var\(--sett-space-6\) \* 3\.5\) minmax\(0, 1fr\)/);
    expect(c).toMatch(/:host\(\[tone='sug'\]\) \.v \{ color: var\(--sett-color-sug\)/);
  });
  it('fix card: kv rows, the proposed hunk, agent door first, allow quiet, the state new in bad', async () => {
    const card = await mount(`<sett-card variant="fix"><span slot="title">finding · api must not depend on store</span><sett-pill slot="state" kind="bad">new</sett-pill>
      <sett-kv-row label="site" mono>store/pg.rs:41 · you · 2 min</sett-kv-row>
      <sett-kv-row label="rule">api → store · 1 site on this branch</sett-kv-row>
      <sett-kv-row label="fix">route the write through OrderRepo::save</sett-kv-row>
      <sett-hunk proposed verified="check green" file="pg.rs:41"><sett-hunk-line kind="del">a</sett-hunk-line><sett-hunk-line kind="add">b</sett-hunk-line></sett-hunk>
      <sett-button slot="acts" variant="primary">let an agent apply it</sett-button><sett-button slot="acts">apply myself</sett-button><sett-button slot="acts" variant="quiet">allow this site…</sett-button></sett-card>`);
    expect(Array.from(card.querySelectorAll('sett-kv-row')).map((r: any) => r.label)).toEqual(['site', 'rule', 'fix']);
    expect(card.querySelector('sett-hunk').proposed).toBe(true);
    const acts = Array.from(card.querySelectorAll('[slot="acts"]')) as any[];
    expect(acts.map((b) => `${b.variant}:${b.textContent}`)).toEqual(['primary:let an agent apply it', 'default:apply myself', 'quiet:allow this site…']);
    expect(card.querySelector('[slot="state"]').getAttribute('kind')).toBe('bad');
    expect(cssOf('sett-card')).toMatch(/::slotted\(sett-kv-row\) \{ padding-left: 0; padding-right: 0; \}/);
  });
});
