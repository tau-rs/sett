import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import type { SettGhost } from '../src/map/sett-ghost.js';

const cssOf = (tag: string) => { const s = (customElements.get(tag) as any).styles; return (Array.isArray(s) ? s : [s]).flat().map((x: any) => x.cssText).join('\n'); };
const mount = async (attrs: string, inner = '') => {
  document.body.innerHTML = `<sett-ghost ${attrs}>${inner}</sett-ghost>`;
  const el = document.body.querySelector('sett-ghost') as SettGhost;
  await el.updateComplete;
  return el;
};
const slots = (el: SettGhost) => [...el.shadowRoot!.querySelectorAll('slot')].map((s) => s.getAttribute('name') ?? '');

beforeAll(() => customElements.whenDefined('sett-ghost'));
afterEach(() => { document.body.innerHTML = ''; });

describe('sett-ghost', () => {
  it('uses tokens only and never opacity: it recedes by colour, the ink and line tokens redefined for all it holds', () => {
    const c = cssOf('sett-ghost');
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(c).not.toMatch(/\d+px/);
    expect(c).not.toMatch(/opacity/);
    expect(c).toContain('--sett-color-ink: var(--sett-color-mute);');
    expect(c).toContain('--sett-color-ink2: var(--sett-color-mute);');
    expect(c).toContain('--sett-color-line: var(--sett-color-line2);');
  });
  it('the three bodies: unit hosts a folded sheet, system a port list, cluster one row per member', async () => {
    expect(slots(await mount('body="unit" name="llm proxy"'))).toEqual(['', 'inside']);
    expect(slots(await mount('body="system" name="postgres"'))).toEqual(['', 'exposes', 'needs']);
    expect(slots(await mount('body="cluster" name="3 neighbours"'))).toEqual(['', 'members']);
  });
  it('the head: name and kind; a declared system is dashed and says so', async () => {
    const el = await mount('body="system" name="browsers · clients" kind="declared" declared');
    expect(el.shadowRoot!.querySelector('.hd')!.textContent).toBe('browsers · clientsdeclared');
    expect(el.shadowRoot!.querySelector('.meta')!.textContent!.trim()).toBe('declared · unverified');
    expect(cssOf('sett-ghost')).toContain(':host([declared]) { border-style: dashed; }');
  });
  it('carries no close: it is not open', async () => {
    const el = await mount('body="unit" name="llm proxy"');
    expect(el.shadowRoot!.textContent).not.toContain('close');
  });
  it('reflects its key, the name a sett-edge ends on', async () => {
    const el = await mount('body="system" name="postgres"');
    el.key = 'postgres'; await el.updateComplete;
    expect(el.getAttribute('key')).toBe('postgres');
  });
});
