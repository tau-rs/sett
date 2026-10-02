import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import { tierFor } from '../src/index.js';

const mount = async (markup: string) => {
  document.body.innerHTML = markup;
  const el = document.body.firstElementChild as HTMLElement & { updateComplete: Promise<boolean> };
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
};
const cssOf = (tag: string) => { const s = (customElements.get(tag) as any).styles; return (Array.isArray(s) ? s : [s]).map((x: any) => x.cssText).join('\n'); };
const tick = () => new Promise((r) => setTimeout(r, 0));
const stubAnimate = () => {
  const calls: { el: Element; frames: Keyframe[] }[] = [];
  (Element.prototype as any).animate = function (frames: Keyframe[]) { calls.push({ el: this, frames }); return { finished: Promise.resolve() }; };
  return calls;
};
const dots = (el: HTMLElement) => Array.from(el.shadowRoot!.querySelectorAll('.sd')) as HTMLElement[];
const waves = (calls: { el: Element }[]) => calls.filter((c) => (c.el as HTMLElement).className === 'sett-wave');

afterEach(() => { delete (Element.prototype as any).animate; delete (globalThis as any).matchMedia; });
beforeAll(() => customElements.whenDefined('sett-node'));

describe('tierFor', () => {
  it('reads the tier from the on-screen width', () => {
    expect(tierFor(100)).toBe('mini');
    expect(tierFor(110)).toBe('chip');
    expect(tierFor(379)).toBe('chip');
    expect(tierFor(380)).toBe('card');
    expect(tierFor(760)).toBe('sheet');
  });
  it('folds back only past the hysteresis band', () => {
    expect(tierFor(370, 'card')).toBe('card');
    expect(tierFor(339, 'card')).toBe('chip');
    expect(tierFor(370, 'chip')).toBe('chip');
    expect(tierFor(100, 'sheet')).toBe('mini');
    expect(tierFor(900, 'chip')).toBe('sheet');
  });
});

