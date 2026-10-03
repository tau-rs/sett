import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import type { SettHintChip } from '../src/map/sett-hint-chip.js';

const cssOf = (tag: string) => { const s = (customElements.get(tag) as any).styles; return (Array.isArray(s) ? s : [s]).flat().map((x: any) => x.cssText).join('\n'); };
const mount = async (attrs: string) => {
  document.body.innerHTML = `<div style="position:relative"><sett-hint-chip ${attrs}></sett-hint-chip></div>`;
  const el = document.body.querySelector('sett-hint-chip') as SettHintChip;
  await el.updateComplete;
  return el;
};

beforeAll(() => customElements.whenDefined('sett-hint-chip'));
afterEach(() => { document.body.innerHTML = ''; });

describe('sett-hint-chip', () => {
  it('uses tokens only; it breathes and ignites like a node, and stops under reduced motion', () => {
    const c = cssOf('sett-hint-chip');
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(c).not.toMatch(/\d+px/);
    expect(c).toContain('var(--sett-map-radius-hint)');
    expect(c).toMatch(/@media \(prefers-reduced-motion: reduce\) \{ \.sd\.live, \.sd\.ignite \{ animation: none; \} \}/);
  });
  it('hangs from its anchor by its side', () => {
    const c = cssOf('sett-hint-chip');
    expect(c).toContain(":host([side='right']) { transform: translate(-100%, -50%); }");
    expect(c).toContain(":host([side='bottom']) { transform: translate(-50%, -100%); }");
  });
  it('one neighbour: its name; several: n neighbours and the first two names, double border', async () => {
    const one = await mount('keys="grep-searcher" names="grep-searcher" side="right"');
    expect(one.shadowRoot!.querySelector('.pill')!.classList.contains('group')).toBe(false);
    expect(one.shadowRoot!.querySelector('.pill')!.textContent!.trim()).toBe('grep-searcher');
    expect(one.shadowRoot!.querySelector('.pill')!.getAttribute('aria-label')).toBe('grep-searcher, off-screen to the right');
    const many = await mount('keys="a b c" names="globset, grep-cli, ignore" side="top"');
    const pill = many.shadowRoot!.querySelector('.pill')!;
    expect(pill.classList.contains('group')).toBe(true);
    expect([...pill.querySelectorAll('span')].map((x) => x.textContent!.trim())).toEqual(['3 neighbours', '· globset, grep-cli']);
    expect(pill.getAttribute('aria-label')).toBe('3 neighbours off-screen above: globset, grep-cli, ignore');
    expect(many.keys).toEqual(['a', 'b', 'c']);
  });
  it('an agent working inside: its dot breathes; a session arriving ignites it', async () => {
    const el = await mount('keys="grep-cli" names="grep-cli" sessions="mg" live="mg"');
    expect(el.shadowRoot!.querySelector('.sd')!.classList.contains('live')).toBe(true);
    el.sessions = 'mg tl'; el.live = 'mg tl'; await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll('.sd.ignite').length).toBe(1);
  });
  it('pointing at it fires sett-light with its keys, so the app can light its edges', async () => {
    const el = await mount('keys="x y" names="x, y"');
    const seen: unknown[] = [];
    document.body.addEventListener('sett-light', (e) => seen.push((e as CustomEvent).detail));
    el.shadowRoot!.querySelector('.pill')!.dispatchEvent(new Event('pointerenter'));
    el.shadowRoot!.querySelector('.pill')!.dispatchEvent(new Event('pointerleave'));
    expect(seen).toEqual([{ on: true, keys: ['x', 'y'] }, { on: false, keys: ['x', 'y'] }]);
  });
  it('a pill removed under the pointer (its unit came into view) puts the light out from where it was', async () => {
    const el = await mount('keys="x" names="x"');
    const host = el.parentElement!;
    const seen: boolean[] = [];
    host.addEventListener('sett-light', (e) => seen.push((e as CustomEvent).detail.on));
    el.shadowRoot!.querySelector('.pill')!.dispatchEvent(new Event('pointerenter'));
    el.remove();
    expect(seen).toEqual([true, false]);
  });
  it('is reachable by keyboard', async () => {
    const el = await mount('keys="x" names="x"');
    const pill = el.shadowRoot!.querySelector('.pill')!;
    expect(pill.getAttribute('role')).toBe('button');
    expect(pill.getAttribute('tabindex')).toBe('0');
    expect(cssOf('sett-hint-chip')).toContain('.pill:focus-visible');
  });
});
