import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import { scopeText, type Scope } from '../src/scope.js';

const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as any; await el.updateComplete; return el; };
const words = (el: any) => el.shadowRoot.querySelector('.words').textContent.replace(/\s+/g, ' ').trim();

beforeAll(() => customElements.whenDefined('sett-scope-line'));

describe('sett-scope-line', () => {
  it('uses tokens only and never animates', () => {
    const c = cssOf('sett-scope-line');
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(c).not.toMatch(/\d+px/);
    expect(c).not.toMatch(/animation|transition|opacity/);
  });
  it('writes each kind of scope with the words of scopeText', async () => {
    const cases: [string, Scope][] = [
      ['<sett-scope-line></sett-scope-line>', { kind: 'main' }],
      ['<sett-scope-line scope="main" sub="as on disk"></sett-scope-line>', { kind: 'main' }],
      ['<sett-scope-line scope="session" session="yk" scope-id="w1" name="refund flow"></sett-scope-line>', { kind: 'session', id: 'w1', name: 'refund flow' }],
      ['<sett-scope-line scope="you" name="fix-pool-size"></sett-scope-line>', { kind: 'you', name: 'fix-pool-size' }],
      ['<sett-scope-line scope="plan" name="refund flow"></sett-scope-line>', { kind: 'plan', name: 'refund flow' }],
    ];
    for (const [markup, scope] of cases) {
      const el = await mount(markup);
      expect(words(el), markup).toBe(scopeText(scope));
      expect(el.getAttribute('aria-label'), markup).toContain(`scope: ${scopeText(scope)}`);
    }
  });
  it('the head is the mono part, in ink; the scope colour is only the dot and the tint', async () => {
    const el = await mount('<sett-scope-line scope="session" session="tl" scope-id="w2" name="webhook retries"></sett-scope-line>');
    expect(el.shadowRoot.querySelector('.head').textContent).toBe('w2');
    const c = cssOf('sett-scope-line');
    expect(c).toMatch(/:host \{[^}]*background: var\(--_scope-bg\);/);
    expect(c).toMatch(/\.dot \{[^}]*background: var\(--_scope\);/);
    expect(c).toMatch(/\.head \{[^}]*font-family: var\(--sett-font-mono\);[^}]*color: var\(--sett-color-ink\);/);
    expect(c).not.toMatch(/[^-]color: var\(--_scope\)/);
  });
  it('locked shows the glyph after the words and says so in the label', async () => {
    const open = await mount('<sett-scope-line scope="you" name="fix-pool-size"></sett-scope-line>');
    expect(open.shadowRoot.querySelector('.lock')).toBeNull();
    expect(open.getAttribute('aria-label')).toBe('scope: you · fix-pool-size');
    const locked = await mount('<sett-scope-line scope="you" name="fix-pool-size" locked></sett-scope-line>');
    expect(locked.shadowRoot.querySelector('.lock').textContent).toBe('🔒');
    expect(words(locked)).toBe('you · fix-pool-size');
    expect(locked.getAttribute('aria-label')).toBe('scope: you · fix-pool-size, locked');
    const session = await mount('<sett-scope-line scope="session" scope-id="w1" name="refund flow" sub="4 changed" locked></sett-scope-line>');
    expect(session.getAttribute('aria-label')).toBe('scope: w1 · refund flow, 4 changed, locked');
    expect(session.shadowRoot.querySelector('.sub').textContent).toBe('4 changed');
  });
  it('is an indicator: nothing focusable inside, no button, no event of its own', async () => {
    const el = await mount('<sett-scope-line scope="session" scope-id="w1" name="refund flow" locked></sett-scope-line>');
    expect(el.shadowRoot.querySelectorAll('button, a, input, [tabindex], [role="button"]').length).toBe(0);
    expect(el.hasAttribute('tabindex')).toBe(false);
    expect(el.getAttribute('role')).toBe('img');
    expect(cssOf('sett-scope-line')).not.toMatch(/cursor: pointer/);
  });
});
