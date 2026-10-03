import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { base } from '@tau-rs/sett-tokens';
import '../src/index.js';
import { durationMs } from '../src/map/motion.js';

type El = HTMLElement & { updateComplete: Promise<boolean>; [k: string]: any };
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as El; await el.updateComplete; return el; };
const HOLD = durationMs(base.map.statusHold);

beforeAll(() => customElements.whenDefined('sett-panel'));
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('sett-panel', () => {
  it('uses tokens only, is map.size.panel wide and never animates (rule 8: the status line is still)', () => {
    const css = cssOf('sett-panel');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px/);
    expect(css).not.toMatch(/animation|transition|opacity/);
    expect(css).toContain('width: var(--sett-map-size-panel)');
    expect(css).not.toMatch(/position:\s*(absolute|fixed)/);
  });
  it('the first row is the status line: well tint with a message, plain and the same height without', async () => {
    const el = await mount('<sett-panel status="fitted · 11 units"><sett-position></sett-position></sett-panel>');
    const st = el.shadowRoot!.firstElementChild as HTMLElement;
    expect(st.getAttribute('part')).toBe('status');
    expect(st.getAttribute('role')).toBe('status');
    expect(st.classList.contains('on')).toBe(true);
    expect(st.textContent).toBe('fitted · 11 units');
    expect(cssOf('sett-panel')).toMatch(/\.st\.on\s*\{\s*background:\s*var\(--sett-color-well\)/);
    el.status = ''; await el.updateComplete;
    expect(el.shadowRoot!.firstElementChild).toBe(st);
    expect(st.classList.contains('on')).toBe(false);
  });
  it('clears the message after map.statusHold (1.9 s) and says so', async () => {
    expect(HOLD).toBe(1900);
    const el = await mount('<sett-panel status="opened api"></sett-panel>');
    const cleared = vi.fn(); el.addEventListener('sett-status-clear', cleared);
    vi.advanceTimersByTime(HOLD - 1);
    expect(el.status).toBe('opened api');
    vi.advanceTimersByTime(1);
    expect(el.status).toBe('');
    expect(cleared).toHaveBeenCalledTimes(1);
  });
  it('a new message restarts the hold', async () => {
    const el = await mount('<sett-panel status="one"></sett-panel>');
    vi.advanceTimersByTime(HOLD - 100);
    el.status = 'two'; await el.updateComplete;
    vi.advanceTimersByTime(HOLD - 100);
    expect(el.status).toBe('two');
    vi.advanceTimersByTime(100);
    expect(el.status).toBe('');
  });
  it('the next action clears it first: a click or a key in the panel, or clear() from the host', async () => {
    const el = await mount('<sett-panel status="one"><button>row</button></sett-panel>');
    const cleared = vi.fn(); el.addEventListener('sett-status-clear', cleared);
    // the row's own handler says the new message; the panel cleared the old one before it ran
    el.querySelector('button')!.addEventListener('click', () => { expect(el.status).toBe(''); el.status = 'two'; });
    el.querySelector('button')!.click();
    expect(el.status).toBe('two');
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
    expect(el.status).toBe('');
    el.status = 'three'; await el.updateComplete;
    el.clear();
    expect(el.status).toBe('');
    expect(cleared).toHaveBeenCalledTimes(3);
    el.clear();
    expect(cleared).toHaveBeenCalledTimes(3);
  });
  it('holds a foot outside the scrolling body, for the minimap', async () => {
    const el = await mount('<sett-panel><sett-minimap slot="foot"></sett-minimap></sett-panel>');
    expect(Array.from(el.shadowRoot!.querySelectorAll('slot')).map((s) => s.getAttribute('name'))).toEqual([null, 'foot']);
    expect(el.shadowRoot!.querySelector('[part="body"] slot[name="foot"]')).toBeNull();
  });
});
