import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import { FOLLOW } from '../src/thread/chat-end.js';

// happy-dom has no layout: the scroll boxes (.msgs, .body) get a content height H and a 300 high window
let H = 1000;
const box = (el: Element) => el.classList.contains('msgs') || el.classList.contains('body');
const stubs = { scrollHeight: (el: Element) => (box(el) ? H : 0), clientHeight: (el: Element) => (box(el) ? 300 : 0) };
const saved = Object.keys(stubs).map((k) => [k, Object.getOwnPropertyDescriptor(HTMLElement.prototype, k)] as const);
beforeAll(() => {
  for (const [k, f] of Object.entries(stubs)) Object.defineProperty(HTMLElement.prototype, k, { configurable: true, get() { return f(this); } });
});
afterAll(() => { for (const [k, d] of saved) d ? Object.defineProperty(HTMLElement.prototype, k, d) : delete (HTMLElement.prototype as any)[k]; });

const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const tick = () => new Promise((r) => setTimeout(r, 0));
const settle = async (el: any) => {
  await tick();
  await el.updateComplete;
  await Promise.all(Array.from(el.querySelectorAll('*')).map((c: any) => c.updateComplete));
  await el.updateComplete;
};
const mount = async (m: string) => { H = 1000; document.body.innerHTML = m; const el = document.body.firstElementChild as any; await settle(el); return el; };
const msg = (t: string) => Object.assign(document.createElement('sett-msg'), { textContent: t });
const scrollTo = (s: HTMLElement, top: number) => { s.scrollTop = top; s.dispatchEvent(new Event('scroll')); };
const latestIn = (root: ShadowRoot) => Array.from(root.querySelectorAll('button, sett-button')).find((b) => /new · latest/.test(b.textContent!)) as HTMLElement | undefined;

const thread = `<sett-thread><sett-msg from="me" author="you">one</sett-msg><sett-msg from="agent" author="Yokohama">two</sett-msg>
  <sett-verbs slot="verbs" state="running" subject="PgRefundRepo"></sett-verbs><sett-composer slot="composer"></sett-composer></sett-thread>`;

