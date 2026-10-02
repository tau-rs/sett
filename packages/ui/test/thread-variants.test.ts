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

const GATE = `<sett-question author="refund flow">gate · group 1 → group 2 failed twice: judge says refund() does not honour the port contract
  <input slot="input" placeholder="a hint for one more round…" aria-label="hint">
  <sett-option slot="option" value="round" effect="round 3 of 2">one more round with a hint</sett-option>
  <sett-option slot="option" value="take-over">take over</sett-option>
  <sett-option slot="option" value="accept" effect="recorded override">accept as is</sett-option>
  <sett-option slot="option" value="re-plan" quiet>re-plan</sett-option></sett-question>`;
const DENIED = `<sett-deviation subject="a2" check="core · element scope">wrote api/service.rs outside E2's scope
  <sett-option slot="way" value="back" label="back on the plan">do it through OrderRepo::save</sett-option>
  <sett-option slot="way" value="update" label="update the plan">add mark_refunded to the port</sett-option>
  <sett-option slot="way" value="carve" label="not this change">carve out as a follow-up</sett-option>
  <sett-option slot="way" value="discuss" label="discuss" quiet>not a decision</sett-option></sett-deviation>`;

beforeAll(() => Promise.all(['sett-question', 'sett-deviation', 'sett-option'].map((t) => customElements.whenDefined(t))));

describe('gate failed question', () => {
  it('still uses tokens only and never animates', () => {
    for (const t of ['sett-question', 'sett-deviation']) {
      const c = cssOf(t);
      expect(c, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(c, t).not.toMatch(/\d+px/);
      expect(c, t).not.toMatch(/animation|transition|opacity/);
    }
  });
  it('the four doors are option rows, accept as is carries recorded override, later stays', async () => {
    const q = await mount(GATE);
    const opts = Array.from(q.querySelectorAll('sett-option')) as any[];
    expect(opts.map((o) => o.textContent.trim())).toEqual(['one more round with a hint', 'take over', 'accept as is', 're-plan']);
    expect(opts[2].effect).toBe('recorded override');
    expect(opts[3].quiet).toBe(true);
    expect(q.shadowRoot.querySelector('.later').textContent).toContain('later');
    expect(q.shadowRoot.querySelector('b').textContent).toBe('refund flow asks');
    const got = heard(q, 'sett-choose');
    opts[1].shadowRoot.querySelector('button').click();
    expect(got).toEqual([{ value: 'take-over' }]);
  });
  it('the input slot sits between the question and the options and takes the tokens', async () => {
    const q = await mount(GATE);
    const order = Array.from(q.shadowRoot.querySelectorAll('.q, slot[name="input"], .opts')).map((n: any) => n.className || `slot:${n.name}`);
    expect(order).toEqual(['q', 'slot:input', 'opts']);
    expect(q.shadowRoot.querySelector('slot[name="input"]').assignedElements()[0].tagName.toLowerCase()).toBe('input');
    const c = cssOf('sett-question');
    expect(c).toMatch(/::slotted\(input\) \{[^}]*border: var\(--sett-stroke-hair\) solid var\(--sett-color-line\)/);
    expect(c).toMatch(/::slotted\(input:focus-visible\) \{ outline: none; box-shadow: 0 0 0 var\(--sett-stroke-lit\) var\(--sett-color-sel\)/);
    const plain = await mount('<sett-question author="Y">q<sett-option slot="option" value="a">a</sett-option></sett-question>');
    expect(plain.shadowRoot.querySelector('slot[name="input"]').assignedElements().length).toBe(0);
  });
});

describe('denied write deviation', () => {
  it('names the check in mono, the reason, the three typologies and discuss', async () => {
    const d = await mount(DENIED);
    expect(d.shadowRoot.querySelector('.check').textContent).toBe('check · core · element scope');
    expect(cssOf('sett-deviation')).toMatch(/\.check \{[^}]*font-family: var\(--sett-font-mono\)/);
    const ways = Array.from(d.querySelectorAll('sett-option')) as any[];
    expect(ways.map((w) => w.label)).toEqual(['back on the plan', 'update the plan', 'not this change', 'discuss']);
    expect(ways[3].quiet).toBe(true);
    const got = heard(d, 'sett-choose');
    ways[0].shadowRoot.querySelector('button').click();
    expect(got).toEqual([{ value: 'back' }]);
    const bare = await mount('<sett-deviation subject="a2">reason</sett-deviation>');
    expect(bare.shadowRoot.querySelector('.check')).toBeNull();
  });
});
