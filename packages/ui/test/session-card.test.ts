import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).map((s: any) => s.cssText).join('\n');
const tick = () => new Promise((r) => setTimeout(r, 0));
const mount = async (markup: string) => {
  document.body.innerHTML = markup;
  const el = document.body.firstElementChild as any;
  await el.updateComplete; await tick(); await el.updateComplete;
  return el;
};
beforeAll(() => Promise.all(['sett-session-card', 'sett-plan-row', 'sett-sub-agent'].map((t) => customElements.whenDefined(t))));

describe('session card', () => {
  it('uses tokens only; only the dot pulse animates', () => {
    for (const t of ['sett-session-card', 'sett-plan-row', 'sett-sub-agent']) {
      const c = cssOf(t);
      expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(c).not.toMatch(/\d+px/);
      expect(c).not.toMatch(/\d+m?s\b/);
      expect((c.match(/@keyframes/g) ?? []).length).toBeLessThanOrEqual(1);
    }
    expect(cssOf('sett-session-card')).toContain('sett-dot-pulse var(--sett-motion-frame-pulse)');
  });
  it('right cell says only what the glyph cannot', async () => {
    const right = async (m: string) => (await mount(m)).shadowRoot.querySelector('.right')?.textContent ?? '';
    expect(await right('<sett-plan-row state="asks" count="2">x</sett-plan-row>')).toBe('asks · 2');
    expect(await right('<sett-plan-row state="paused">x</sett-plan-row>')).toBe('paused');
    expect(await right('<sett-plan-row state="deviation">x</sett-plan-row>')).toBe('deviation');
    expect(await right('<sett-plan-row state="stepped-in" who="you">x</sett-plan-row>')).toBe('you');
    expect(await right('<sett-plan-row state="done">x</sett-plan-row>')).toBe('');
    expect(await right('<sett-plan-row state="running">x</sett-plan-row>')).toBe('');
  });
  it('glyphs come from the tokens', async () => {
    const g = async (s: string) => (await mount(`<sett-plan-row state="${s}">x</sett-plan-row>`)).shadowRoot.querySelector('.g').textContent;
    expect(await g('done')).toBe('✓'); expect(await g('running')).toBe('●'); expect(await g('stepped-in')).toBe('✋'); expect(await g('deviation')).toBe('≠'); expect(await g('asks')).toBe('!');
  });
  it('sub-agents fold by default with a count and glyph run; toggle opens', async () => {
    const el = await mount('<sett-plan-row state="running" current>PgRefundRepo<sett-sub-agent slot="sub" state="done">a</sett-sub-agent><sett-sub-agent slot="sub" state="running">b</sett-sub-agent><sett-sub-agent slot="sub">c</sett-sub-agent></sett-plan-row>');
    const sum = el.shadowRoot.querySelector('.sum');
    expect(sum).not.toBeNull();
    expect(sum.textContent.replace(/\s+/g, ' ')).toContain('3 sub');
    expect(sum.querySelectorAll('.mini span').length).toBe(3);
    expect(el.open).toBe(false);
    expect(el.shadowRoot.querySelector('.right')).toBeNull();
    let toggled = 0; el.addEventListener('sett-toggle', () => toggled++);
    sum.click(); await el.updateComplete;
    expect(el.open).toBe(true); expect(toggled).toBe(1);
    expect(cssOf('sett-plan-row')).toMatch(/\.subs \{[^}]*border-left: var\(--sett-stroke-hair\) solid var\(--_session-sub\)/);
  });
  it('header shows name, driver, n/m and pulses when running', async () => {
    const el = await mount('<sett-session-card name="Yokohama" driver="claude code" session="yk" step="3" of="6" running></sett-session-card>');
    const h = el.shadowRoot.querySelector('.h');
    expect(h.textContent).toContain('Yokohama'); expect(h.textContent).toContain('3/6');
    expect(h.querySelector('.dot').hasAttribute('data-pulse')).toBe(true);
  });
});
