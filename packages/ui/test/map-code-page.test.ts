import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import '../src/index.js';
import zero2prod from '../src/map/fixtures/zero2prod.json';
import ripgrep from '../src/map/fixtures/ripgrep.json';

type El = HTMLElement & { updateComplete: Promise<boolean>; [k: string]: any };
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const mount = async (c: any, inner = '') => {
  const el = document.createElement('sett-code-page') as El;
  Object.assign(el, { file: c.file, line: c.line, unit: c.unit, lines: c.lines, callers: c.callers, calls: c.calls });
  el.innerHTML = inner;
  document.body.replaceChildren(el); await el.updateComplete;
  return el;
};
const all = (el: El, sel: string) => Array.from(el.shadowRoot!.querySelectorAll(sel)) as HTMLElement[];
const code = (id: string, f: any = zero2prod) => f.code[id];

beforeAll(() => customElements.whenDefined('sett-code-page'));

describe('sett-code-page', () => {
  it('uses tokens only; pointing eases a portal\'s border with motion.hover and has a still twin', () => {
    const css = cssOf('sett-code-page');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px/);
    expect(css).not.toMatch(/animation|opacity/);
    expect(css.match(/transition:[^;]+;/g)).toEqual(['transition: border-color var(--sett-motion-hover) ease;', 'transition: none;']);
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{ button \{ transition: none; \} \}/);
  });
  it('the head says file:line and the unit', async () => {
    const el = await mount(code('subscribe'));
    expect(all(el, '.file')[0].textContent).toBe('src/routes/subscriptions.rs:61');
    expect(all(el, '.unit')[0].textContent).toBe('api');
    expect(el.getAttribute('role')).toBe('group');
    expect(el.getAttribute('aria-label')).toBe('code · src/routes/subscriptions.rs:61');
  });
  it('lists the lines with their numbers; hl is the line tint, bad is the bad tint with ⚠ in the gutter', async () => {
    const c = code('publish_pub'); const el = await mount(c);
    expect(all(el, '.ln .n').map((n) => Number(n.textContent))).toEqual(c.lines.map((l: any[]) => l[0]));
    expect(all(el, '.ln .t').map((n) => n.textContent)).toEqual(c.lines.map((l: any[]) => l[1]));
    expect(all(el, '.ln').map((n) => (n.classList.contains('bad') ? 'bad' : n.classList.contains('hl') ? 'hl' : ''))).toEqual(c.lines.map((l: any[]) => l[2] ?? ''));
    const css = cssOf('sett-code-page');
    expect(css).toContain('.ln.hl { background: var(--sett-editor-line); }');
    expect(css).toContain('.ln.bad { background: var(--sett-color-bad-bg); }');
    expect(css).toContain('.ln.bad .g::before { content: var(--sett-glyph-finding); }');
  });
  it('a portal is a button that fires sett-portal with the key and the side', async () => {
    const c = code('subscribe'); const el = await mount(c);
    const got: any[] = []; el.addEventListener('sett-portal', (e: any) => got.push(e.detail));
    const [callers, calls] = all(el, '.side');
    expect(callers.getAttribute('aria-label')).toBe('callers');
    expect(Array.from(calls.querySelectorAll('button')).map((b) => b.textContent)).toEqual(c.calls.map((p: string[]) => p[1]));
    callers.querySelector('button')!.click();
    calls.querySelectorAll('button')[1].click();
    expect(got).toEqual([{ key: 'runfn', side: 'callers' }, { key: 'storetok', side: 'calls' }]);
  });
  it('a side with nothing says none', async () => {
    const el = await mount(code('main', ripgrep));
    const [callers] = all(el, '.side');
    expect(callers.querySelector('button')).toBeNull();
    expect(callers.querySelector('.none')!.textContent).toBe('none');
  });
  it('is not an editor: the listing is the fallback of the default slot, which the host\'s editor replaces', async () => {
    const el = await mount(code('subscribe'), '<div id="theia"></div>');
    const slot = el.shadowRoot!.querySelector('.body slot') as HTMLSlotElement;
    expect(slot.querySelector('.code')).not.toBeNull();
    expect(slot.assignedElements().map((e) => e.id)).toEqual(['theia']);
    expect(el.shadowRoot!.querySelector('textarea, input, [contenteditable]')).toBeNull();
  });
  it('editor.css carries the line states for the host\'s editor', () => {
    const css = readFileSync(join(__dirname, '..', 'src', 'editor', 'editor.css'), 'utf8');
    expect(css).toMatch(/\.sett-ed-line\s+\{ background: var\(--sett-editor-line\); \}/);
    expect(css).toMatch(/\.sett-ed-line--bad\s+\{ background: var\(--sett-color-bad-bg\); \}/);
  });
});
