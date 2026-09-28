import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const mount = async (markup: string) => {
  document.body.innerHTML = markup;
  const el = document.body.firstElementChild as HTMLElement & { updateComplete: Promise<boolean> };
  await el.updateComplete;
  return el;
};
const slotOrder = (el: HTMLElement) => Array.from(el.shadowRoot!.querySelectorAll('.verbs slot')).map((s) => s.getAttribute('name'));

beforeAll(() => customElements.whenDefined('sett-chip'));

describe('sett-chip', () => {
  it('uses tokens only and never animates', () => {
    const cssText = (customElements.get('sett-chip') as any).styles.map((s: any) => s.cssText).join('\n');
    expect(cssText).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(cssText).not.toMatch(/\d+px/);
    expect(cssText).not.toMatch(/animation/);
  });
  it('agent door first by default, manual first with me-first', async () => {
    const a = await mount('<sett-chip kind="git">behind main<a slot="agent">with Yokohama</a><a slot="manual">update myself</a></sett-chip>');
    expect(slotOrder(a)).toEqual(['agent', 'manual', 'verb']);
    expect(a.shadowRoot!.querySelector('.primary slot')!.getAttribute('name')).toBe('agent');
    const b = await mount('<sett-chip kind="git" me-first>behind main<a slot="agent">with Yokohama</a><a slot="manual">update myself</a></sett-chip>');
    expect(slotOrder(b)).toEqual(['manual', 'agent', 'verb']);
    expect(b.shadowRoot!.querySelector('.primary slot')!.getAttribute('name')).toBe('manual');
  });
  it('maps kind and state to the label', async () => {
    const tag = async (m: string) => (await mount(m)).shadowRoot!.querySelector('sett-tag')!;
    expect((await tag('<sett-chip kind="finding">x</sett-chip>')).getAttribute('kind')).toBe('bad');
    expect((await tag('<sett-chip kind="pipeline">x</sett-chip>')).getAttribute('kind')).toBe('ok');
    expect((await tag('<sett-chip kind="tree" state="blocking">x</sett-chip>')).getAttribute('kind')).toBe('bad');
    const done = await tag('<sett-chip kind="git" state="done">x</sett-chip>');
    expect(done.getAttribute('kind')).toBe('ok');
    expect(done.textContent).toContain('✓');
  });
  it('done adds a dismiss verb that fires sett-dismiss', async () => {
    const el = await mount('<sett-chip kind="git" state="done">updated</sett-chip>');
    let fired = false;
    el.addEventListener('sett-dismiss', () => (fired = true));
    const a = Array.from(el.shadowRoot!.querySelectorAll('a')).find((x) => x.textContent === 'dismiss')!;
    a.click();
    expect(fired).toBe(true);
    const normal = await mount('<sett-chip kind="git">x</sett-chip>');
    expect(Array.from(normal.shadowRoot!.querySelectorAll('a')).length).toBe(0);
  });
});
