import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import { PORT_KINDS } from '../src/index.js';
import zero2prod from '../src/map/fixtures/zero2prod.json';
import zed from '../src/map/fixtures/zed.json';

type El = HTMLElement & { updateComplete: Promise<boolean>; [k: string]: any };
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const mount = async (props: Record<string, unknown>) => {
  const el = document.createElement('sett-contract-card') as El;
  Object.assign(el, props);
  document.body.replaceChildren(el); await el.updateComplete;
  return el;
};
const text = (el: El, sel: string) => Array.from(el.shadowRoot!.querySelectorAll(sel)).map((n) => n.textContent!.trim());
const contract = (c: any) => ({ kind: c.kind, name: c.name, owner: c.owner, format: c.format, witness: c.witness ?? undefined, ops: c.ops ?? [], schema: c.schema, used: c.used ?? [], notes: c.notes });

beforeAll(() => customElements.whenDefined('sett-contract-card'));

describe('sett-contract-card', () => {
  it('uses tokens only and never animates', () => {
    const css = cssOf('sett-contract-card');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px/);
    expect(css).not.toMatch(/animation|transition|opacity/);
  });
  it('the chip takes its dot colour from the kind table, one rule per port kind', () => {
    const css = cssOf('sett-contract-card');
    for (const k of PORT_KINDS) expect(css, k).toContain(`:host([kind='${k}']) { --_kind: var(--sett-map-kind-${k}-color); }`);
  });
  it('the ops block is mono on the well tint, in ink: no accent text on well', () => {
    const css = cssOf('sett-contract-card');
    const ops = css.match(/\.ops, \.schema \{[^}]*\}/)![0];
    expect(ops).toContain('background: var(--sett-color-well)');
    expect(ops).toContain('color: var(--sett-color-ink)');
    expect(ops).toContain('font-family: var(--sett-font-mono)');
  });
  it('draws a fixture contract: chip, name, owner, format · witness, ops, schema, used by, notes', async () => {
    const c = (zero2prod as any).contracts['z2p.queue'];
    const el = await mount(contract(c));
    expect(text(el, '.chip')).toEqual(['sql']);
    expect(text(el, '.name')).toEqual([c.name]);
    expect(text(el, 'sett-tag')).toEqual(c.witness.split(' · '));
    expect(el.shadowRoot!.querySelector('sett-tag')!.hasAttribute('mono')).toBe(true);
    expect(text(el, 'h6')).toEqual(['ops', 'schema', 'used by', 'notes']);
    expect(text(el, '.ops div')).toEqual(c.ops);
    expect(text(el, '.schema')).toEqual([c.schema]);
    expect(text(el, '.use .who')).toEqual(c.used.map((u: string[]) => u[0]));
    expect(el.getAttribute('role')).toBe('group');
    expect(el.getAttribute('aria-label')).toBe(`contract · ${c.name}`);
    expect(el.hasAttribute('declared')).toBe(false);
  });
  it('a part with nothing to say is absent', async () => {
    const el = await mount(contract((zed as any).contracts['collab.api']));
    expect(text(el, 'h6')).toEqual(['ops']);
    expect(el.shadowRoot!.querySelector('.schema, .use, .notes')).toBeNull();
  });
  it('no witness means declared: dashed, and it says so', async () => {
    const el = await mount(contract((zed as any).contracts['zed.site']));
    expect(el.hasAttribute('declared')).toBe(true);
    expect(el.shadowRoot!.querySelector('sett-tag')).toBeNull();
    expect(text(el, '.line').at(-1)).toMatch(/no witness$/);
    expect((await mount({ kind: 'http', name: 'x' })).shadowRoot!.textContent).toContain('declared · no witness');
    expect(cssOf('sett-contract-card')).toContain(':host([declared]) { border-style: dashed; }');
    const witnessed = await mount({ kind: 'http', name: 'x', witness: 'a.rs:1' });
    expect(witnessed.hasAttribute('declared')).toBe(false);
  });
});
