import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

type El = HTMLElement & { updateComplete: Promise<boolean>; [k: string]: any };
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as El; await el.updateComplete; return el; };
const heard = (el: Element, type: string) => { const got: any[] = []; el.addEventListener(type, (e: any) => got.push(e.detail)); return got; };
const TAGS = ['sett-crumb', 'sett-back', 'sett-cue'];

beforeAll(() => Promise.all(TAGS.map((t) => customElements.whenDefined(t))));

describe('the strip: crumb, back, cue', () => {
  it('use tokens only and never float (rule 8)', () => {
    for (const t of TAGS) {
      const css = cssOf(t);
      expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(css).not.toMatch(/\d+px/);
      expect(css).not.toMatch(/animation|opacity/);
      expect(css).not.toMatch(/position:\s*(absolute|fixed)/);
    }
  });
});

describe('sett-crumb', () => {
  it('is mono and its text never eases', () => {
    const css = cssOf('sett-crumb');
    expect(css).toContain('font-family: var(--sett-font-mono)');
    expect(css).not.toMatch(/transition/);
  });
  it('every step but the last is a button that goes up; the last is where you are', async () => {
    const el = await mount(`<sett-crumb steps='["zero2prod","api","routes · public"]'></sett-crumb>`);
    const got = heard(el, 'sett-go');
    const buttons = Array.from(el.shadowRoot!.querySelectorAll('button'));
    expect(buttons.map((b) => b.textContent)).toEqual(['zero2prod', 'api']);
    const here = el.shadowRoot!.querySelector('b')!;
    expect(here.textContent).toBe('routes · public');
    expect(here.getAttribute('aria-current')).toBe('location');
    expect(Array.from(el.shadowRoot!.querySelectorAll('i')).map((i) => i.textContent)).toEqual(['›', '›']);
    buttons[1].click();
    expect(got).toEqual([{ index: 1, step: 'api' }]);
    expect(el.getAttribute('role')).toBe('group');
  });
  it('one step is only a place', async () => {
    const el = await mount('<sett-crumb></sett-crumb>'); el.steps = ['ripgrep']; await el.updateComplete;
    expect(el.shadowRoot!.querySelector('button')).toBeNull();
    expect(el.shadowRoot!.querySelector('b')!.textContent).toBe('ripgrep');
  });
});

describe('sett-back', () => {
  it('is a pill whose border eases with motion.hover, with a still twin', () => {
    const css = cssOf('sett-back');
    expect(css).toContain('border-radius: var(--sett-radius-pill)');
    expect(css.match(/transition:[^;]+;/g)).toEqual(['transition: border-color var(--sett-motion-hover) ease;', 'transition: none;']);
  });
  it('is a button: click, Enter and Space go back', async () => {
    const el = await mount('<sett-back hint="esc">board</sett-back>'); const got = heard(el, 'sett-back');
    expect(el.getAttribute('role')).toBe('button');
    expect(el.tabIndex).toBe(0);
    expect(el.shadowRoot!.querySelector('.k')!.textContent).toBe('esc');
    el.click();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
    expect(got).toHaveLength(3);
  });
  it('says back when given no words, and shows no key without a hint', async () => {
    const el = await mount('<sett-back></sett-back>');
    expect(el.shadowRoot!.querySelector('slot')!.textContent).toBe('back');
    expect(el.shadowRoot!.querySelector('.k')).toBeNull();
  });
});

describe('sett-cue', () => {
  it('the bar is a reading, not a motion', () => {
    expect(cssOf('sett-cue')).not.toMatch(/transition/);
  });
  it('fills from `from` to `threshold` and is a progressbar named by its label', async () => {
    const el = await mount('<sett-cue value="730" from="560" threshold="900">keep zooming</sett-cue>');
    const bar = el.shadowRoot!.querySelector('[role="progressbar"]')!;
    expect(el.progress).toBe(0.5);
    expect(bar.getAttribute('aria-valuenow')).toBe('50');
    expect(bar.getAttribute('aria-labelledby')).toBe('l');
    expect((bar.firstElementChild as HTMLElement).style.width).toBe('50%');
    expect(el.reached).toBe(false);
  });
  it('clamps under and over, and says when the threshold is reached', async () => {
    const el = await mount('<sett-cue value="100" from="560" threshold="900"></sett-cue>');
    expect(el.progress).toBe(0);
    el.value = 950; await el.updateComplete;
    expect(el.progress).toBe(1);
    expect(el.hasAttribute('reached')).toBe(true);
    el.value = 600; await el.updateComplete;
    expect(el.hasAttribute('reached')).toBe(false);
    expect(cssOf('sett-cue')).toMatch(/:host\(\[reached\]\) \.fill \{ background: var\(--sett-color-sel\)/);
  });
  it('a threshold at or under `from` is either reached or not', async () => {
    const el = await mount('<sett-cue value="1" from="1" threshold="1"></sett-cue>');
    expect(el.progress).toBe(1);
    el.value = 0; await el.updateComplete;
    expect(el.progress).toBe(0);
  });
});