describe('sett-node', () => {
  it('uses tokens only and animates only what DESIGN.md § Motion lists (the box never resizes itself)', () => {
    const css = cssOf('sett-node');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px/);
    expect(css).not.toMatch(/\d+m?s\b/);
    expect(css).not.toMatch(/transition/);
    const names = Array.from(css.matchAll(/animation:\s*([a-z-]+)/g)).map((m) => m[1]);
    expect(new Set(names)).toEqual(new Set(['sett-badge', 'sett-ignite', 'none']));
    expect(css, 'the still twin: under reduced motion the badge neither breathes nor ignites').toMatch(/prefers-reduced-motion: reduce\) \{[^}]*\.sd\.live, \.sd\.ignite \{ animation: none; \}/);
    expect(css, 'far recedes by colour, never by opacity (contrast gate)').not.toMatch(/\[far\][^}]*opacity/);
    expect(css).toMatch(/:host\(\[far\]\) \{ color: var\(--sett-color-mute\)/);
  });
  it('mini shows the name only; chip adds kind, meta and badges', async () => {
    const mini = await mount('<sett-node tier="mini" name="api" kind="app"><span>1 crate</span></sett-node>');
    expect(mini.shadowRoot!.querySelector('.hd b')!.textContent).toBe('api');
    expect(mini.shadowRoot!.querySelector('.hd em')).toBeNull();
    expect(mini.shadowRoot!.querySelector('.meta')).toBeNull();
    const chip = await mount('<sett-node tier="chip" name="api" kind="app"><span>1 crate</span><i slot="badges">2</i></sett-node>');
    expect(chip.shadowRoot!.querySelector('.hd em')!.textContent).toBe('app');
    expect(chip.shadowRoot!.querySelector('.meta slot')).not.toBeNull();
    expect(chip.shadowRoot!.querySelector('slot[name="badges"]')).not.toBeNull();
    expect(chip.shadowRoot!.querySelector('[part="ports"]')).toBeNull();
  });
  it('card lays ports in two columns and counts them', async () => {
    const el = await mount(`<sett-node tier="card" name="api" kind="app">
      <sett-port-row slot="exposes" kind="http" name="routes" count="12"></sett-port-row>
      <sett-port-row slot="needs" kind="sql" name="postgres" side="needs"></sett-port-row>
      <sett-port-row slot="needs" kind="redis" name="sessions" side="needs"></sett-port-row>
    </sett-node>`);
    const sr = el.shadowRoot!;
    expect(sr.querySelectorAll('[part="ports"] .col').length).toBe(2);
    expect(sr.querySelector('.pcap')!.textContent).toContain('exposes · 1');
    expect(sr.querySelector('.pcap')!.textContent).toContain('needs · 2');
  });
  it('a closed node has no foot and no link: it opens by double-click or ↩, which are the host\'s (rule 4)', async () => {
    for (const tier of ['mini', 'chip', 'card']) {
      const el = await mount(`<sett-node tier="${tier}" name="api" kind="app"></sett-node>`);
      expect(el.shadowRoot!.querySelector('[part="foot"]'), tier).toBeNull();
      expect(el.shadowRoot!.querySelector('a'), tier).toBeNull();
    }
    expect(cssOf('sett-node'), 'the card keeps its bottom padding under the counts line').toContain(":host([tier='card']) .pcap { padding-bottom: var(--sett-space-2); }");
  });
  it('an open node hosts the inside and keeps one link, close', async () => {
    const el = await mount('<sett-node tier="sheet" name="api" kind="app"><div slot="inside">columns</div></sett-node>');
    expect(el.shadowRoot!.querySelector('slot[name="inside"]')).not.toBeNull();
    const links = Array.from(el.shadowRoot!.querySelectorAll('[part="foot"] a')) as HTMLElement[];
    expect(links.map((a) => a.textContent)).toEqual(['▴ close']);
    const acts: string[] = [];
    el.addEventListener('sett-open', (e: Event) => acts.push((e as CustomEvent).detail.action));
    links[0].click();
    expect(acts).toEqual(['close']);
  });
  it('an open unit whose inside brings its own rails does not list its ports twice', async () => {
    const bare = await mount('<sett-node tier="sheet" name="api" kind="app"><sett-sheet slot="inside"><sett-rail slot="exposes" side="exposes"></sett-rail><sett-rail slot="needs" side="needs"></sett-rail></sett-sheet></sett-node>');
    expect(bare.shadowRoot!.querySelector('[part="ports"]')!.hasAttribute('hidden')).toBe(true);
    expect(bare.shadowRoot!.querySelector('.pcap')!.hasAttribute('hidden')).toBe(true);
    const withRows = await mount('<sett-node tier="sheet" name="api" kind="app"><sett-port-row slot="exposes" kind="http" name="routes"></sett-port-row></sett-node>');
    expect(withRows.shadowRoot!.querySelector('[part="ports"]')!.hasAttribute('hidden')).toBe(false);
    const card = await mount('<sett-node tier="card" name="api" kind="app"></sett-node>');
    expect(card.shadowRoot!.querySelector('[part="ports"]')!.hasAttribute('hidden')).toBe(false);
  });
  it('declared replaces the meta with the provenance line', async () => {
    const el = await mount('<sett-node tier="chip" name="zed.dev" kind="external" declared><span>x</span></sett-node>');
    expect(el.shadowRoot!.querySelector('.meta')!.textContent).toContain('declared · unverified');
  });

  it('one dot per session in the head, in session order, at every tier', async () => {
    for (const tier of ['mini', 'chip', 'card', 'sheet']) {
      const el = await mount(`<sett-node tier="${tier}" name="api" kind="app" sessions="tl yk"></sett-node>`);
      expect(dots(el).map((d) => d.getAttribute('title')), tier).toEqual(['yk', 'tl']);
    }
    const none = await mount('<sett-node tier="chip" name="api" kind="app"></sett-node>');
    expect(dots(none)).toEqual([]);
  });
  it('closed, the box is the nearest thing you can see: a live session breathes, a session that only touched the unit is still', async () => {
    const el = await mount('<sett-node tier="chip" name="api" kind="app" sessions="yk tl" live="yk"></sett-node>');
    const [yk, tl] = dots(el);
    expect(yk.classList.contains('live')).toBe(true);
    expect(tl.classList.contains('live')).toBe(false);
    expect(yk.style.getPropertyValue('--_beat')).toBe('0');
    expect(tl.style.getPropertyValue('--_beat')).toBe('1');
  });
  it('open, the inside carries the life: a dot is still while its item is on screen, and breathes when the item is not rendered', async () => {
    const el = await mount(`<sett-node tier="sheet" name="api" kind="app" sessions="yk mg" live="yk mg"><sett-sheet slot="inside"><sett-column kind="domain"><sett-area name="routes"><sett-item data-id="s" session="yk" live>subscribe()</sett-item></sett-area></sett-column></sett-sheet></sett-node>`);
    const [yk, mg] = dots(el);
    expect(yk.classList.contains('live'), 'its item is on screen').toBe(false);
    expect(mg.classList.contains('live'), 'no item of its own: the box is the nearest thing').toBe(true);
    el.querySelector('[data-id="s"]')!.removeAttribute('live'); await tick(); await el.updateComplete;
    expect(dots(el)[0].classList.contains('live'), 'the item went still while the unit still says yk is live: the box takes the mark').toBe(true);
  });
  it('closed, live flipping on plays the arrival on the box (the larger wave) and ignites the badge; flipping off, the departure', async () => {
    const el = await mount('<sett-node tier="chip" name="api" kind="app" sessions="yk tl"></sett-node>');
    const calls = stubAnimate();
    el.setAttribute('live', 'tl'); await el.updateComplete;
    expect(calls.filter((c) => c.el === el).length, 'the box blooms once').toBe(1);
    expect(waves(calls).length, 'two waves in its own shape').toBe(2);
    expect(waves(calls)[0].frames[1].inset, 'the larger wave, map.size.waveNode').toContain('--sett-map-size-wave-node');
    const tl = dots(el).find((d) => d.getAttribute('title') === 'tl')!;
    expect(tl.classList.contains('ignite')).toBe(true);
    expect(el.style.getPropertyValue('--_session'), 'the pulse takes the colour of the agent who moved').toBe('var(--sett-session-tl-main)');
    calls.length = 0;
    el.setAttribute('live', ''); await el.updateComplete;
    expect(calls.length, 'one wave closing in').toBe(1);
    expect(calls[0].frames[0].opacity).toBe(0);
    expect(calls[0].frames[0].inset).toContain('--sett-map-size-wave-node');
  });
  it('open with the item on screen, the pulse is the item\'s: the box stays still', async () => {
    const el = await mount(`<sett-node tier="sheet" name="api" kind="app" sessions="yk"><sett-sheet slot="inside"><sett-column kind="domain"><sett-area name="routes"><sett-item data-id="s" session="yk">subscribe()</sett-item></sett-area></sett-column></sett-sheet></sett-node>`);
    const calls = stubAnimate();
    el.querySelector('[data-id="s"]')!.setAttribute('live', '');
    el.setAttribute('live', 'yk'); await tick(); await el.updateComplete;
    expect(calls.filter((c) => c.el === el).length, 'the box does not bloom').toBe(0);
    expect(waves(calls).filter((c) => c.el.getRootNode() === el.shadowRoot).length, 'no wave on the box').toBe(0);
  });
  it('under reduced motion nothing moves: no wave, no bloom, and the badge is still', async () => {
    (globalThis as any).matchMedia = () => ({ matches: true });
    const el = await mount('<sett-node tier="chip" name="api" kind="app" sessions="yk"></sett-node>');
    const calls = stubAnimate();
    el.setAttribute('live', 'yk'); await el.updateComplete;
    expect(calls.length).toBe(0);
    expect(el.shadowRoot!.querySelector('.sett-wave')).toBeNull();
    expect(dots(el)[0].classList.contains('ignite'), 'the still twin keeps the same classes; the media query stills both ignite and breath').toBe(true);
  });
});
