import { describe, expect, it } from 'vitest';
import { SCOPE_LOCK, scopeStyles, scopeText, scopeWords, type Scope } from '../src/scope.js';
import { badgeStyles } from '../src/badge.js';
import { sessionOrder } from '../src/session.js';

describe('scope: one source for the words and the colour', () => {
  it('writes the four scopes the way DESIGN.md "The shell" rule 3 does', () => {
    const cases: [Scope, string, string, string][] = [
      [{ kind: 'main' }, 'main', '', 'main'],
      [{ kind: 'session', id: 'w1', name: 'refund flow' }, 'w1', 'refund flow', 'w1 · refund flow'],
      [{ kind: 'you', name: 'fix-pool-size' }, 'you', 'fix-pool-size', 'you · fix-pool-size'],
      [{ kind: 'plan', name: 'refund flow' }, 'plan', 'refund flow', 'plan · refund flow'],
    ];
    for (const [scope, head, tail, text] of cases) {
      expect(scopeWords(scope), scope.kind).toEqual({ head, tail });
      expect(scopeText(scope), scope.kind).toBe(text);
    }
  });
  it('the lock is a glyph after the words, never part of them', () => {
    expect(scopeText({ kind: 'you', name: 'fix-pool-size', locked: true })).toBe('you · fix-pool-size');
    expect(scopeText({ kind: 'session', id: 'w1', name: 'refund flow', locked: true })).toBe('w1 · refund flow');
    expect(SCOPE_LOCK).toBe('🔒');
  });
  it('a missing part leaves no dangling separator; main ignores a name', () => {
    expect(scopeText({ kind: 'you' })).toBe('you');
    expect(scopeText({ kind: 'plan' })).toBe('plan');
    expect(scopeText({ kind: 'session', id: 'w2' })).toBe('w2');
    expect(scopeText({ kind: 'session', name: 'refund flow' })).toBe('session · refund flow');
    expect(scopeText({ kind: 'main', name: 'ignored' })).toBe('main');
    expect(scopeText({ kind: 'nope' as Scope['kind'] })).toBe('main');
  });
  it('maps each kind to its colour and tint, tokens only', () => {
    const c = scopeStyles.cssText;
    expect(c).toMatch(/:host \{ --_scope: var\(--sett-color-mute\); --_scope-bg: var\(--sett-color-well\); \}/);
    expect(c).toMatch(/:host\(\[scope='session'\]\) \{ --_scope: var\(--_session\); --_scope-bg: var\(--_session-bg\); \}/);
    expect(c).toMatch(/:host\(\[scope='you'\]\) \{ --_scope: var\(--sett-color-sel\); --_scope-bg: var\(--sett-color-sel-bg\); \}/);
    expect(c).toMatch(/:host\(\[scope='plan'\]\) \{ --_scope: var\(--sett-color-sug\); --_scope-bg: var\(--sett-color-sug-bg\); \}/);
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(c).not.toMatch(/\d+px/);
  });
  it('an unknown session id falls back like sessionStyles: the first session', () => {
    const c = scopeStyles.cssText;
    // the default comes from sessionStyles and is only overridden by a known id
    expect(c).toContain(`:host {\n    --_session: var(--sett-session-${sessionOrder[0]}-main);`);
    for (const id of sessionOrder) expect(c, id).toContain(`:host([session="${id}"]) { --_session: var(--sett-session-${id}-main);`);
    expect(c).not.toContain('[session="zz"]');
  });
});

describe('count badge', () => {
  it('is a solid fill with paper text on sug and bad, well and ink2 by default', () => {
    const c = badgeStyles.cssText;
    expect(c).toMatch(/\.badge \{[^}]*background: var\(--sett-color-well\);[^}]*color: var\(--sett-color-ink2\);/);
    expect(c).toMatch(/\.badge\[data-tone='sug'\] \{ background: var\(--sett-color-sug\); color: var\(--sett-color-paper\); \}/);
    expect(c).toMatch(/\.badge\[data-tone='bad'\] \{ background: var\(--sett-color-bad\); color: var\(--sett-color-paper\); \}/);
  });
  it('uses tokens only and never animates', () => {
    const c = badgeStyles.cssText;
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(c).not.toMatch(/\d+px/);
    expect(c).not.toMatch(/animation|transition/);
  });
});
