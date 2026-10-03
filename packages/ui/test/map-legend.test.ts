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
});
