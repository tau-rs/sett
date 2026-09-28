import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import '../src/index.js';

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
  it('sett-hint is a quiet pill on the editor hint tokens', async () => {
    document.body.innerHTML = '<sett-hint kind="planned">planned · +refund()</sett-hint>';
    const el = document.body.firstElementChild as any; await el.updateComplete;
    const c = ([] as any[]).concat((customElements.get('sett-hint') as any).styles).map((s: any) => s.cssText).join('\n');
    expect(c).toContain('var(--sett-editor-hint-bg)');
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\d+px|animation/);
    expect(el.getAttribute('kind')).toBe('planned');
  });
});
