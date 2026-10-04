import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const mount = async (m: string) => {
  document.body.innerHTML = m;
  const el = document.body.firstElementChild as any;
  await el.updateComplete;
  return el;
};
const BAR = `<sett-bar shortcut="⌘K">
  <span slot="brand">arch</span><span slot="repo">orderly</span>
  <sett-selector scope="main"></sett-selector>
  <sett-chip slot="chips" kind="plan">refund flow<a slot="verb">open</a></sett-chip>
</sett-bar>`;

beforeAll(() => customElements.whenDefined('sett-bar'));
afterEach(() => { document.body.innerHTML = ''; });

describe('sett-bar', () => {
  it('uses tokens only and never animates', () => {
    expect(cssOf('sett-bar')).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\d+px|animation|transition/);
  });
  it('is the shell bar\'s height, on paper, one line', () => {
    const css = cssOf('sett-bar');
    expect(css).toMatch(/height:\s*var\(--sett-size-shell-bar\)/);
    expect(css).toMatch(/background:\s*var\(--sett-color-paper\)/);
    expect(css).toMatch(/white-space:\s*nowrap/);
  });
  it('lets only the chips give way: they scroll sideways, and the bar never clips the selector\'s menu', () => {
    const css = cssOf('sett-bar');
    expect(css).toMatch(/\.chips\s*\{[^}]*overflow-x:\s*auto/);
    expect(css).not.toMatch(/:host\s*\{[^}]*overflow/);
  });
  it('places brand, repo ›, the selector, then the chips and Ask at the right end', async () => {
    const el = await mount(BAR);
    const r = el.shadowRoot;
    expect(r.querySelector('.repo').hidden).toBe(false);
    expect(r.querySelector('.repo [aria-hidden]').textContent).toBe('›');
    expect(r.querySelector('.end .chips slot[name="chips"]')).not.toBeNull();
    expect(r.querySelector('.end slot[name="ask"]')).not.toBeNull();
    expect(el.getAttribute('role')).toBe('group');
    expect(el.getAttribute('aria-label')).toBe('bar');
  });
  it('writes no › without a repo', async () => {
    const el = await mount(`<sett-bar><span slot="brand">arch</span><sett-selector scope="main"></sett-selector></sett-bar>`);
    expect(el.shadowRoot.querySelector('.repo').hidden).toBe(true);
  });
  it('shows its own Ask entry with the shortcut, and fires sett-ask when chosen', async () => {
    const el = await mount(BAR);
    const ask = el.shadowRoot.querySelector('button.ask');
    expect(ask.getAttribute('part')).toBe('ask');
    expect(ask.textContent.replace(/\s+/g, ' ').trim()).toBe('Ask ⌘K');
    let fired = 0;
    document.addEventListener('sett-ask', () => fired++, { once: true });
    ask.click();
    expect(fired).toBe(1);
  });
  it('makes the chips\' strip a tab stop only while it scrolls, so the keyboard can reach what is hidden', async () => {
    const el = await mount(BAR);
    const chips = el.shadowRoot.querySelector('.chips');
    expect(chips.hasAttribute('tabindex')).toBe(false);
    Object.defineProperty(chips, 'scrollWidth', { value: 400, configurable: true });
    Object.defineProperty(chips, 'clientWidth', { value: 120, configurable: true });
    (el as any).measure(); await el.updateComplete;
    expect(chips.getAttribute('tabindex')).toBe('0');
    expect(chips.getAttribute('role')).toBe('group');
    expect(chips.getAttribute('aria-label')).toBe('chips');
  });
  it('gives way to the host\'s own entry in the ask slot', async () => {
    const el = await mount(`<sett-bar><a slot="ask" href="#ask">Ask the repo</a></sett-bar>`);
    const slot = el.shadowRoot.querySelector('slot[name="ask"]') as HTMLSlotElement;
    expect(slot.assignedElements().map((e) => e.textContent)).toEqual(['Ask the repo']);
  });
});
