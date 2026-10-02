import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import { RAIL_LABEL, RAIL_SECTIONS } from '../src/index.js';

const mount = async (markup: string) => {
  document.body.innerHTML = markup;
  const el = document.body.firstElementChild as HTMLElement & { updateComplete: Promise<boolean> };
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
};
const cssOf = (tag: string) => { const s = (customElements.get(tag) as any).styles; return (Array.isArray(s) ? s : [s]).map((x: any) => x.cssText).join('\n'); };

beforeAll(() => customElements.whenDefined('sett-rail'));

describe('sett-rail', () => {
  it('uses tokens only, never animates, and never uppercases', () => {
    const css = cssOf('sett-rail');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px/);
    expect(css).not.toMatch(/animation|transition|uppercase|letter-spacing/);
  });
  it('keeps the six sections in the fixed order and labels them per side', () => {
    expect(RAIL_SECTIONS).toEqual(['services', 'third-party', 'events', 'data', 'system', 'crates']);
    expect(RAIL_LABEL.services.exposes).toBe('api');
    expect(RAIL_LABEL.data.needs).toBe('data stores');
    expect(RAIL_LABEL.crates.needs).toBe('libraries');
  });
  it('shows only the sections that have ports, with their counts, and the total in the header', async () => {
    const el = await mount(`<sett-rail side="needs">
      <sett-port-row slot="data" kind="sql" name="postgres" side="needs"></sett-port-row>
      <sett-port-row slot="data" kind="redis" name="sessions" side="needs"></sett-port-row>
      <sett-port-row slot="third-party" kind="http" name="Postmark" side="needs"></sett-port-row>
    </sett-rail>`);
    const sr = el.shadowRoot!;
    expect(sr.querySelector('[part="header"]')!.textContent).toContain('3 ports');
    const visible = Array.from(sr.querySelectorAll('.sec')).filter((s) => !s.hasAttribute('hidden')).map((s) => s.querySelector('span')!.textContent);
    expect(visible).toEqual(['third-party services', 'data stores']);
    const data = Array.from(sr.querySelectorAll('.sec')).find((s) => s.querySelector('span')!.textContent === 'data stores')!;
    expect(data.querySelector('em')!.textContent).toBe('2');
  });
  it('an empty rail says so', async () => {
    const el = await mount('<sett-rail side="exposes"></sett-rail>');
    expect(el.shadowRoot!.textContent).toContain('nothing exposed');
    expect(el.shadowRoot!.querySelector('[part="header"]')!.textContent).toContain('0 ports');
  });
});
