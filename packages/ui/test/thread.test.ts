import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';

const TAGS = ['sett-thread', 'sett-msg', 'sett-tool', 'sett-changed', 'sett-option', 'sett-question', 'sett-deviation', 'sett-verbs', 'sett-composer'];
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).map((s: any) => s.cssText).join('\n');
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as any; await el.updateComplete; return el; };
beforeAll(() => Promise.all(TAGS.map((t) => customElements.whenDefined(t))));

describe('thread family', () => {
  it('uses tokens only; only the verbs dot animates', () => {
    for (const t of TAGS) {
      const c = cssOf(t);
      expect(c, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(c, t).not.toMatch(/\d+px/);
      expect(c, t).not.toMatch(/\d+m?s\b/);
      expect((c.match(/@keyframes/g) ?? []).length, t).toBe(t === 'sett-verbs' ? 1 : 0);
    }
  });
  it('messages carry an author line and mine sit on the right', async () => {
    const me = await mount('<sett-msg from="me" author="you" time="14:02">x</sett-msg>');
    expect(me.shadowRoot.querySelector('.who').textContent).toContain('you');
    expect(me.shadowRoot.querySelector('.who .t').textContent).toBe('14:02');
    expect(cssOf('sett-msg')).toMatch(/\[from='me'\]\) \{ align-self: flex-end/);
  });
  it('verbs follow the take-over states', async () => {
    const words = async (s: string) => Array.from((await mount(`<sett-verbs state="${s}" subject="x"></sett-verbs>`)).shadowRoot.querySelectorAll('button')).map((b: any) => b.textContent);
    expect(await words('running')).toEqual(['pause', 'stop']);
    expect(await words('paused')).toEqual(['resume', 'take over', 'stop']);
    expect(await words('taken-over')).toEqual(['stop']);
    const el = await mount('<sett-verbs state="paused" subject="x"></sett-verbs>');
    let got = ''; el.addEventListener('sett-verb', (e: any) => (got = e.detail.verb));
    el.shadowRoot.querySelectorAll('button')[1].click();
    expect(got).toBe('take over');
    expect((await mount('<sett-verbs state="running" subject="x"></sett-verbs>')).shadowRoot.querySelector('.dot').hasAttribute('data-pulse')).toBe(true);
  });
  it('composer switches to the hand-back note', async () => {
    const send = await mount('<sett-composer placeholder="p"></sett-composer>');
    expect(send.shadowRoot.querySelector('input')).not.toBeNull();
    expect(send.shadowRoot.querySelector('button').textContent).toBe('send');
    const hb = await mount('<sett-composer mode="handback"></sett-composer>');
    expect(hb.shadowRoot.querySelector('textarea')).not.toBeNull();
    expect(hb.shadowRoot.querySelector('button').textContent).toBe('hand back');
    let detail: any; hb.addEventListener('sett-send', (e: any) => (detail = e.detail));
    expect(hb.shadowRoot.querySelector('button').disabled).toBe(true);
    const ta = hb.shadowRoot.querySelector('textarea');
    ta.value = 'moved the tx'; ta.dispatchEvent(new Event('input')); await hb.updateComplete;
    expect(hb.shadowRoot.querySelector('button').disabled).toBe(false);
    hb.shadowRoot.querySelector('button').click();
    expect(detail).toEqual({ text: 'moved the tx', mode: 'handback' });
  });
  it('question options and later fire events', async () => {
    const q = await mount('<sett-question author="Y" count="2">q<sett-option slot="option" value="allow" effect="+1">allow</sett-option></sett-question>');
    let v = ''; q.addEventListener('sett-choose', (e: any) => (v = e.detail.value));
    q.querySelector('sett-option').shadowRoot.querySelector('button').click();
    expect(v).toBe('allow');
    let later = false; q.addEventListener('sett-later', () => (later = true));
    q.shadowRoot.querySelector('.later').click();
    expect(later).toBe(true);
    expect(q.shadowRoot.querySelector('b').textContent).toBe('Y asks · 2');
  });
  it('thread identity sets the top border colour', () => {
    const c = cssOf('sett-thread');
    expect(c).toMatch(/\[identity='planner'\]\) \{ border-top-color: var\(--sett-color-sug\)/);
    expect(c).toMatch(/\[identity='fixer'\]\) \{ border-top-color: var\(--sett-color-sel\)/);
  });
});
