import { css } from 'lit';
import { sessionStyles } from './session.js';

/** what the shell is about: main, a focused session's worktree, your own work, or a plan being shaped */
export type ScopeKind = 'main' | 'session' | 'you' | 'plan';

/** `id` is the worktree id of a session (`w1`); `name` is what it is called (`refund flow`, `fix-pool-size`) */
export interface Scope { kind: ScopeKind; id?: string; name?: string; locked?: boolean }

/** the glyph shown after the words of a locked scope; it is never part of the words */
export const SCOPE_LOCK = '🔒';

/**
 * The words of a scope, written the same wherever the scope is named (DESIGN.md
 * "The shell" rule 3): `main` · `w1 · refund flow` · `you · fix-pool-size` ·
 * `plan · refund flow`. `head` is the mono part (`main`, `w1`, `you`, `plan`),
 * `tail` the rest. An unknown kind reads as main.
 */
export const scopeWords = (s: Scope): { head: string; tail: string } => {
  switch (s.kind) {
    case 'session': return { head: s.id || 'session', tail: s.name ?? '' };
    case 'you': return { head: 'you', tail: s.name ?? '' };
    case 'plan': return { head: 'plan', tail: s.name ?? '' };
    default: return { head: 'main', tail: '' };
  }
};

/** the words on one line: head, then `·` and the tail when there is one */
export const scopeText = (s: Scope): string => {
  const { head, tail } = scopeWords(s);
  return tail ? `${head} · ${tail}` : head;
};

/**
 * The colour of a scope, set from the host attributes `scope` and `session` so
 * a consumer never passes a colour. Exposes `--_scope` (dot, bar) and
 * `--_scope-bg` (tint) inside the host: main is neutral, a session takes its
 * own colour (an unknown id falls back like sessionStyles), you is sel, a plan
 * is sug.
 */
export const scopeStyles = css`
  ${sessionStyles}
  :host { --_scope: var(--sett-color-mute); --_scope-bg: var(--sett-color-well); }
  :host([scope='session']) { --_scope: var(--_session); --_scope-bg: var(--_session-bg); }
  :host([scope='you']) { --_scope: var(--sett-color-sel); --_scope-bg: var(--sett-color-sel-bg); }
  :host([scope='plan']) { --_scope: var(--sett-color-sug); --_scope-bg: var(--sett-color-sug-bg); }
`;
