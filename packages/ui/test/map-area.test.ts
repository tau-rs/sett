import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

type El = HTMLElement & { updateComplete: Promise<boolean>; [k: string]: any };
const tick = () => new Promise((r) => setTimeout(r, 0));
const mount = async (markup: string): Promise<El> => {
  document.body.innerHTML = markup;
  const el = document.body.querySelector('sett-area') as El;
  await el.updateComplete; await tick(); await el.updateComplete;
  return el;
};
const cssOf = (tag: string) => { const s = (customElements.get(tag) as any).styles; return (Array.isArray(s) ? s : [s]).map((x: any) => x.cssText).join('\n'); };
const stubAnimate = () => {
  const calls: { el: Element; frames: Keyframe[] }[] = [];
  (Element.prototype as any).animate = function (frames: Keyframe[]) { calls.push({ el: this, frames }); return { finished: Promise.resolve() }; };
  return calls;
};
const header = (el: El) => el.shadowRoot!.querySelector('[part="header"]') as HTMLElement;
const tags = (el: El) => Array.from(el.shadowRoot!.querySelectorAll('sett-tag')).map((t) => `${t.getAttribute('kind')}:${t.textContent}`);
const dots = (el: El) => Array.from(el.shadowRoot!.querySelectorAll('.sd')) as HTMLElement[];
const ROUTES = `<sett-area name="routes · public">
  <sett-item entry>health_check()</sett-item>
  <sett-item entry session="yk" live>subscribe()</sett-item>
  <sett-item entry finding session="tl">confirm()</sett-item>
  <sett-item>SubscriptionToken</sett-item>
</sett-area>`;

afterEach(() => { delete (Element.prototype as any).animate; delete (globalThis as any).matchMedia; });
beforeAll(() => customElements.whenDefined('sett-area'));

describe('sett-area', () => {
  it('uses tokens only, never uppercases, and animates only what DESIGN.md § Motion names', () => {
    const css = cssOf('sett-area');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px/);
    expect(css).not.toMatch(/\d+m?s\b/);
    expect(css).not.toMatch(/uppercase|letter-spacing/);
    const names = Array.from(css.matchAll(/animation:\s*([a-z-]+)/g)).map((m) => m[1]);
    expect(new Set(names)).toEqual(new Set(['sett-pop', 'sett-badge', 'sett-ignite', 'none']));
  });
  it('the header counts what is inside: items, findings, one dot per session', async () => {
    const el = await mount(ROUTES);
    expect(header(el).querySelector('b')!.textContent).toBe('routes · public');
    expect(header(el).querySelector('em')!.textContent).toBe('4');
    expect(tags(el)).toEqual(['bad:1']);
    expect(dots(el).map((d) => d.getAttribute('title'))).toEqual(['yk', 'tl']);
  });
  it('open, the dots are still: the live item itself carries the life', async () => {
    const el = await mount(ROUTES);
    expect(dots(el).some((d) => d.classList.contains('live'))).toBe(false);
  });
  it('folding hands the life to the header: the live session breathes, the touched one stays still', async () => {
    const el = await mount(ROUTES);
    let detail: any; el.addEventListener('sett-fold', (e: Event) => { detail = (e as CustomEvent).detail; });
    header(el).click(); await el.updateComplete;
    expect(el.hasAttribute('folded')).toBe(true);
    expect(detail).toEqual({ folded: true });
    expect(header(el).getAttribute('aria-expanded')).toBe('false');
    expect(el.shadowRoot!.querySelector('[part="body"]')!.hasAttribute('inert')).toBe(true);
    const [yk, tl] = dots(el);
    expect(yk.classList.contains('live')).toBe(true);
    expect(tl.classList.contains('live')).toBe(false);
    header(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); await el.updateComplete;
    expect(el.hasAttribute('folded')).toBe(false);
  });
  it('folded, it says how many selected items it hides', async () => {
    const el = await mount(ROUTES);
    el.querySelector('sett-item')!.setAttribute('selected', ''); await tick(); await el.updateComplete;
    expect(tags(el)).toEqual(['bad:1']);
    el.folded = true; await el.updateComplete;
    expect(tags(el)).toEqual(['bad:1', 'sel:1']);
  });
  it('recounts when an item changes: a fixed finding pops its count, then the count leaves', async () => {
    const el = await mount(ROUTES);
    el.querySelector('[finding]')!.removeAttribute('finding'); await tick(); await el.updateComplete;
    expect(el.shadowRoot!.querySelector('sett-tag[kind="bad"]')!.classList.contains('pop')).toBe(true);
    await new Promise((r) => setTimeout(r, 300)); await el.updateComplete;
    expect(tags(el)).toEqual([]);
  });
  it('an agent arriving in a folded area lands on the area: pulse, and its badge ignites', async () => {
    const el = await mount(ROUTES.replace('<sett-area name="routes · public">', '<sett-area name="routes · public" folded>'));
    const calls = stubAnimate();
    const it = el.querySelector('sett-item:last-child') as El;
    it.setAttribute('session', 'mg'); it.setAttribute('live', ''); await tick(); await el.updateComplete;
    expect(calls.filter((c) => c.el === el).length).toBe(1);                              // the area blooms
    expect(calls.filter((c) => (c.el as HTMLElement).className === 'sett-wave').length).toBe(2);   // two waves in its shape
    const mg = dots(el).find((d) => d.getAttribute('title') === 'mg')!;
    expect(mg.classList.contains('ignite')).toBe(true);
    expect(el.style.getPropertyValue('--_session'), 'the pulse takes the colour of the agent who moved (#78)').toBe('var(--sett-session-mg-main)');
    calls.length = 0;
    it.removeAttribute('live'); await tick(); await el.updateComplete;
    expect(calls.length).toBe(1);                                                          // one wave closing in
    expect(calls[0].frames[0].opacity).toBe(0);
  });
  it('attributes override the counting, for a folded area whose items are not rendered', async () => {
    const el = await mount('<sett-area name="elements" folded count="214" findings="3" sessions="yk mg"></sett-area>');
    expect(header(el).querySelector('em')!.textContent).toBe('214');
    expect(tags(el)).toEqual(['bad:3']);
    expect(dots(el).map((d) => d.getAttribute('title'))).toEqual(['yk', 'mg']);
  });
});
