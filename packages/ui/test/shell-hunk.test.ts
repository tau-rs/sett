import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const TAGS = ['sett-hunk', 'sett-hunk-line', 'sett-remark'];
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const settle = async (el: any) => {
  await el.updateComplete;
  await Promise.all(Array.from(el.querySelectorAll('*')).map((c: any) => c.updateComplete));
  await el.updateComplete;
};
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as any; await settle(el); return el; };
const heard = (el: Element, type: string) => { const got: any[] = []; el.addEventListener(type, (e: any) => got.push(e.detail ?? null)); return got; };
const buttons = (el: any) => Array.from(el.shadowRoot.querySelectorAll('button')).map((b: any) => b.textContent.trim());

const HUNK = (attrs = '', inner = '') => `<sett-hunk file="service.rs:22" item="pay()" agent="a3" session="tl" ${attrs}>
  <sett-hunk-line kind="add">  self.limiter.check(&amp;caller)?;</sett-hunk-line>
  <sett-hunk-line kind="flag">  let receipt = order.pay(amount)?;</sett-hunk-line>
  <sett-hunk-line kind="del">  order.pay(amount)?;</sett-hunk-line>
  <sett-hunk-line kind="ctx">  Ok(receipt)</sett-hunk-line>${inner}</sett-hunk>`;

beforeAll(() => Promise.all(TAGS.map((t) => customElements.whenDefined(t))));

describe('hunk', () => {
  it('every part uses tokens only and never animates', () => {
    for (const t of TAGS) {
      const c = cssOf(t);
      expect(c, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(c, t).not.toMatch(/\d+px/);
      expect(c, t).not.toMatch(/animation|transition|opacity/);
    }
  });
  it('header: file:line · item · sub-agent in its session colour; the verbs at the right', async () => {
    const h = await mount(HUNK());
    const hd = h.shadowRoot.querySelector('[part="header"]');
    expect(['.file', '.item', '.agent'].map((c) => hd.querySelector(c).textContent)).toEqual(['service.rs:22', 'pay()', 'a3']);
    expect(hd.querySelectorAll('.sep').length).toBe(2);
    expect(cssOf('sett-hunk')).toMatch(/\.agent \{ color: var\(--_session\)/);
    expect(cssOf('sett-hunk')).toMatch(/\.file \{[^}]*font-family: var\(--sett-font-mono\)/);
    expect(buttons(h)).toEqual(['v · viewed', 'r · remark', 'show on map']);
  });
  it('viewed: the button fires sett-viewed and changes nothing itself; viewed draws the ok word', async () => {
    const h = await mount(HUNK());
    const got = heard(h, 'sett-viewed');
    h.shadowRoot.querySelector('.v').click();
    expect(got).toEqual([{ viewed: true }]);
    expect(h.viewed).toBe(false);
    h.viewed = true; await settle(h);
    expect(h.shadowRoot.querySelector('.v')).toBeNull();
    expect(h.shadowRoot.querySelector('.viewed').textContent).toBe('viewed');
    expect(cssOf('sett-hunk')).toMatch(/\.viewed \{ color: var\(--sett-color-ok\)/);
    expect(buttons(h)).toEqual(['r · remark', 'show on map']);
  });
  it('remark and show on map fire their events', async () => {
    const h = await mount(HUNK());
    const r = heard(h, 'sett-remark'); const s = heard(h, 'sett-show');
    h.shadowRoot.querySelector('.rm').click();
    h.shadowRoot.querySelector('.show').click();
    expect(r.length).toBe(1); expect(s.length).toBe(1);
  });
  it('lines: mono, pre, one tint per kind, the sign from the kind', async () => {
    const h = await mount(HUNK());
    const lines = Array.from(h.querySelectorAll('sett-hunk-line')) as any[];
    expect(lines.map((l) => l.shadowRoot.querySelector('.s').textContent)).toEqual(['+', '+', '-', ' ']);
    const c = cssOf('sett-hunk-line');
    expect(c).toMatch(/:host \{[^}]*font-family: var\(--sett-font-mono\)/);
    expect(c).toMatch(/:host \{[^}]*white-space: pre/);
    expect(c).toMatch(/:host\(\[kind='add'\]\) \{ background: var\(--sett-color-ok-bg\)/);
    expect(c).toMatch(/:host\(\[kind='del'\]\) \{ background: var\(--sett-color-bad-bg\)/);
    expect(c).toMatch(/:host\(\[kind='flag'\]\) \{ background: var\(--sett-color-sug-bg\)/);
    expect(c).not.toMatch(/:host\(\[kind='ctx'\]\) \{ background/);
  });
  it('proposed: the header right side reads proposed · verified, no viewed or map verbs', async () => {
    const h = await mount('<sett-hunk file="pg.rs:41" proposed verified="check green"><sett-hunk-line kind="del">a</sett-hunk-line><sett-hunk-line kind="add">b</sett-hunk-line></sett-hunk>');
    const right = h.shadowRoot.querySelector('.pr');
    expect(right.textContent.replace(/\s+/g, ' ').trim()).toBe('proposed · verified: check green');
    expect(buttons(h)).toEqual([]);
    expect(h.shadowRoot.querySelector('.item')).toBeNull();
  });
  it('remark: an author line, the text, two verbs that fire sett-remark-kind', async () => {
    const h = await mount(HUNK('', '<sett-remark slot="remark" author="you" place="service.rs:23">pay() charges before the limiter result is checked.</sett-remark>'));
    const r = h.querySelector('sett-remark');
    expect(r.shadowRoot.querySelector('.who').textContent.replace(/\s+/g, ' ')).toContain('you');
    expect(r.shadowRoot.querySelector('.who .place').textContent).toBe('service.rs:23');
    expect(buttons(r)).toEqual(['ask for a change', 'comment · no change needed']);
    const got = heard(r, 'sett-remark-kind');
    r.shadowRoot.querySelectorAll('button')[0].click();
    r.shadowRoot.querySelectorAll('button')[1].click();
    expect(got).toEqual([{ kind: 'change' }, { kind: 'comment' }]);
    expect(r.hasAttribute('kind')).toBe(false);
  });
  it('a remark that asks: the pill and the element line; a comment: the plain pill, no verbs', async () => {
    const asks = await mount('<sett-remark kind="change" element="E7" author="you">text</sett-remark>');
    expect(buttons(asks)).toEqual([]);
    const pill = asks.shadowRoot.querySelector('sett-pill');
    expect(pill.textContent).toBe('asks for a change');
    expect(pill.getAttribute('kind')).toBe('sug');
    expect(asks.shadowRoot.querySelector('.el').textContent.replace(/\s+/g, ' ').trim()).toBe('E7 · realized in the session');
    const comment = await mount('<sett-remark kind="comment" author="you">text</sett-remark>');
    expect(buttons(comment)).toEqual([]);
    expect(comment.shadowRoot.querySelector('sett-pill').textContent).toBe('comment · no change needed');
    expect(comment.shadowRoot.querySelector('.el')).toBeNull();
  });
});
