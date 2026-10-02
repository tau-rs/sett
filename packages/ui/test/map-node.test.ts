import { beforeAll, describe, expect, it } from 'vitest';
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
  it('uses tokens only and never animates (the camera moves, the node does not)', () => {
    const css = cssOf('sett-node');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px/);
    expect(css).not.toMatch(/animation|transition/);
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
});
