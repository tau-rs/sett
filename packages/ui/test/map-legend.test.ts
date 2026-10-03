import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import { FILTER_NONE, LINK_FAMILIES, LINK_KINDS, LINK_KIND_NAMES, PORT_KINDS, filterOf, keptOf, kindsOf } from '../src/index.js';

type El = HTMLElement & { updateComplete: Promise<boolean>; [k: string]: any };
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as El; await el.updateComplete; return el; };
const all = (el: El, sel: string) => Array.from(el.shadowRoot!.querySelectorAll(sel)) as HTMLElement[];
const checks = (el: El) => all(el, '[role="checkbox"]');
const check = (el: El, label: string) => checks(el).find((c) => c.getAttribute('aria-label')!.startsWith(label))!;
/** the test plays the host: it copies the event's filter back onto the legend */
const hosted = (el: El) => { const got: string[] = []; el.addEventListener('sett-filter', (e: any) => { got.push(e.detail.filter); el.filter = e.detail.filter; }); return got; };

beforeAll(() => customElements.whenDefined('sett-legend'));

describe('the filter grammar (sett-sheet filter)', () => {
  it('empty keeps everything; a family stands for its kinds; a word that is no kind keeps nothing', () => {
    expect(keptOf('').size).toBe(LINK_KIND_NAMES.length);
    expect([...keptOf('knows')]).toEqual(kindsOf('knows'));
    expect([...keptOf('calls promises')]).toEqual(['calls', ...kindsOf('promises')]);
    expect(keptOf(FILTER_NONE).size).toBe(0);
  });
  it('writes the shortest filter: empty for all, a family when whole, kinds otherwise, none for nothing', () => {
    expect(filterOf(new Set(LINK_KIND_NAMES))).toBe('');
    expect(filterOf(new Set())).toBe(FILTER_NONE);
    expect(filterOf(new Set([...kindsOf('does'), 'implements', 'refers-to'] as any))).toBe('does implements refers-to');
    for (const f of ['', 'knows', 'calls promises', 'does promises around refers-to', FILTER_NONE]) expect(filterOf(keptOf(f)), f).toBe(f);
  });
});

