import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).map((s: any) => s.cssText).join('\n');
const tick = () => new Promise((r) => setTimeout(r, 0));
beforeAll(() => Promise.all(['sett-funnel', 'sett-funnel-step'].map((t) => customElements.whenDefined(t))));

describe('funnel', () => {
  it('uses tokens only and never animates', () => {
    for (const t of ['sett-funnel', 'sett-funnel-step']) { const c = cssOf(t); expect(c, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\d+px|animation/); }
  });
  it('sets done / current / pending from the current index and numbers the steps', async () => {
    document.body.innerHTML = '<sett-funnel current="3"><sett-funnel-step>open</sett-funnel-step><sett-funnel-step>map</sett-funnel-step><sett-funnel-step>place</sett-funnel-step><sett-funnel-step>rules</sett-funnel-step></sett-funnel>';
    const f = document.body.firstElementChild as any; await f.updateComplete; await tick();
    const steps = Array.from(f.querySelectorAll('sett-funnel-step')) as any[];
    for (const s of steps) await s.updateComplete;
    expect(steps.map((s) => s.state)).toEqual(['done', 'done', 'current', 'pending']);
    expect(steps[0].first).toBe(true); expect(steps[1].first).toBe(false);
    expect(steps[0].shadowRoot.querySelector('i').textContent).toBe('✓');
    expect(steps[3].shadowRoot.querySelector('i').textContent).toBe('4');
    f.current = 4; await f.updateComplete; for (const s of steps) await s.updateComplete;
    expect(steps.map((s) => s.state)).toEqual(['done', 'done', 'done', 'current']);
  });
});
