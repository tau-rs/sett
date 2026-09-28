import { css } from 'lit';

/** the states a branch can be in, as shown by the selector and the menu rows */
export type BranchState = 'main' | 'yours' | 'planning' | 'working' | 'asks' | 'paused' | 'done' | 'collision';

export type PillKind = 'default' | 'sug' | 'bad' | 'ok' | 'sel' | 'session';
export type DotKind = 'ok' | 'sel' | 'session' | 'sug' | 'mute' | 'bad';

/** dot colour, pill kind and pill words per state. `asks` takes a count. */
export const STATUS: Record<BranchState, { dot: DotKind; pill?: PillKind; words?: string; pulse?: boolean }> = {
  main: { dot: 'ok' },
  yours: { dot: 'sel' },
  planning: { dot: 'session', pill: 'session', words: 'planning' },
  working: { dot: 'session', pill: 'session', words: 'working', pulse: true },
  asks: { dot: 'sug', pill: 'sug', words: 'asks' },
  paused: { dot: 'mute', pill: 'default', words: 'paused' },
  done: { dot: 'ok', pill: 'ok', words: 'done' },
  collision: { dot: 'bad', pill: 'bad', words: 'collision' },
};

export const pillWords = (state: BranchState, count?: number) =>
  state === 'asks' && count != null ? `asks · ${count}` : STATUS[state].words;

/**
 * The status dot. Session colour comes from the host's `--_session` (see
 * sessionStyles). It pulses while its session is working: the one allowed use
 * of the frame-pulse timing outside the frame. Reduced motion stills it.
 */
export const dotStyles = css`
  .dot {
    flex: none;
    width: var(--sett-space-2);
    height: var(--sett-space-2);
    border-radius: var(--sett-radius-chip);
    background: var(--sett-color-mute);
  }
  .dot[data-kind='ok'] { background: var(--sett-color-ok); }
  .dot[data-kind='sel'] { background: var(--sett-color-sel); }
  .dot[data-kind='sug'] { background: var(--sett-color-sug); }
  .dot[data-kind='bad'] { background: var(--sett-color-bad); }
  .dot[data-kind='session'] { background: var(--_session); }
  .dot[data-pulse] { animation: sett-dot-pulse var(--sett-motion-frame-pulse) ease-in-out infinite; }
  @keyframes sett-dot-pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
  :host([still]) .dot[data-pulse] { animation: none; }
  @media (prefers-reduced-motion: reduce) { .dot[data-pulse] { animation: none; } }
`;
