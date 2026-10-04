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
  it('planning is a dashed band in sug at the frame stroke, taking the place of the padding', () => {
    const c = cssText();
    expect(c).toMatch(/:host\(\[state='planning'\]\) \{[^}]*border: var\(--sett-stroke-frame\) dashed var\(--sett-color-sug\);/);
    // the band is the border instead of the padding, same width: the inner pane does not move
    expect(c).toMatch(/:host\(\[state='planning'\]\) \{[^}]*padding: 0;/);
    expect(c).toMatch(/:host \{[^}]*padding: var\(--sett-stroke-frame\);/);
  });
  it('planning never animates, with or without still or reduced motion', () => {
    const rules = cssText().match(/[^{}]*planning[^{}]*\{[^}]*\}/g) ?? [];
    expect(rules.length).toBeGreaterThan(0);
    for (const r of rules) expect(r).not.toMatch(/animation|transition/);
  });
  it("waiting's still twin stays solid amber, so planning and waiting differ with motion off", () => {
    const c = cssText();
    expect(c).toContain(":host([still][state='waiting'])::before { animation: none; opacity: 1; }");
    expect(c).toMatch(/:host\(\[state='waiting'\]\)::before \{[^}]*background: var\(--sett-color-sug\);/);
    const waiting = c.match(/[^{}]*waiting[^{}]*\{[^}]*\}/g) ?? [];
    for (const r of waiting) expect(r).not.toMatch(/dashed/);
    expect(c.match(/dashed/g)).toHaveLength(1);
  });
  it('fills a host with a height: the paper takes the frame, the pane takes the paper', () => {
    const c = cssText();
    expect(c).toMatch(/:host \{[^}]*display: flex;[^}]*flex-direction: column;/);
    expect(c).toMatch(/\.inner \{[^}]*flex: 1 1 auto;[^}]*min-height: 0;[^}]*display: flex;[^}]*flex-direction: column;/);
    expect(c).toContain('::slotted(*) { flex: 1 1 auto; min-height: 0; }');
  });
  it('fills by flex only: no fixed height, so a host without one takes its height from the pane', () => {
    const c = cssText();
    expect(c).not.toMatch(/(^|[^-])height:/m);
  });
  it('renders the slot inside the inner paper', async () => {
    document.body.innerHTML = '<sett-frame state="live" session="tl"><p>pane</p></sett-frame>';
    const el = document.body.firstElementChild as HTMLElement & { updateComplete: Promise<boolean> };
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.inner slot')).not.toBeNull();
    expect(el.getAttribute('session')).toBe('tl');
  });
});
