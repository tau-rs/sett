import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const mount = async (m: string) => {
  document.body.innerHTML = m;
  const el = document.body.firstElementChild as any;
  await el.updateComplete;
  return el;
};
const DOORS = '<sett-button slot="door" variant="primary" size="sm">with Yokohama</sett-button><sett-button slot="door" size="sm">review it myself</sett-button>';

beforeAll(() => customElements.whenDefined('sett-empty'));
afterEach(() => { document.body.innerHTML = ''; });

describe('sett-empty', () => {
  it('uses tokens only and never animates', () => {
    expect(cssOf('sett-empty')).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\d+px|animation|transition/);
  });
  it('writes its words in secondary ink and is no live region: nothing is announced', async () => {
    expect(cssOf('sett-empty')).toMatch(/color:\s*var\(--sett-color-ink2\)/);
    const el = await mount(`<sett-empty>no findings${DOORS}</sett-empty>`);
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-live')).toBe(false);
  });
  it('stacks the words over the doors, with no ·', async () => {
    const el = await mount(`<sett-empty>no review yet${DOORS}</sett-empty>`);
    const r = el.shadowRoot;
    expect(r.querySelector('.doors').hidden).toBe(false);
    expect(r.querySelector('.sep')).toBeNull();
    expect((r.querySelector('slot[name="door"]') as HTMLSlotElement).assignedElements().map((b) => b.textContent)).toEqual(['with Yokohama', 'review it myself']);
  });
  it('inline, separates the words from the doors with ·', async () => {
    const el = await mount(`<sett-empty inline>no findings${DOORS}</sett-empty>`);
    expect(el.shadowRoot.querySelector('.sep')).not.toBeNull();
    expect(cssOf('sett-empty')).toMatch(/\.sep::before\s*\{\s*content:\s*var\(--sett-glyph-sep\)/);
  });
  it('without a door, keeps neither the doors\' row nor the ·', async () => {
    const el = await mount('<sett-empty inline>nothing new since you looked</sett-empty>');
    expect(el.shadowRoot.querySelector('.doors').hidden).toBe(true);
    expect(el.shadowRoot.querySelector('.sep')).toBeNull();
  });
});
