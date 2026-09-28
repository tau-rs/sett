import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

beforeAll(() => customElements.whenDefined('sett-frame'));
const cssText = () => (customElements.get('sett-frame') as any).styles.map((s: any) => s.cssText).join('\n');

describe('sett-frame', () => {
  it('uses tokens only: no hex, no px, no raw durations', () => {
    const c = cssText();
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(c).not.toMatch(/\d+px/);
    expect(c).not.toMatch(/\d+m?s\b/);
  });
  it('has exactly the two chrome animations, driven by the motion tokens', () => {
    const c = cssText();
    expect(c.match(/@keyframes/g)).toHaveLength(2);
    expect(c).toContain('sett-frame-rotate var(--sett-motion-frame-rotate)');
    expect(c).toContain('sett-frame-pulse var(--sett-motion-frame-pulse)');
    expect(c).toContain('prefers-reduced-motion');
  });
  it('focus is a ring at the lit stroke in sel, not a frame fill', () => {
    const c = cssText();
    expect(c).toMatch(/\[state='focus'\]\) \.inner \{ box-shadow: inset 0 0 0 var\(--sett-stroke-lit\) var\(--sett-color-sel\)/);
    expect(c).not.toMatch(/\[state='focus'\]\) \{ background/);
  });
  it('renders the slot inside the inner paper', async () => {
    document.body.innerHTML = '<sett-frame state="live" session="tl"><p>pane</p></sett-frame>';
    const el = document.body.firstElementChild as HTMLElement & { updateComplete: Promise<boolean> };
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.inner slot')).not.toBeNull();
    expect(el.getAttribute('session')).toBe('tl');
  });
});
