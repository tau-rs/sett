import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const TAGS = ['sett-commit-form', 'sett-ask', 'sett-resolve-row'];
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const settle = async (el: any) => {
  await el.updateComplete;
  await Promise.all(Array.from(el.querySelectorAll('*')).map((c: any) => c.updateComplete));
  await el.updateComplete;
};
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as any; await settle(el); return el; };
const heard = (el: Element, type: string) => { const got: any[] = []; el.addEventListener(type, (e: any) => got.push(e.detail ?? null)); return got; };
const key = (el: Element, k: string, init: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true, ...init }));

const FORM = (attrs = '') => `<sett-commit-form value="store: size the pg pool from config" description="Reads pool size from PgConfig; defaults to 8." files="store/pg.rs +12 · store/pool.rs +8" checks="ran on save · check 0 · tests 41 ✓" ${attrs}></sett-commit-form>`;
const ASK = (attrs = '', extra = '') => `<sett-ask witnesses="service.rs:14 ports.rs:6 pg.rs:14" ${attrs}>
  <span slot="question">where does a shipment get persisted, and through what?</span>
  <sett-tool slot="ran">ran entry
ran path ship() → postgres</sett-tool>
  <sett-msg slot="answer" from="agent" author="answer · 3 witnesses">A shipment is persisted through the port <sett-tag mono>OrderRepo</sett-tag>, implemented by <sett-tag mono>PgOrderRepo</sett-tag>.</sett-msg>${extra}</sett-ask>`;

beforeAll(() => Promise.all(TAGS.map((t) => customElements.whenDefined(t))));

