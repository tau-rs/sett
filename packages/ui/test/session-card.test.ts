import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import { GATE_WORDS, gateOf } from '../src/index.js';

const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).map((s: any) => s.cssText).join('\n');
const tick = () => new Promise((r) => setTimeout(r, 0));
const mount = async (markup: string) => {
  document.body.innerHTML = markup;
  const el = document.body.firstElementChild as any;
  await el.updateComplete; await tick(); await el.updateComplete;
  return el;
};
beforeAll(() => Promise.all(['sett-session-card', 'sett-plan-row', 'sett-sub-agent'].map((t) => customElements.whenDefined(t))));

describe('session card', () => {
  it('uses tokens only; only the dot pulse animates', () => {
    for (const t of ['sett-session-card', 'sett-plan-row', 'sett-sub-agent']) {
      const c = cssOf(t);
      expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(c).not.toMatch(/\d+px/);
      expect(c).not.toMatch(/\d+m?s\b/);
      expect((c.match(/@keyframes/g) ?? []).length).toBeLessThanOrEqual(1);
    }
    expect(cssOf('sett-session-card')).toContain('sett-dot-pulse var(--sett-motion-frame-pulse)');
  });
  it('right cell says only what the glyph cannot', async () => {
    const right = async (m: string) => (await mount(m)).shadowRoot.querySelector('.right')?.textContent ?? '';
    expect(await right('<sett-plan-row state="asks" count="2">x</sett-plan-row>')).toBe('asks · 2');
    expect(await right('<sett-plan-row state="paused">x</sett-plan-row>')).toBe('paused');
    expect(await right('<sett-plan-row state="deviation">x</sett-plan-row>')).toBe('deviation');
    expect(await right('<sett-plan-row state="resolve">x</sett-plan-row>')).toBe('resolve');
    expect(await right('<sett-plan-row state="taken-over" who="you">x</sett-plan-row>')).toBe('you');
    expect(await right('<sett-plan-row state="done">x</sett-plan-row>')).toBe('');
    expect(await right('<sett-plan-row state="running">x</sett-plan-row>')).toBe('');
  });
  it('glyphs come from the tokens', async () => {
    const g = async (s: string) => (await mount(`<sett-plan-row state="${s}">x</sett-plan-row>`)).shadowRoot.querySelector('.g').textContent;
    expect(await g('done')).toBe('✓'); expect(await g('running')).toBe('●'); expect(await g('taken-over')).toBe('✋'); expect(await g('deviation')).toBe('≠'); expect(await g('asks')).toBe('!'); expect(await g('resolve')).toBe('⇄');
  });
  it('taken over is ✋ in sel with you on the right; stepped-in, the old name, draws the same for one release', async () => {
    const now = await mount('<sett-plan-row state="taken-over" who="you">x</sett-plan-row>');
    const old = await mount('<sett-plan-row state="stepped-in" who="you">x</sett-plan-row>');
    for (const el of [now, old]) {
      const g = el.shadowRoot.querySelector('.g');
      expect(g.textContent).toBe('✋'); expect(g.getAttribute('data-state')).toBe('taken-over');
      expect(el.shadowRoot.querySelector('.right').textContent).toBe('you');
    }
    const c = cssOf('sett-plan-row');
    expect(c).toContain(".g[data-state='taken-over'] { color: var(--sett-color-sel); }");
    expect(c).not.toContain('stepped-in');
  });
  it('a group row reads its gate on the right, in rule 7 words, and its glyph says the same', async () => {
    const row = async (gate: string) => { const el = await mount(`<sett-plan-row kind="group" gate="${gate}">group 1</sett-plan-row>`); return { right: el.shadowRoot.querySelector('.right')?.textContent, g: el.shadowRoot.querySelector('.g') }; };
    expect(GATE_WORDS).toEqual(['done', 'running', 'gate', 'failed n/m', 'waiting']);
    const done = await row('done'); expect(done.right).toBe('done'); expect(done.g.textContent).toBe('✓'); expect(done.g.getAttribute('data-gate')).toBe('done');
    const run = await row('running'); expect(run.right).toBe('running'); expect(run.g.textContent).toBe('●'); expect(run.g.getAttribute('data-gate')).toBe('running');
    const gate = await row('gate'); expect(gate.right).toBe('gate'); expect(gate.g.textContent).toBe('●'); expect(gate.g.getAttribute('data-gate')).toBe('gate');
    const failed = await row('failed 1/2'); expect(failed.right).toBe('failed 1/2'); expect(failed.g.textContent).toBe('!'); expect(failed.g.getAttribute('data-gate')).toBe('failed');
    const wait = await row('waiting'); expect(wait.right).toBe('waiting'); expect(wait.g.textContent).toBe('·'); expect(wait.g.getAttribute('data-gate')).toBe('waiting');
    expect((await row('')).right).toBe('waiting');
    expect(gateOf('failed 2/2')).toBe('failed'); expect(gateOf(undefined)).toBe('waiting'); expect(gateOf('judge')).toBe('waiting');
    const c = cssOf('sett-plan-row');
    expect(c).toContain(".g[data-gate='done'] { color: var(--sett-color-ok); }");
    expect(c).toContain(".g[data-gate='running'] { color: var(--_session); }");
    expect(c).toContain(".g[data-gate='gate'], .g[data-gate='waiting'] { color: var(--sett-color-sug); }");
    expect(c).toContain(".g[data-gate='failed'] { color: var(--sett-color-bad); }");
  });
  it('a group holds its elements and folds its sub-agents under itself, keeping the gate words beside the run', async () => {
    const el = await mount('<sett-plan-row kind="group" gate="running">group 2<sett-sub-agent slot="sub" state="done">a1</sett-sub-agent><sett-sub-agent slot="sub" state="running">a2</sett-sub-agent><sett-plan-row slot="element" state="running" current>PgRefundRepo</sett-plan-row><sett-plan-row slot="element">refund() in api</sett-plan-row></sett-plan-row>');
    const sum = el.shadowRoot.querySelector('.sum');
    expect(sum.textContent.replace(/\s+/g, ' ')).toContain('2 sub');
    expect(el.shadowRoot.querySelector('.right').textContent).toBe('running');
    expect(el.open).toBe(false);
    const elements = el.shadowRoot.querySelector('.elements slot');
    expect(elements.assignedElements().map((e: Element) => e.tagName.toLowerCase())).toEqual(['sett-plan-row', 'sett-plan-row']);
    // the sub-agents are the group's, not its elements'
    expect(el.querySelector('sett-plan-row[slot="element"]').shadowRoot.querySelector('.sum')).toBeNull();
    expect(cssOf('sett-plan-row')).toContain(":host([kind='group']) .elements { display: block; }");
  });
  it('the card carries its fixed bar only when a verbs bar or a composer is given', async () => {
    const bare = await mount('<sett-session-card name="Yokohama" driver="claude code" session="yk"><sett-plan-row state="done">x</sett-plan-row></sett-session-card>');
    expect(bare.shadowRoot.querySelector('.bar')).toBeNull();
    const withBar = await mount('<sett-session-card name="Yokohama" driver="claude code" session="yk"><sett-plan-row state="taken-over" who="you">x</sett-plan-row><sett-verbs slot="verbs" state="taken-over" subject="x" session="yk"></sett-verbs><sett-composer slot="composer" mode="handback"></sett-composer></sett-session-card>');
    const bar = withBar.shadowRoot.querySelector('.bar');
    expect(bar).not.toBeNull();
    expect(Array.from(bar.querySelectorAll('slot')).map((s: Element) => s.getAttribute('name'))).toEqual(['verbs', 'composer']);
    // rule 9: taken over leaves one verb, stop; hand back lives in the composer
    const verbs = withBar.querySelector('sett-verbs'); await verbs.updateComplete;
    expect(Array.from(verbs.shadowRoot.querySelectorAll('button')).map((b: Element) => b.textContent)).toEqual(['stop']);
    expect(withBar.querySelector('sett-composer').getAttribute('mode')).toBe('handback');
    expect(cssOf('sett-session-card')).toMatch(/\.bar \{ margin: var\(--sett-space-2\) calc\(-1 \* var\(--sett-space-2\)\) calc\(-1 \* var\(--sett-space-2\)\); \}/);
  });
  it('sub-agents fold by default with a count and glyph run; toggle opens', async () => {
    const el = await mount('<sett-plan-row state="running" current>PgRefundRepo<sett-sub-agent slot="sub" state="done">a</sett-sub-agent><sett-sub-agent slot="sub" state="running">b</sett-sub-agent><sett-sub-agent slot="sub">c</sett-sub-agent></sett-plan-row>');
    const sum = el.shadowRoot.querySelector('.sum');
    expect(sum).not.toBeNull();
    expect(sum.textContent.replace(/\s+/g, ' ')).toContain('3 sub');
    expect(sum.querySelectorAll('.mini span').length).toBe(3);
    expect(el.open).toBe(false);
    expect(el.shadowRoot.querySelector('.right')).toBeNull();
    let toggled = 0; el.addEventListener('sett-toggle', () => toggled++);
    sum.click(); await el.updateComplete;
    expect(el.open).toBe(true); expect(toggled).toBe(1);
    expect(cssOf('sett-plan-row')).toMatch(/\.subs \{[^}]*border-left: var\(--sett-stroke-hair\) solid var\(--_session-sub\)/);
  });
  it('header shows name, driver, n/m and pulses when running', async () => {
    const el = await mount('<sett-session-card name="Yokohama" driver="claude code" session="yk" step="3" of="6" running></sett-session-card>');
    const h = el.shadowRoot.querySelector('.h');
    expect(h.textContent).toContain('Yokohama'); expect(h.textContent).toContain('3/6');
    expect(h.querySelector('.dot').hasAttribute('data-pulse')).toBe(true);
  });
});
