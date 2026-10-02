import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as any; await el.updateComplete; return el; };
const heard = (el: Element, type: string) => { const got: any[] = []; el.addEventListener(type, (e: any) => got.push(e.detail ?? null)); return got; };
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true }));

beforeAll(() => customElements.whenDefined('sett-intent-bar'));

describe('sett-intent-bar', () => {
  it('uses tokens only and never animates', () => {
    const c = cssOf('sett-intent-bar');
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(c).not.toMatch(/\d+px/);
    expect(c).not.toMatch(/\d+m?s\b/);
    expect(c).not.toMatch(/animation|transition|opacity/);
  });
  it('is one labelled text field on the sug tint, with the chip radius and the sel ring', async () => {
    const bar = await mount('<sett-intent-bar></sett-intent-bar>');
    const input = bar.shadowRoot.querySelector('input');
    expect(input.getAttribute('aria-label')).toBe('intention');
    expect(input.getAttribute('type')).toBe('text');
    expect(input.placeholder).toBe('what do you want to change? one sentence');
    expect(bar.shadowRoot.querySelectorAll('input, textarea').length).toBe(1);
    const c = cssOf('sett-intent-bar');
    expect(c).toMatch(/:host \{[^}]*background: var\(--sett-color-sug-bg\)/);
    expect(c).toMatch(/input \{[^}]*border-radius: var\(--sett-radius-chip\)/);
    expect(c).toMatch(/input \{[^}]*font-size: var\(--sett-font-size-lg\)/);
    expect(c).toMatch(/input:focus-visible \{[^}]*var\(--sett-color-sel\)/);
  });
  it('fires sett-intent with the value on Enter, and only on Enter', async () => {
    const bar = await mount('<sett-intent-bar value="Refunds: add refund() to the OrderRepo port"></sett-intent-bar>');
    const input = bar.shadowRoot.querySelector('input');
    expect(input.value).toBe('Refunds: add refund() to the OrderRepo port');
    const got = heard(bar, 'sett-intent');
    input.value = 'Refunds: add refund() to the OrderRepo port and the Postgres impl';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(bar.value).toBe('Refunds: add refund() to the OrderRepo port and the Postgres impl');
    key(input, 'a');
    expect(got).toEqual([]);
    key(input, 'Enter');
    expect(got).toEqual([{ value: 'Refunds: add refund() to the OrderRepo port and the Postgres impl' }]);
  });
  it('shows the counts in mute at the right and the verbs slot after them', async () => {
    const bar = await mount('<sett-intent-bar counts="5 elements · 2 groups"><sett-button slot="verbs">draft</sett-button></sett-intent-bar>');
    expect(bar.shadowRoot.querySelector('.counts').textContent).toBe('5 elements · 2 groups');
    expect(cssOf('sett-intent-bar')).toMatch(/\.counts \{[^}]*color: var\(--sett-color-mute\)/);
    expect(bar.shadowRoot.querySelector('.verbs slot[name="verbs"]')).not.toBeNull();
    const plain = await mount('<sett-intent-bar></sett-intent-bar>');
    expect(plain.shadowRoot.querySelector('.counts')).toBeNull();
  });
});
