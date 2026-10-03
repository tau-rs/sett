import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import { ITEM_KINDS } from '../src/index.js';

type El = HTMLElement & { updateComplete: Promise<boolean>; [k: string]: any };
const mount = async (markup: string): Promise<El> => {
  document.body.innerHTML = markup;
  const el = document.body.querySelector('sett-item') as El;
  await el.updateComplete;
  return el;
};
const cssOf = (tag: string) => { const s = (customElements.get(tag) as any).styles; return (Array.isArray(s) ? s : [s]).map((x: any) => x.cssText).join('\n'); };
// happy-dom has no Web Animations: record the pulses an element plays on itself
const stubAnimate = () => {
  const calls: { el: Element; frames: Keyframe[] }[] = [];
  (Element.prototype as any).animate = function (frames: Keyframe[]) { calls.push({ el: this, frames }); return { finished: Promise.resolve() }; };
  return calls;
};
afterEach(() => { delete (Element.prototype as any).animate; delete (globalThis as any).matchMedia; });
beforeAll(() => customElements.whenDefined('sett-item'));

describe('sett-item', () => {
  it('uses tokens only, and animates only what DESIGN.md § Motion names', () => {
    const css = cssOf('sett-item');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px/);
    expect(css).not.toMatch(/\d+m?s\b/);
    const names = Array.from(css.matchAll(/animation:\s*([a-z-]+)/g)).map((m) => m[1]);
    expect(new Set(names)).toEqual(new Set(['sett-breathe', 'sett-cool', 'sett-sheen', 'sett-kick', 'none']));
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
  it('the name is never animated, faded or resized', () => {
    const css = cssOf('sett-item');
    const nameRule = css.match(/\.t \{[^}]*\}/)![0];
    expect(nameRule).not.toMatch(/animation|transition|opacity|transform|font-size/);
  });
  it('far recedes by colour, never by opacity; a finding and a pin ignore it', () => {
    const css = cssOf('sett-item');
    expect(css).toContain(':host([far]:not([finding]):not([selected])) { color: var(--sett-color-mute); border-color: var(--sett-color-line2); }');
    expect(css).not.toMatch(/:host\(\[far\][^{]*{[^}]*opacity/);
  });
  it('is a button you can reach and use from the keyboard', async () => {
    const el = await mount('<sett-item kind="fn">subscribe()</sett-item>');
    expect(el.getAttribute('role')).toBe('button');
    expect(el.tabIndex).toBe(0);
    let n = 0; el.addEventListener('sett-select', () => n++);
    el.click();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(n).toBe(3);
  });
  it('reflects its kind and states for styling', async () => {
    const css = cssOf('sett-item');
    for (const s of ['entry', 'port', 'finding', 'selected']) expect(css).toContain(`:host([${s}])`);
    expect(ITEM_KINDS).toEqual(['fn', 'struct', 'enum', 'trait', 'impl', 'mod', 'macro', 'external', 'const', 'static', 'type-alias', 'union']);
    const el = await mount('<sett-item kind="trait" port family="214 impls">Element · trait</sett-item>');
    expect(el.shadowRoot!.querySelector('sett-tag')!.textContent).toBe('214 impls');
    expect(el.hasAttribute('port')).toBe(true);
  });
  it('unresolved links fold to one pill with their count, after the family pill; none, no pill', async () => {
    const el = await mount('<sett-item unresolved="3">spawn_worker()</sett-item>');
    expect(Array.from(el.shadowRoot!.querySelectorAll('sett-tag')).map((t) => t.textContent)).toEqual(['3 unresolved']);
    expect(el.shadowRoot!.querySelector('sett-tag')!.getAttribute('kind'), 'amber, as the rail section').toBe('sug');
    const both = await mount('<sett-item kind="trait" port family="214 impls" unresolved="1">Element · trait</sett-item>');
    expect(Array.from(both.shadowRoot!.querySelectorAll('sett-tag')).map((t) => t.textContent)).toEqual(['214 impls', '1 unresolved']);
    expect((await mount('<sett-item unresolved="0">x</sett-item>')).shadowRoot!.querySelector('sett-tag')).toBeNull();
    expect((await mount('<sett-item>x</sett-item>')).shadowRoot!.querySelector('sett-tag')).toBeNull();
  });
  it('a session alone is a still ring; live makes it breathe and adds the sheen', async () => {
    const plain = await mount('<sett-item>x</sett-item>');
    expect(plain.shadowRoot!.querySelector('.ring')).toBeNull();
    const touched = await mount('<sett-item session="tl">x</sett-item>');
    expect(touched.shadowRoot!.querySelector('.ring')!.classList.contains('live')).toBe(false);
    expect(touched.shadowRoot!.querySelector('.sheen')).toBeNull();
    const live = await mount('<sett-item session="tl" live>x</sett-item>');
    expect(live.shadowRoot!.querySelector('.ring')!.classList.contains('live')).toBe(true);
    expect(live.shadowRoot!.querySelector('.sheen')).not.toBeNull();
  });
  it('plays its own arrival when live turns on and its departure when it turns off, but not on first render', async () => {
    const calls = stubAnimate();
    const el = await mount('<sett-item session="yk">subscribe()</sett-item>');
    expect(calls.length).toBe(0);
    el.live = true; await el.updateComplete;
    const arrival = calls.splice(0);
    expect(arrival.filter((c) => c.el === el).length).toBe(1);                       // the bloom
    expect(arrival.filter((c) => c.el !== el).length).toBe(2);                       // two waves outward
    expect(arrival.filter((c) => c.el !== el)[0].frames[0].opacity).toBe(1);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.sheen')!.classList.contains('kick')).toBe(true);
    el.live = false; await el.updateComplete;
    expect(calls.length).toBe(1);                                                    // one wave closing in
    expect(calls[0].frames[0].opacity).toBe(0);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.ring')!.classList.contains('cool')).toBe(true);
    const born = (await mount('<sett-item session="yk" live>x</sett-item>'));
    await born.updateComplete;
    expect(calls.length).toBe(1);
  });
  it('stays quiet when a folded area hides it: the area carries the mark', async () => {
    const calls = stubAnimate();
    document.body.innerHTML = '<sett-area name="a" folded><sett-item session="yk">x</sett-item></sett-area>';
    const el = document.body.querySelector('sett-item') as El;
    await el.updateComplete;
    el.live = true; await el.updateComplete;
    expect(calls.filter((c) => c.el === el || el.shadowRoot!.contains(c.el)).length).toBe(0);
    await el.flash();
    expect(el.shadowRoot!.querySelector('[part="flash"]')).toBeNull();
  });
  it('flash() is the one-shot change ring', async () => {
    stubAnimate();
    const el = await mount('<sett-item session="yk" live>x</sett-item>');
    const p = el.flash();
    expect(el.shadowRoot!.querySelector('[part="flash"]')).not.toBeNull();
    await p;
    expect(el.shadowRoot!.querySelector('[part="flash"]')).toBeNull();
  });
  it('two agents split one ring instead of stacking two', async () => {
    const el = await mount('<sett-item session="yk" also="tl" live>confirm()</sett-item>');
    expect(el.shadowRoot!.querySelectorAll('.ring').length).toBe(1);
    expect(cssOf('sett-item')).toContain(':host([also="tl"]) { --_also: var(--sett-session-tl-main); }');
  });
});

describe('sett-item overlays: plan and delta (DESIGN.md "The map" rule 13)', () => {
  const css = () => cssOf('sett-item');
  it('a planned item is dashed amber on the amber tint, and says its group in a plain tag', async () => {
    const el = await mount('<sett-item planned group="g1">refund()</sett-item>');
    expect(el.hasAttribute('planned')).toBe(true);
    expect(css()).toMatch(/:host\(\[planned\]\)\s*\{[^}]*background:\s*var\(--sett-color-sug-bg\)[^}]*border-color:\s*var\(--sett-color-sug\)[^}]*border-style:\s*dashed/);
    const tag = el.shadowRoot!.querySelector('sett-tag.group') as HTMLElement;
    expect(tag.textContent!.trim()).toBe('g1');
    expect(tag.getAttribute('kind')).toBe('default');
  });
  it('no group, no tag; a group alone does not paint the item', async () => {
    const el = await mount('<sett-item planned>refund()</sett-item>');
    expect(el.shadowRoot!.querySelector('sett-tag.group')).toBeNull();
  });
  it('a finding outranks the plan and the selection keeps its solid blue line: their rules come after planned', () => {
    const c = css();
    const at = (sel: string) => c.indexOf(sel);
    expect(at(':host([planned])')).toBeGreaterThan(at(':host([port])'));
    expect(at(':host([finding])')).toBeGreaterThan(at(':host([planned])'));
    expect(at(':host([selected])')).toBeGreaterThan(at(':host([finding])'));
  });
  it('delta: unchanged recedes by colour, never by opacity; removed is a dashed ghost with its name struck; added and changed are drawn as they are', async () => {
    const c = css();
    expect(c).toMatch(/:host\(\[delta=['"]unchanged['"]\]\)\s*\{[^}]*color:\s*var\(--sett-color-mute\)[^}]*border-color:\s*var\(--sett-color-line2\)/);
    expect(c).toMatch(/:host\(\[delta=['"]removed['"]\]\)\s*\{[^}]*border-style:\s*dashed/);
    expect(c).toMatch(/:host\(\[delta=['"]removed['"]\]\)\s*\.t\s*\{[^}]*text-decoration:\s*line-through/);
    expect(c).not.toMatch(/:host\(\[delta=['"](added|changed)['"]\]\)/);
    expect(c).not.toMatch(/:host\(\[delta[^{]*\{[^}]*opacity/);
    const el = await mount('<sett-item delta="removed">save_notified()</sett-item>');
    expect(el.getAttribute('delta')).toBe('removed');
  });
  it('a const, a static, an alias and a union write their Rust word before the name; the other kinds write none', async () => {
    const words = { const: 'const', static: 'static', 'type-alias': 'type', union: 'union' } as const;
    for (const [kind, word] of Object.entries(words)) {
      const el = await mount(`<sett-item kind="${kind}">SESSION_TTL</sett-item>`);
      const w = el.shadowRoot!.querySelector('.t .kw')!;
      expect(w.textContent).toBe(word);
      expect(w.nextElementSibling!.tagName).toBe('SLOT');
    }
    for (const kind of ['fn', 'struct', 'impl', 'mod', 'external']) {
      const el = await mount(`<sett-item kind="${kind}">x</sett-item>`);
      expect(el.shadowRoot!.querySelector('.kw')).toBeNull();
    }
  });
  it('the word takes its kind\'s syntax colour, values amber and types teal; receding takes it back to the name\'s ink', () => {
    const css = cssOf('sett-item');
    expect(css).toContain(":host([kind='const']), :host([kind='static']) { --_word: var(--sett-syntax-constant); }");
    expect(css).toContain(":host([kind='type-alias']), :host([kind='union']) { --_word: var(--sett-syntax-type); }");
    expect(css).toMatch(/\.kw \{[^}]*color: var\(--_word, inherit\)/);
    expect(css).toContain(":host([far]:not([finding]):not([selected])) .kw, :host([delta='unchanged']) .kw, :host([delta='removed']) .kw { color: inherit; }");
    expect(css.match(/\.kw \{[^}]*\}/)![0]).not.toMatch(/animation|transition|opacity|transform|font-size/);
  });
});