describe('commit form', () => {
  it('uses tokens only and never animates', () => {
    for (const t of TAGS) {
      const c = cssOf(t);
      expect(c, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(c, t).not.toMatch(/\d+px/);
      expect(c, t).not.toMatch(/animation|transition|opacity/);
    }
  });
  it('commit fires with the message, the description and the then', async () => {
    const f = await mount(FORM());
    const got = heard(f, 'sett-commit');
    f.shadowRoot.querySelector('sett-button').click();
    expect(got).toEqual([{ message: 'store: size the pg pool from config', description: 'Reads pool size from PgConfig; defaults to 8.', then: 'main' }]);
    const msg = f.shadowRoot.querySelector('input.msg');
    msg.value = 'store: pool size'; key(msg, 'Enter', { metaKey: true });
    expect(got[1]).toEqual({ message: 'store: pool size', description: 'Reads pool size from PgConfig; defaults to 8.', then: 'main' });
    key(msg, 'Enter');
    expect(got.length).toBe(2);
    expect(f.shadowRoot.querySelector('textarea').getAttribute('placeholder')).toBe('description · prefilled from the diff');
  });
  it('then: two radios in one group; the choice follows the attribute and reports when changed', async () => {
    const f = await mount(FORM('then="branch"'));
    const radios = Array.from(f.shadowRoot.querySelectorAll('input[type="radio"]')) as HTMLInputElement[];
    expect(radios.map((r) => r.name)).toEqual(['then', 'then']);
    expect(radios.map((r) => r.value)).toEqual(['main', 'branch']);
    expect(radios.map((r) => r.checked)).toEqual([false, true]);
    expect(f.shadowRoot.querySelector('[role="radiogroup"]').textContent.replace(/\s+/g, ' ')).toContain('stay on main');
    expect(f.shadowRoot.querySelector('[role="radiogroup"]').textContent.replace(/\s+/g, ' ')).toContain('push to a branch · open MR');
    const got = heard(f, 'sett-then');
    radios[0].checked = true; radios[0].dispatchEvent(new Event('change'));
    await settle(f);
    expect(got).toEqual([{ then: 'main' }]);
    expect(f.then).toBe('main');
    const commit = heard(f, 'sett-commit');
    f.shadowRoot.querySelector('sett-button').click();
    expect(commit[0].then).toBe('main');
  });
  it('pick hunks fires sett-pick from the files line', async () => {
    const f = await mount(FORM());
    const got = heard(f, 'sett-pick');
    const files = f.shadowRoot.querySelector('sett-kv-row[label="files"]');
    expect(files.hasAttribute('mono')).toBe(true);
    files.querySelector('button.lnk').click();
    expect(got.length).toBe(1);
  });
  it('behind: a line in sug with both doors, agent first and bold; absent when main did not move', async () => {
    const still = await mount(FORM());
    expect(still.shadowRoot.querySelector('sett-kv-row[label="behind"]')).toBeNull();
    const f = await mount(FORM('behind="main moved 2 commits"'));
    const row = f.shadowRoot.querySelector('sett-kv-row[label="behind"]');
    expect(row.getAttribute('tone')).toBe('sug');
    const doors = Array.from(row.querySelectorAll('button.lnk')) as HTMLButtonElement[];
    expect(doors.map((d) => d.textContent)).toEqual(['with an agent', 'update myself']);
    expect(doors[0].classList.contains('agent')).toBe(true);
    const got = heard(f, 'sett-update');
    doors[0].click(); doors[1].click();
    expect(got).toEqual([{ door: 'agent' }, { door: 'manual' }]);
    expect(cssOf('sett-commit-form')).toMatch(/\.lnk\.agent \{ font-weight: var\(--sett-font-weight-semibold\)/);
  });
  it('native fields take the tokens and the sel focus ring', () => {
    const c = cssOf('sett-commit-form');
    expect(c).toMatch(/input, textarea \{[^}]*border: var\(--sett-stroke-hair\) solid var\(--sett-color-line\)/);
    expect(c).toMatch(/input:focus-visible, textarea:focus-visible \{ outline: none; box-shadow: 0 0 0 var\(--sett-stroke-lit\) var\(--sett-color-sel\)/);
    expect(c).toMatch(/input\[type='radio'\] \{[^}]*accent-color: var\(--sett-color-sel\)/);
  });
});

describe('ask', () => {
  it('your question sits on the right; the ran block is a tool block; the answer takes the framer blue', async () => {
    const a = await mount(ASK());
    const me = a.shadowRoot.querySelector('sett-msg[from="me"]');
    expect(me.getAttribute('author')).toBe('you');
    expect(me.querySelector('slot[name="question"]').assignedElements()[0].textContent).toContain('shipment');
    expect(a.shadowRoot.querySelector('slot[name="ran"]').assignedElements()[0].tagName.toLowerCase()).toBe('sett-tool');
    expect(cssOf('sett-ask')).toMatch(/::slotted\(sett-msg\[slot='answer'\]\) \{ --_session: var\(--sett-color-sel\)/);
  });
  it('the witnesses are links, mono tags, and open all fires with every place', async () => {
    const a = await mount(ASK());
    const links = Array.from(a.shadowRoot.querySelectorAll('.wit [role="link"]')) as any[];
    expect(links.map((l) => l.textContent.trim())).toEqual(['service.rs:14', 'ports.rs:6', 'pg.rs:14', 'open all']);
    expect(links.every((l) => l.tabIndex === 0)).toBe(true);
    expect(links[0].querySelector('sett-tag').hasAttribute('mono')).toBe(true);
    const got = heard(a, 'sett-go');
    links[1].click();
    key(links[3], 'Enter');
    expect(got).toEqual([{ place: 'ports.rs:6' }, { places: ['service.rs:14', 'ports.rs:6', 'pg.rs:14'] }]);
    const one = await mount('<sett-ask witnesses="pg.rs:14"><span slot="question">q</span></sett-ask>');
    expect(one.shadowRoot.querySelector('.wit .all')).toBeNull();
  });
  it('no button inside a message: the make it so door sits outside the answer', async () => {
    const a = await mount(ASK());
    for (const m of Array.from(a.querySelectorAll('sett-msg')).concat(Array.from(a.shadowRoot.querySelectorAll('sett-msg')))) {
      expect(m.querySelectorAll('button, sett-button').length, 'light DOM of a msg').toBe(0);
    }
    const door = a.shadowRoot.querySelector('.door sett-button');
    expect(door.textContent).toBe('make it so → plan');
    expect(door.closest('sett-msg')).toBeNull();
    const got = heard(a, 'sett-plan');
    door.click();
    expect(got.length).toBe(1);
    const bare = await mount('<sett-ask><span slot="question">q</span></sett-ask>');
    expect(bare.shadowRoot.querySelector('.door')).toBeNull();
  });
  it('judgement: labelled, with resolve rows that fire sett-resolve', async () => {
    const a = await mount(ASK('', '<span slot="judgement">ship() reaches postgres through the port, but the rule names api → store as forbidden.</span><sett-resolve-row slot="judgement" source="rules:3">api must not depend on store</sett-resolve-row><sett-resolve-row slot="judgement" source="service.rs:14">ship() → PgOrderRepo</sett-resolve-row>'));
    const blk = a.shadowRoot.querySelector('.judgement');
    expect(blk.querySelector('.lbl').textContent).toContain('judgement');
    expect(blk.querySelector('slot').assignedElements().length).toBe(3);
    const rows = Array.from(a.querySelectorAll('sett-resolve-row')) as any[];
    expect(rows[0].shadowRoot.querySelector('.g').textContent).toBe('⇄');
    expect(rows[0].shadowRoot.querySelector('sett-tag').textContent).toBe('rules:3');
    expect(rows[0].shadowRoot.querySelector('.v').getAttribute('role')).toBe('link');
    const got = heard(a, 'sett-resolve');
    rows[1].shadowRoot.querySelector('.v').click();
    expect(got).toEqual([{ source: 'service.rs:14' }]);
    expect(cssOf('sett-resolve-row')).toMatch(/\.g \{[^}]*color: var\(--sett-color-sug\)/);
    expect(a.shadowRoot.querySelector('.cant')).toBeNull();
  });
  it("can't compute: the block and the nearest queries as links", async () => {
    const a = await mount('<sett-ask nearest="path ship() → postgres | why OrderRepo::save"><span slot="question">how many requests per second does ship() take?</span><span slot="cant">arch has no runtime facts; the map knows paths and callers, not load.</span></sett-ask>');
    const blk = a.shadowRoot.querySelector('.cant');
    expect(blk.querySelector('.lbl').textContent).toBe("can't compute");
    const qs = Array.from(blk.querySelectorAll('.near .q')) as any[];
    expect(qs.map((q) => q.textContent)).toEqual(['path ship() → postgres', 'why OrderRepo::save']);
    expect(qs.every((q) => q.getAttribute('role') === 'link' && q.tabIndex === 0)).toBe(true);
    const got = heard(a, 'sett-query');
    qs[1].click();
    expect(got).toEqual([{ query: 'why OrderRepo::save' }]);
    expect(a.shadowRoot.querySelector('.door')).toBeNull();
  });
});
