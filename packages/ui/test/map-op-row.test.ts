import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const mount = async (markup: string) => {
  document.body.innerHTML = markup;
  const el = document.body.firstElementChild as HTMLElement & { updateComplete: Promise<boolean> };
  await el.updateComplete;
  return el;
};
const cssOf = (tag: string) => { const s = (customElements.get(tag) as any).styles; return (Array.isArray(s) ? s : [s]).map((x: any) => x.cssText).join('\n'); };

beforeAll(() => customElements.whenDefined('sett-op-row'));

describe('sett-op-row', () => {
  it('uses tokens only and never animates', () => {
    const css = cssOf('sett-op-row');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px/);
    expect(css).not.toMatch(/animation|transition/);
    expect(css, 'a folded row must really hide').toContain(':host([hidden]) { display: none; }');
  });
  it('a route shows the method chip coloured by method, the path, and the return', async () => {
    const el = await mount('<sett-op-row kind="route" method="DELETE" path="/subscriptions/:id" returns="303"></sett-op-row>');
    const m = el.shadowRoot!.querySelector('.m')!;
    expect(m.textContent).toBe('DELETE');
    expect(m.classList.contains('delete')).toBe(true);
    expect(el.shadowRoot!.querySelector('.p')!.textContent).toBe('/subscriptions/:id');
    expect(el.shadowRoot!.querySelector('.rt')!.textContent).toBe('303');
  });
  it('a handler replaces the return with → handler and reflects has-handler', async () => {
    const el = await mount('<sett-op-row kind="route" method="POST" path="/subscriptions" returns="200" handler="subscribe"></sett-op-row>');
    expect(el.hasAttribute('has-handler')).toBe(true);
    expect(el.shadowRoot!.querySelector('.rt')).toBeNull();
    expect(el.shadowRoot!.querySelector('.hd2')!.textContent).toBe('→ subscribe');
    const plain = await mount('<sett-op-row kind="route" method="GET" path="/"></sett-op-row>');
    expect(plain.hasAttribute('has-handler')).toBe(false);
  });
  it('rpc, table, schema, text and flag render their shapes', async () => {
    expect((await mount('<sett-op-row kind="rpc" path="find_at" returns="Match">haystack, at</sett-op-row>')).shadowRoot!.textContent).toContain('→ Match');
    expect((await mount('<sett-op-row kind="table">users</sett-op-row>')).shadowRoot!.querySelector('.p')!.textContent).toContain('▤');
    expect((await mount('<sett-op-row kind="schema">x</sett-op-row>')).shadowRoot!.querySelector('.sc')).not.toBeNull();
    expect((await mount('<sett-op-row kind="flag" method="-i" path="ignore case"></sett-op-row>')).shadowRoot!.querySelector('.m.flag')!.textContent).toBe('-i');
  });
  it('the more row says how many are folded and fires sett-expand', async () => {
    const el = await mount('<sett-op-row kind="more" count="3"></sett-op-row>');
    expect(el.shadowRoot!.textContent).toContain('… 3 more');
    let fired = false;
    el.addEventListener('sett-expand', () => { fired = true; });
    (el.shadowRoot!.querySelector('.row') as HTMLElement).click();
    expect(fired).toBe(true);
  });
});
