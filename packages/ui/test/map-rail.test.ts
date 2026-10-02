import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import { RAIL_LABEL, RAIL_SECTIONS, sectionOf, unitPorts, type Fixture } from '../src/index.js';
import zero2prodJson from '../src/map/fixtures/zero2prod.json' with { type: 'json' };
import zedJson from '../src/map/fixtures/zed.json' with { type: 'json' };

const zero2prod = zero2prodJson as unknown as Fixture;
const zed = zedJson as unknown as Fixture;

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
  it('keeps the seven sections in the fixed order, unresolved last, and labels them per side', () => {
    expect(RAIL_SECTIONS).toEqual(['services', 'third-party', 'events', 'data', 'system', 'crates', 'unresolved']);
    expect(RAIL_LABEL.unresolved).toEqual({ exposes: 'unresolved', needs: 'unresolved' });
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
  it('unresolved comes last, on its own tint, and is gone when nothing is unresolved', async () => {
    expect(cssOf('sett-rail')).toContain('background: var(--sett-map-surface-unresolved)');
    const el = await mount(`<sett-rail side="needs">
      <sett-port-row slot="unresolved" kind="http" name="livekit" side="needs"></sett-port-row>
      <sett-port-row slot="crates" kind="crate" name="gpui" side="needs"></sett-port-row>
    </sett-rail>`);
    const sr = el.shadowRoot!;
    const visible = Array.from(sr.querySelectorAll('.sec')).filter((s) => !s.closest('[hidden]')).map((s) => s.querySelector('span')!.textContent);
    expect(visible).toEqual(['libraries', 'unresolved']);
    const band = sr.querySelector('.un')!;
    expect(band.hasAttribute('hidden')).toBe(false);
    expect(band.querySelector('.sec em')!.textContent).toBe('1');
    expect(band.querySelector('slot[name="unresolved"]')).not.toBeNull();
    expect(Array.from(sr.querySelectorAll('slot')).pop()!.getAttribute('name')).toBe('unresolved');
    expect(sr.querySelector('[part="header"]')!.textContent).toContain('2 ports');
    const none = await mount('<sett-rail side="needs"><sett-port-row slot="crates" kind="crate" name="gpui" side="needs"></sett-port-row></sett-rail>');
    expect(none.shadowRoot!.querySelector('.un')!.hasAttribute('hidden')).toBe(true);
  });
  it('an empty rail says so', async () => {
    const el = await mount('<sett-rail side="exposes"></sett-rail>');
    expect(el.shadowRoot!.textContent).toContain('nothing exposed');
    expect(el.shadowRoot!.querySelector('[part="header"]')!.textContent).toContain('0 ports');
  });
});

describe('the rail section of a fixture port', () => {
  const sections = (f: Fixture, id: string, side: 'exposes' | 'needs') => Object.fromEntries(unitPorts(f, id)[side].map((p) => [p.name, sectionOf(p, f)]));
  it('an owner tells a platform service from a third party', () => {
    expect(sections(zero2prod, 'api', 'needs')).toMatchObject({ postgres: 'data', sessions: 'data', Postmark: 'third-party' });
    expect(sections(zero2prod, 'api', 'exposes')).toEqual({ '12 routes': 'services' });
  });
  it('a service we need whose contract names no owner is unresolved', () => {
    expect(sections(zed, 'agent', 'needs')).toEqual({ gpui: 'crates', language: 'crates', 'anthropic · openai · …': 'unresolved' });
    expect(sections(zed, 'collab', 'needs')).toEqual({ postgres: 'data', livekit: 'unresolved', gpui: 'crates' });
  });
  it('what we expose is ours, owner or not', () => {
    expect(sections(zed, 'collab', 'exposes')).toEqual({ 'zed.proto': 'services', '/api': 'services' });
  });
});
