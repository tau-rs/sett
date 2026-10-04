import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const settle = async (el: any) => {
  await el.updateComplete;
  await Promise.all(Array.from(el.querySelectorAll('*')).map((c: any) => c.updateComplete));
  await el.updateComplete;
};
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as any; await settle(el); return el; };
const heard = (el: Element, type: string) => { const got: any[] = []; el.addEventListener(type, (e: any) => got.push(e.detail ?? null)); return got; };

beforeAll(() => customElements.whenDefined('sett-inspector'));

describe('inspector', () => {
  it('uses tokens only and never animates', () => {
    const c = cssOf('sett-inspector');
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(c).not.toMatch(/\d+px/);
    expect(c).not.toMatch(/animation|transition|opacity/);
  });
  it('header: heading bold, sub secondary, state at the right in its tone', async () => {
    const el = await mount('<sett-inspector heading="refund flow" sub="claude code · w1 · 14 min" state="running"></sett-inspector>');
    const hd = el.shadowRoot.querySelector('[part="header"]');
    expect(hd.querySelector('b').textContent).toBe('refund flow');
    expect(hd.querySelector('.sub').textContent).toBe('claude code · w1 · 14 min');
    expect(hd.querySelector('.st').textContent).toBe('running');
    el.tone = 'bad'; el.state = 'new'; await settle(el);
    expect(el.getAttribute('tone')).toBe('bad');
    expect(hd.querySelector('.st').textContent).toBe('new');
    const c = cssOf('sett-inspector');
    expect(c).toMatch(/:host\(\[tone='bad'\]\) \.st \{ color: var\(--sett-color-bad\)/);
    expect(c).toMatch(/:host\(\[tone='sug'\]\) \.st \{ color: var\(--sett-color-sug\)/);
    expect(c).toMatch(/:host\(\[tone='ok'\]\) \.st \{ color: var\(--sett-color-ok\)/);
    const bare = await mount('<sett-inspector heading="ask"></sett-inspector>');
    expect(bare.shadowRoot.querySelector('.sub')).toBeNull();
    expect(bare.shadowRoot.querySelector('.st')).toBeNull();
  });
  it('the top border is the session colour, or the thread kind\'s', () => {
    const c = cssOf('sett-inspector');
    expect(c).toMatch(/:host\(\[session\]\) \{ border-top-color: var\(--_session\)/);
    expect(c).toMatch(/:host\(\[kind='session'\]\) \{ border-top-color: var\(--_session\)/);
    expect(c).toMatch(/:host\(\[kind='planner'\]\) \{ border-top-color: var\(--sett-color-sug\)/);
    expect(c).toMatch(/:host\(\[kind='framer'\]\), :host\(\[kind='fixer'\]\) \{ border-top-color: var\(--sett-color-sel\)/);
    expect(c).toMatch(/border-top: var\(--sett-stroke-frame\) solid transparent/);
  });
  it('only slotted verbs render: the bar is absent without them, holds exactly them with', async () => {
    const bare = await mount('<sett-inspector heading="x"><p>body</p></sett-inspector>');
    expect(bare.shadowRoot.querySelector('[part="verbs"]')).toBeNull();
    const el = await mount('<sett-inspector heading="x"><p>body</p><sett-button slot="verbs">pause</sett-button><sett-button slot="verbs" variant="quiet">stop</sett-button><span slot="note">verbs are words</span></sett-inspector>');
    const bar = el.shadowRoot.querySelector('[part="verbs"]');
    expect(bar).not.toBeNull();
    const assigned = bar.querySelector('slot[name="verbs"]').assignedElements().map((b: any) => b.textContent);
    expect(assigned).toEqual(['pause', 'stop']);
    expect(bar.querySelectorAll('button').length).toBe(0);
    expect(bar.querySelector('.n slot[name="note"]').assignedElements()[0].textContent).toBe('verbs are words');
    el.querySelectorAll('[slot="verbs"]').forEach((b: Element) => b.remove());
    await new Promise((r) => setTimeout(r, 0)); await settle(el);
    expect(el.shadowRoot.querySelector('[part="verbs"]')).toBeNull();
  });
  it('the composer row is absent when not slotted', async () => {
    const bare = await mount('<sett-inspector heading="x"><p>body</p></sett-inspector>');
    expect(bare.shadowRoot.querySelector('.comp')).toBeNull();
    const el = await mount('<sett-inspector heading="x"><p>body</p><sett-composer slot="composer" placeholder="reply…"></sett-composer></sett-inspector>');
    expect(el.shadowRoot.querySelector('.comp slot[name="composer"]').assignedElements().length).toBe(1);
  });
  it('folded shows the handle with the title and fires sett-unfold; the body and header are gone', async () => {
    const el = await mount('<sett-inspector heading="refund flow" folded><p>body</p><sett-button slot="verbs">pause</sett-button></sett-inspector>');
    const handle = el.shadowRoot.querySelector('.handle');
    expect(handle).not.toBeNull();
    expect(handle.getAttribute('title')).toBe('refund flow');
    expect(handle.textContent.trim()).toBe('›');
    expect(el.shadowRoot.querySelector('[part="header"]')).toBeNull();
    expect(el.shadowRoot.querySelector('[part="body"]')).toBeNull();
    expect(el.shadowRoot.querySelector('[part="verbs"]')).toBeNull();
    const got = heard(el, 'sett-unfold');
    handle.click();
    expect(got.length).toBe(1);
    expect(el.folded).toBe(true);
    expect(cssOf('sett-inspector')).toMatch(/:host\(\[folded\]\) \{[^}]*width: var\(--sett-size-shell-handle\)/);
  });
  it('the open header ends with the fold control: ›, labelled, after the state', async () => {
    const el = await mount('<sett-inspector heading="refund flow" sub="claude code · w1" state="running"><p>body</p></sett-inspector>');
    const hd = el.shadowRoot.querySelector('[part="header"]');
    const fold = hd.querySelector('button.fold');
    expect(fold).not.toBeNull();
    expect(fold.getAttribute('type')).toBe('button');
    expect(fold.textContent.trim()).toBe('›');
    expect(fold.getAttribute('aria-label')).toBe('fold · refund flow');
    expect(hd.lastElementChild).toBe(fold);
    expect(fold.previousElementSibling.className).toBe('st');
    const bare = await mount('<sett-inspector heading="ask"></sett-inspector>');
    expect(bare.shadowRoot.querySelector('[part="header"] button.fold')).not.toBeNull();
    const c = cssOf('sett-inspector');
    expect(c).toMatch(/\.fold \{[^}]*margin-left: auto;[^}]*color: var\(--sett-color-mute\)/);
    expect(c).toMatch(/\.st ~ \.fold \{ margin-left: calc\(-1 \* var\(--sett-space-1\)\)/);
    expect(c).toMatch(/\.fold:hover \{ color: var\(--sett-color-ink\)/);
    expect(c).toMatch(/\.fold:focus-visible[^{]*\{ outline: var\(--sett-stroke-lit\) solid var\(--sett-color-sel\)/);
  });
  it('the fold control fires sett-fold and never folds the pane itself; the app sets folded', async () => {
    const el = await mount('<sett-inspector heading="refund flow"><p>body</p></sett-inspector>');
    const events: Event[] = [];
    document.addEventListener('sett-fold', (e) => events.push(e), { once: true });
    el.shadowRoot.querySelector('button.fold').click();
    expect(events.length).toBe(1);
    expect(events[0].bubbles).toBe(true);
    expect(events[0].composed).toBe(true);
    await settle(el);
    expect(el.folded).toBe(false);
    expect(el.hasAttribute('folded')).toBe(false);
    expect(el.shadowRoot.querySelector('[part="header"]')).not.toBeNull();
    el.folded = true; await settle(el);
    expect(el.shadowRoot.querySelector('button.fold')).toBeNull();
    expect(el.shadowRoot.querySelector('.handle')).not.toBeNull();
  });
  it('the body scrolls and the verbs bar is fixed under it', () => {
    const c = cssOf('sett-inspector');
    expect(c).toMatch(/\.body \{[^}]*flex: 1;[^}]*overflow: auto/);
    expect(c).toMatch(/\.verbs \{[^}]*flex: none/);
  });
});
