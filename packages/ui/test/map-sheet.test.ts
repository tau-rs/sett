import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

type El = HTMLElement & { updateComplete: Promise<boolean>; [k: string]: any };
const cssOf = (tag: string) => { const s = (customElements.get(tag) as any).styles; return (Array.isArray(s) ? s : [s]).map((x: any) => x.cssText).join('\n'); };

beforeAll(() => customElements.whenDefined('sett-sheet'));

describe('sett-sheet', () => {
  it('lays out rail · columns · rail and folds every area at once', async () => {
    document.body.innerHTML = `<sett-sheet>
      <sett-rail slot="exposes" side="exposes"></sett-rail>
      <sett-column kind="driving" label="driving"><sett-area name="a"><sett-item>x</sett-item></sett-area><sett-area name="b"></sett-area></sett-column>
      <sett-rail slot="needs" side="needs"></sett-rail></sett-sheet>`;
    const el = document.body.firstElementChild as El; await el.updateComplete;
    expect(Array.from(el.shadowRoot!.querySelectorAll('slot')).map((s) => s.getAttribute('name'))).toEqual(['exposes', null, 'needs']);
    expect(cssOf('sett-sheet')).toContain('gap: var(--sett-map-size-column-gutter)');
    el.folded = true; await el.updateComplete;
    expect(Array.from(el.querySelectorAll('sett-area')).every((a) => (a as El).folded)).toBe(true);
    el.folded = false; await el.updateComplete;
    expect(Array.from(el.querySelectorAll('sett-area')).some((a) => (a as El).folded)).toBe(false);
  });
});
