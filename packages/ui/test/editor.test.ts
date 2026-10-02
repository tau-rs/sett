import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from 'lit';
import '../src/index.js';
import { sessionOrder } from '../src/index.js';
import * as editorStories from '../src/editor/editor.stories.js';

const css = readFileSync(join(__dirname, '..', 'src', 'editor', 'editor.css'), 'utf8');
beforeAll(() => customElements.whenDefined('sett-hint'));

describe('editor layer', () => {
  it('editor.css uses tokens only and has one animation, the item pulse on the motion token', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{6}\b/);
    expect(css).not.toMatch(/\d+px/);
    expect(css).not.toMatch(/\d+m?s\b/);
    expect(css.match(/@keyframes/g)).toHaveLength(1);
    expect(css).toContain('sett-item-pulse var(--sett-motion-item-pulse)');
  });
  it('covers the seven syntax classes plus comment and definition, and the decorations', () => {
    for (const c of ['keyword', 'string', 'constant', 'type', 'function', 'macro', 'attribute', 'comment', 'definition']) expect(css).toContain(`.sett-syn-${c}`);
    for (const c of ['sett-gutter-bar--you', 'sett-gutter-bar--session', 'sett-gutter-glyph--finding', 'sett-gutter-glyph--planned', 'sett-gutter-glyph--witness', 'sett-span-finding', 'sett-span-witness', 'sett-sym-external', 'sett-hint', 'sett-hints', 'sett-ruler-mark--error']) expect(css).toContain(`.${c}`);
    expect(css).toMatch(/\.sett-sym-external \{[^}]*font-style: italic/);
    expect(css).toMatch(/\.sett-span-finding \{ text-decoration: underline wavy var\(--sett-editor-underline-error\)/);
  });
  it('a change bar class per author: you in sel, one per session id in its main colour', () => {
    expect(css).toMatch(/\.sett-gutter-bar--you\s+\{ border-left-color: var\(--sett-editor-gutter-you\); \}/);
    for (const id of sessionOrder) expect(css, id).toMatch(new RegExp(`\\.sett-gutter-bar--${id}\\s+\\{ border-left-color: var\\(--sett-session-${id}-main\\); \\}`));
  });
  it('sett-hint is a quiet pill on the editor hint tokens', async () => {
    document.body.innerHTML = '<sett-hint kind="planned">planned · +refund()</sett-hint>';
    const el = document.body.firstElementChild as any; await el.updateComplete;
    const c = ([] as any[]).concat((customElements.get('sett-hint') as any).styles).map((s: any) => s.cssText).join('\n');
    expect(c).toContain('var(--sett-editor-hint-bg)');
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\d+px|animation/);
    expect(el.getAttribute('kind')).toBe('planned');
  });
});


// DESIGN.md rule 12: a planned element is a gutter glyph and a hint pill at its site, never an inserted line
describe('a planned element never renders as an inserted line', () => {
  const draw = (name: string) => {
    const story = (editorStories as Record<string, any>)[name];
    const host = document.createElement('div');
    render(story.render(), host);
    return host;
  };
  const lines = (host: HTMLElement) => Array.from(host.querySelectorAll('.ln'));
  it('the planned story has exactly the lines of the plain one; the plan sits in the gutter and in a sett-hint', () => {
    const plain = draw('Syntax'); const planned = draw('Planned');
    expect(lines(planned).length).toBe(lines(plain).length);
    expect(lines(planned).map((l) => l.querySelector('.t')!.textContent)).toEqual(lines(plain).map((l) => l.querySelector('.t')!.textContent));
    const site = lines(planned).filter((l) => l.querySelector('.sett-gutter-glyph--planned'));
    expect(site.length).toBe(1);
    const pill = site[0].querySelector('sett-hint[kind="planned"]')!;
    expect(pill.textContent).toContain('+refund()');
    for (const l of lines(planned)) expect(l.querySelector('.t')!.textContent).not.toContain('refund');
  });
  it('in every editor story, planned text lives only in a sett-hint or the gutter, never in a code span', () => {
    const { default: _meta, ...stories } = editorStories as Record<string, any>;
    let found = 0;
    for (const name of Object.keys(stories)) {
      const host = draw(name);
      for (const l of lines(host)) {
        const code = l.querySelector('.t')!.textContent ?? '';
        expect(code, `${name}: ${code}`).not.toMatch(/planned/);
        if (l.querySelector('sett-hint[kind="planned"]')) found++;
      }
    }
    expect(found).toBeGreaterThanOrEqual(3);
  });
});
