import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).map((s: any) => s.cssText).join('\n');
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as any; await el.updateComplete; return el; };
beforeAll(() => Promise.all(['sett-button', 'sett-split-button', 'sett-gated-button'].map((t) => customElements.whenDefined(t))));

describe('buttons', () => {
  it('use tokens only and never animate', () => {
    for (const t of ['sett-button', 'sett-split-button', 'sett-gated-button']) {
      const c = cssOf(t);
      expect(c, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/); expect(c, t).not.toMatch(/\d+px/); expect(c, t).not.toMatch(/animation|opacity/);
    }
  });
  it('a disabled primary is a dashed blue outline, not a faded fill', () => {
    const c = cssOf('sett-button');
    expect(c).toMatch(/button:disabled \{[^}]*border-style: dashed/);
    expect(c).toMatch(/\[variant='primary'\]\) button:disabled \{ color: var\(--sett-color-sel\); border-color: var\(--sett-color-sel\)/);
  });
  it('split: main press fires, dropdown toggles the list, Escape closes', async () => {
    const el = await mount('<sett-split-button>accept<sett-menu slot="menu"></sett-menu></sett-split-button>');
    let pressed = 0; el.addEventListener('sett-press', () => pressed++);
    el.shadowRoot.querySelector('.main').click(); expect(pressed).toBe(1); expect(el.open).toBe(false);
    el.shadowRoot.querySelector('.dd').click(); await el.updateComplete; expect(el.open).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await el.updateComplete; expect(el.open).toBe(false);
  });
  it('gated: blocked disables and swallows press; open fires', async () => {
    const b = await mount('<sett-gated-button blocked>merge<span slot="reason">blocked</span></sett-gated-button>');
    let n = 0; b.addEventListener('sett-press', () => n++);
    const inner = b.shadowRoot.querySelector('sett-button'); await inner.updateComplete;
    expect(inner.disabled).toBe(true); inner.click(); expect(n).toBe(0);
    const o = await mount('<sett-gated-button>merge</sett-gated-button>');
    o.addEventListener('sett-press', () => n++); o.shadowRoot.querySelector('sett-button').click(); expect(n).toBe(1);
  });
});