describe('sett-legend', () => {
  it('uses tokens only; pointing eases a row\'s background with motion.hover and has a still twin', () => {
    const css = cssOf('sett-legend');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px/);
    expect(css).not.toMatch(/animation/);
    expect(css.match(/transition:[^;]+;/g)).toEqual(['transition: background-color var(--sett-motion-hover) ease;', 'transition: none;']);
  });
  it('is on demand: folded to one row until opened, by its own head', async () => {
    const el = await mount('<sett-legend></sett-legend>');
    const head = el.shadowRoot!.querySelector('.head') as HTMLElement;
    expect(head.getAttribute('aria-expanded')).toBe('false');
    expect(checks(el)).toHaveLength(0);
    expect(head.textContent!.trim()).toMatch(/^legend\s*▸$/);
    head.click(); await el.updateComplete;
    expect(el.open).toBe(true);
    expect(head.getAttribute('aria-expanded')).toBe('true');
    expect(checks(el)).toHaveLength(LINK_FAMILIES.length + 1);
  });
  it('folded with a filter on, the row says how many kinds are shown', async () => {
    const el = await mount('<sett-legend filter="does promises around refers-to"></sett-legend>');
    expect(el.shadowRoot!.querySelector('.head .mu')!.textContent).toBe(`· ${LINK_KIND_NAMES.length - kindsOf('knows').length} of ${LINK_KIND_NAMES.length} link kinds shown`);
  });
  it('its rows come from the kind tables: one toggle per family, one per kind inside it, the fallback, and the port kinds as a key', async () => {
    const el = await mount(`<sett-legend open expanded="${LINK_FAMILIES.join(' ')}"></sett-legend>`);
    const labels = checks(el).map((c) => c.getAttribute('aria-label')!.split(' · ')[0]);
    expect(labels).toEqual([...LINK_FAMILIES.flatMap((f) => [f, ...kindsOf(f).map((k) => LINK_KINDS[k].label)]), 'refers to']);
    expect(all(el, '.pk').map((p) => p.textContent)).toEqual(PORT_KINDS);
    expect(all(el, '.pk [role], .key [role]')).toHaveLength(0);
    for (const f of LINK_FAMILIES) expect(cssOf('sett-legend')).toContain(`svg.${f} { --_dash: var(--sett-map-link-${f}-stroke); }`);
  });
  it('a swatch is the kind\'s head, and its ownership diamond, as sett-link draws them', async () => {
    const el = await mount('<sett-legend open expanded="knows"></sett-legend>');
    const holds = check(el, 'holds').querySelector('svg')!;
    expect(holds.classList.contains('knows')).toBe(true);
    expect(holds.querySelectorAll('.line')).toHaveLength(1);
    expect(holds.querySelector('.t.filled')).not.toBeNull();
    expect(check(el, 'shares state').querySelector('.t.hollow')).not.toBeNull();
    expect(check(el, 'knows').querySelector('.h')).toBeNull();
  });
  it('a family toggle fires the next filter and holds no state of its own', async () => {
    const el = await mount('<sett-legend open></sett-legend>');
    const got: string[] = []; el.addEventListener('sett-filter', (e: any) => got.push(e.detail.filter));
    check(el, 'knows').click(); await el.updateComplete;
    expect(got).toEqual(['does promises around refers-to']);
    expect(el.filter).toBe('');
    expect(check(el, 'knows').getAttribute('aria-checked')).toBe('true');
  });
  it('with a host: a family goes off and back on; a kind off leaves its family mixed; a mixed family comes back whole', async () => {
    const el = await mount('<sett-legend open expanded="does"></sett-legend>'); const got = hosted(el);
    check(el, 'knows').click(); await el.updateComplete;
    expect(check(el, 'knows').getAttribute('aria-checked')).toBe('false');
    check(el, 'knows').click(); await el.updateComplete;
    expect(got.at(-1)).toBe('');
    check(el, 'constructs').click(); await el.updateComplete;
    expect(got.at(-1)).toBe('calls calls-port hands-off wires calls-out listens-to promises knows around refers-to');
    expect(check(el, 'does').getAttribute('aria-checked')).toBe('mixed');
    expect(check(el, 'constructs').getAttribute('aria-checked')).toBe('false');
    check(el, 'does').click(); await el.updateComplete;
    expect(got.at(-1)).toBe('');
    expect(check(el, 'does').getAttribute('aria-checked')).toBe('true');
  });
  it('everything off is the filter that keeps nothing', async () => {
    const el = await mount('<sett-legend open></sett-legend>'); const got = hosted(el);
    for (const f of [...LINK_FAMILIES, 'refers to']) { check(el, f).click(); await el.updateComplete; }
    expect(got.at(-1)).toBe(FILTER_NONE);
    expect(checks(el).every((c) => c.getAttribute('aria-checked') === 'false')).toBe(true);
  });
  it('a toggle answers Enter and Space; listing a family\'s kinds is the legend\'s own', async () => {
    const el = await mount('<sett-legend open></sett-legend>'); const got = hosted(el);
    check(el, 'around').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    expect(got).toHaveLength(1);
    const more = all(el, '.more')[0];
    expect(more.getAttribute('aria-expanded')).toBe('false');
    more.click(); await el.updateComplete;
    expect(el.expanded).toBe('does');
    expect(checks(el)).toHaveLength(LINK_FAMILIES.length + 1 + kindsOf('does').length);
    expect(got).toHaveLength(1);
  });
  it('keys an overlay only while it is on: the plan, the delta; the sessions and the findings need none here', async () => {
    const heads = (el: El) => all(el, 'h6').map((h) => h.textContent);
    const el = await mount('<sett-legend open></sett-legend>');
    expect(heads(el)).toEqual(['links', 'ports']);
    el.overlays = 'sessions plan findings delta'; await el.updateComplete;
    expect(heads(el)).toEqual(['links', 'plan', 'delta', 'ports']);
    el.overlays = 'delta'; await el.updateComplete;
    expect(heads(el)).toEqual(['links', 'delta', 'ports']);
    expect(checks(el).every((c) => !c.closest('[aria-label="delta"]')), 'a key, not a filter').toBe(true);
  });
  it('the plan key: a planned item, dashed amber on the amber tint; a planned link, amber and heavier on its band', async () => {
    const el = await mount('<sett-legend open overlays="plan"></sett-legend>');
    const plan = el.shadowRoot!.querySelector('[aria-label="plan"]')!;
    expect(Array.from(plan.querySelectorAll('.nm'), (n) => n.textContent)).toEqual(['planned item', 'planned link']);
    expect(plan.querySelector('.it.planned')).not.toBeNull();
    const svg = plan.querySelector('svg.planned')!;
    expect(svg.querySelector('.band')!.getAttribute('d')).toBe(svg.querySelector('.line')!.getAttribute('d'));
    const css = cssOf('sett-legend');
    expect(css).toMatch(/\.it\.planned \{[^}]*background: var\(--sett-color-sug-bg\);[^}]*border-color: var\(--sett-color-sug\);[^}]*border-style: dashed;/);
    expect(css).toMatch(/svg\.planned \{ color: var\(--sett-color-sug\); \}/);
    expect(css).toMatch(/svg\.planned \.line \{ stroke-width: var\(--sett-stroke-lit\); \}/);
    expect(css).toMatch(/\.band \{[^}]*stroke: var\(--sett-color-sug-bg\);[^}]*stroke-width: var\(--sett-map-size-band\);/);
  });
  it('the delta key: removed, a ghost item and a link cut across its middle; unchanged recedes; added is drawn as it is', async () => {
    const el = await mount('<sett-legend open overlays="delta"></sett-legend>');
    const delta = el.shadowRoot!.querySelector('[aria-label="delta"]')!;
    expect(Array.from(delta.querySelectorAll('.nm'), (n) => n.textContent)).toEqual(['added or changed', 'removed', 'unchanged']);
    expect(delta.querySelector('.it.removed')).not.toBeNull();
    expect(delta.querySelectorAll('svg.removed .cut')).toHaveLength(2);
    expect(delta.querySelector('.it.unchanged')).not.toBeNull();
    const css = cssOf('sett-legend');
    expect(css).toMatch(/svg\.removed \{ color: var\(--sett-color-line\); \}/);
    expect(css).toMatch(/svg\.unchanged \{ opacity: var\(--sett-map-far\); \}/);
    expect(css).toMatch(/\.it\.removed \{[^}]*border-style: dashed;/);
  });
});
