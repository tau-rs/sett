import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'lit';
import '../src/index.js';
import { SCOPE_LOCK, scopeText, type Scope } from '../src/scope.js';
import * as shell from '../src/recipes/shell-recipes.stories.js';

// DESIGN.md "The shell" rule 3: the scope is written in three places with the same words (the scope line, the
// selector, the status bar's scope item), and rule 5: the frame says the state of the scope.
const RECIPES: { story: keyof typeof shell; scope: Scope; frames: string[] }[] = [
  { story: 'PlanShaping', scope: shell.SCOPES.planShaping, frames: ['planning'] },
];

const text = (el: Element, sel: string) => el.shadowRoot!.querySelector(sel)!.textContent!.replace(/\s+/g, ' ').trim();
const draw = async (name: keyof typeof shell) => {
  const host = document.createElement('div');
  document.body.append(host);
  render((shell[name] as any).render(), host);
  const all = Array.from(host.querySelectorAll<HTMLElement & { updateComplete?: Promise<boolean> }>('sett-scope-line, sett-selector, sett-status-item, sett-frame'));
  await Promise.all(all.map((el) => el.updateComplete));
  return host;
};

afterEach(() => { document.body.innerHTML = ''; });

describe('shell recipes', () => {
  it('every story of the file is covered here, and each scope is declared once', () => {
    const { default: meta, ...exported } = shell as Record<string, any>;
    const stories = Object.keys(exported).filter((k) => !meta.excludeStories.includes(k));
    expect(RECIPES.map((r) => r.story).sort()).toEqual(stories.sort());
    expect(Object.values(shell.SCOPES).length).toBe(RECIPES.length);
  });

  for (const { story, scope, frames } of RECIPES) {
    describe(String(story), () => {
      it('writes the scope with the same words in the three places: scope line, selector, status bar', async () => {
        const host = await draw(story);
        const words = scopeText(scope);
        const lines = host.querySelectorAll('sett-scope-line');
        const selectors = host.querySelectorAll('sett-selector');
        const items = host.querySelectorAll('sett-status-item[scope]');
        expect([lines.length, selectors.length, items.length]).toEqual([1, 1, 1]);
        expect(text(lines[0], '.words')).toBe(words);
        expect(text(selectors[0], '.words')).toBe(words);
        expect(text(items[0], '.scope')).toBe(words);
        // never typed: the selector takes no slotted name while a scope is set
        expect(selectors[0].textContent!.trim()).toBe('');
      });
      it('the three places and the frame take the same kind, the same session colour and the same lock', async () => {
        const host = await draw(story);
        const frame = host.querySelector('sett-frame')!;
        const places = [host.querySelector('sett-scope-line')!, host.querySelector('sett-selector')!, host.querySelector('sett-status-item[scope]')!];
        for (const el of places) {
          expect(el.getAttribute('scope'), el.localName).toBe(scope.kind);
          expect(el.getAttribute('session'), el.localName).toBe(frame.getAttribute('session'));
          expect(el.hasAttribute('locked'), el.localName).toBe(!!scope.locked);
          expect(el.shadowRoot!.textContent!.includes(SCOPE_LOCK), el.localName).toBe(!!scope.locked);
        }
        expect(host.querySelector('sett-activity-rail')!.getAttribute('scope')).toBe(scope.kind);
        expect(frame.hasAttribute('session')).toBe(scope.kind === 'session');
      });
      it('the frame says the state of the scope, and holds the whole screen', async () => {
        const host = await draw(story);
        const frame = host.querySelector('sett-frame')!;
        expect(frames).toContain(frame.getAttribute('state'));
        expect({ plan: ['planning'], you: ['editing'], session: ['live', 'waiting'], main: ['idle'] }[scope.kind]).toContain(frame.getAttribute('state'));
        expect(frame.hasAttribute('still')).toBe(true);
        for (const sel of ['sett-activity-rail', 'sett-scope-line', 'sett-selector', 'sett-tabbar', 'sett-inspector', 'sett-bottom-panel', 'sett-status-bar']) expect(frame.querySelector(sel), sel).not.toBeNull();
        expect(host.querySelectorAll('sett-frame').length).toBe(1);
      });
    });
  }
});
