import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import { PORT_KINDS } from '../src/index.js';

const mount = async (markup: string) => {
  document.body.innerHTML = markup;
  const el = document.body.firstElementChild as HTMLElement & { updateComplete: Promise<boolean> };
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
};
const cssOf = (tag: string) => { const s = (customElements.get(tag) as any).styles; return (Array.isArray(s) ? s : [s]).map((x: any) => x.cssText).join('\n'); };

beforeAll(() => customElements.whenDefined('sett-port-row'));

describe('sett-port-row', () => {
  it('uses tokens only and never animates', () => {
    const css = cssOf('sett-port-row');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px/);
    expect(css).not.toMatch(/animation|transition/);
  });
  it('every kind maps its dot to the kind colour token', () => {
    const css = cssOf('sett-port-row');
    for (const k of PORT_KINDS) expect(css).toContain(`:host([kind='${k}']) { --_kind: var(--sett-map-kind-${k}-color); }`);
  });
  it('renders kind · name · count and the dot part', async () => {
    const el = await mount('<sett-port-row kind="sql" name="postgres" count="6 tables" side="needs"></sett-port-row>');
    const sr = el.shadowRoot!;
    expect(sr.querySelector('.k')!.textContent).toBe('sql');
    expect(sr.querySelector('.nm')!.textContent).toBe('postgres');
    expect(sr.querySelector('.ct')!.textContent).toBe('6 tables');
    expect(sr.querySelector('[part="dot"]')).not.toBeNull();
    expect(el.getAttribute('side')).toBe('needs');
  });
  it('folds op rows past `fold` behind a more row, and expands', async () => {
    const ops = Array.from({ length: 8 }, (_, i) => `<sett-op-row kind="text">op ${i}</sett-op-row>`).join('');
    const el = await mount(`<sett-port-row kind="http" name="routes" count="12" fold="6">${ops}</sett-port-row>`) as any;
    const hidden = () => Array.from(el.querySelectorAll('sett-op-row')).filter((o: any) => o.hasAttribute('hidden')).length;
    expect(hidden()).toBe(2);
    const more = el.shadowRoot!.querySelector('sett-op-row[kind="more"]');
    expect(more).not.toBeNull();
    expect(more!.count).toBe(2);
    more!.dispatchEvent(new CustomEvent('sett-expand', { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.expanded).toBe(true);
    expect(hidden()).toBe(0);
    expect(el.shadowRoot!.querySelector('sett-op-row[kind="more"]')).toBeNull();
  });
  it('fires sett-select with kind, name and side', async () => {
    const el = await mount('<sett-port-row kind="rpc" name="postmark" side="needs"></sett-port-row>');
    let detail: any;
    el.addEventListener('sett-select', (e: Event) => { detail = (e as CustomEvent).detail; });
    (el.shadowRoot!.querySelector('.row') as HTMLElement).click();
    expect(detail).toEqual({ kind: 'rpc', name: 'postmark', side: 'needs' });
  });
});