describe('chat-end rule · thread (rule 13)', () => {
  it('the distance is the token', () => expect(FOLLOW).toBe(48));
  it('no scroll animation in the thread or the inspector', () => {
    for (const t of ['sett-thread', 'sett-verbs', 'sett-inspector']) expect(cssOf(t), t).not.toMatch(/scroll-behavior/);
  });
  it('the messages area is a log', async () => {
    const el = await mount(thread);
    const s = el.shadowRoot.querySelector('.msgs');
    expect(s.getAttribute('role')).toBe('log');
    expect(s.getAttribute('aria-relevant')).toBe('additions');
  });
  it('opens at its end', async () => {
    const el = await mount(thread);
    expect(el.shadowRoot.querySelector('.msgs').scrollTop).toBe(1000);
  });
  it('at the end, a new message is followed', async () => {
    const el = await mount(thread);
    H = 1200;
    el.append(msg('three'));
    await settle(el);
    expect(el.shadowRoot.querySelector('.msgs').scrollTop).toBe(1200);
  });
  it('within the distance still counts as the end', async () => {
    const el = await mount(thread);
    const s = el.shadowRoot.querySelector('.msgs');
    scrollTo(s, 1000 - 300 - FOLLOW);
    H = 1200;
    el.append(msg('three'));
    await settle(el);
    expect(s.scrollTop).toBe(1200);
  });
  it('content growing under a pane at its end is no scroll up: it keeps following', async () => {
    const el = await mount(thread);
    const s = el.shadowRoot.querySelector('.msgs');
    H = 1600;
    s.dispatchEvent(new Event('scroll'));
    expect(s.scrollTop).toBe(1600);
    el.append(msg('three'));
    await settle(el);
    expect(s.scrollTop).toBe(1600);
  });
  it('scrolled up, it stays put and the bar says how many arrived', async () => {
    const el = await mount(thread);
    const s = el.shadowRoot.querySelector('.msgs');
    scrollTo(s, 0);
    H = 1400;
    el.append(msg('three'), msg('four'));
    await settle(el);
    expect(s.scrollTop).toBe(0);
    const verbs = el.querySelector('sett-verbs');
    await verbs.updateComplete;
    const b = latestIn(verbs.shadowRoot)!;
    expect(b.textContent!.trim()).toBe('2 new · latest');
    expect(verbs.shadowRoot.querySelector('.ac').firstElementChild).toBe(b);
  });
  it('the verb is blue, like a link, in the thread and the inspector', () => {
    expect(cssOf('sett-verbs')).toMatch(/button\.latest \{[^}]*color: var\(--sett-color-sel\)/);
    expect(cssOf('sett-inspector')).toMatch(/\.latest::part\(button\) \{[^}]*color: var\(--sett-color-sel\)/);
  });
  it('latest jumps to the end and the verb goes', async () => {
    const el = await mount(thread);
    const s = el.shadowRoot.querySelector('.msgs');
    scrollTo(s, 0);
    el.append(msg('three'));
    await settle(el);
    const verbs = el.querySelector('sett-verbs');
    latestIn(verbs.shadowRoot)!.click();
    await settle(el);
    expect(s.scrollTop).toBe(H);
    expect(latestIn(verbs.shadowRoot)).toBeUndefined();
  });
  it('scrolling back to the end clears the count', async () => {
    const el = await mount(thread);
    const s = el.shadowRoot.querySelector('.msgs');
    scrollTo(s, 0);
    el.append(msg('three'));
    await settle(el);
    scrollTo(s, H - 300);
    await settle(el);
    expect(latestIn(el.querySelector('sett-verbs').shadowRoot)).toBeUndefined();
  });
  it('your own send brings you to the end; an empty one does not', async () => {
    const el = await mount(thread);
    const s = el.shadowRoot.querySelector('.msgs');
    const send = (text: string) => el.querySelector('sett-composer').dispatchEvent(new CustomEvent('sett-send', { bubbles: true, composed: true, detail: { text, mode: 'send' } }));
    scrollTo(s, 0);
    send('  ');
    expect(s.scrollTop).toBe(0);
    send('keep the retry policy out of the repo');
    expect(s.scrollTop).toBe(1000);
  });
});

describe('chat-end rule · inspector (rule 13)', () => {
  const question = `<sett-inspector heading="refund flow"><sett-msg from="agent" author="w1">one</sett-msg><sett-question author="refund flow">fails?</sett-question>
    <sett-button slot="verbs">pause</sett-button></sett-inspector>`;
  it('holding a conversation, it opens at its end and its body is a log', async () => {
    const el = await mount(question);
    const b = el.shadowRoot.querySelector('.body');
    expect(b.scrollTop).toBe(1000);
    expect(b.getAttribute('role')).toBe('log');
  });
  it('holding a form, it opens at the top and is no log', async () => {
    const el = await mount('<sett-inspector heading="commit"><sett-commit-form></sett-commit-form></sett-inspector>');
    const b = el.shadowRoot.querySelector('.body');
    expect(b.scrollTop).toBe(0);
    expect(b.hasAttribute('role')).toBe(false);
  });
  it('scrolled up, the verbs row says how many arrived, even with nothing in verbs', async () => {
    const el = await mount('<sett-inspector heading="w1"><sett-msg from="agent" author="w1">one</sett-msg></sett-inspector>');
    const b = el.shadowRoot.querySelector('.body');
    expect(el.shadowRoot.querySelector('.verbs')).toBeNull();
    scrollTo(b, 0);
    el.append(msg('two'), msg('three'));
    await settle(el);
    const latest = latestIn(el.shadowRoot)!;
    expect(latest.closest('.verbs')).not.toBeNull();
    expect(latest.textContent!.trim()).toBe('2 new · latest');
    latest.click();
    await settle(el);
    expect(b.scrollTop).toBe(H);
    expect(el.shadowRoot.querySelector('.verbs')).toBeNull();
  });
  it('unfolded, it opens at its end again', async () => {
    const el = await mount(question);
    el.folded = true;
    await settle(el);
    el.folded = false;
    H = 1300;
    await settle(el);
    expect(el.shadowRoot.querySelector('.body').scrollTop).toBe(1300);
  });
});
