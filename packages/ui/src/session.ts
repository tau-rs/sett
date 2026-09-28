import { css, unsafeCSS } from 'lit';
import { sessionOrder, type SessionId } from '@tau-rs/sett-tokens';

export type { SessionId };
export { sessionOrder };

/**
 * Per-session colour variables, set from the `session` attribute so a consumer
 * never passes a colour. Unknown or missing id falls back to the first session.
 * Exposes `--_session`, `--_session-sub`, `--_session-bg` inside the host.
 */
export const sessionStyles = css`
  :host {
    --_session: var(--sett-session-${unsafeCSS(sessionOrder[0])}-main);
    --_session-sub: var(--sett-session-${unsafeCSS(sessionOrder[0])}-sub);
    --_session-bg: var(--sett-session-${unsafeCSS(sessionOrder[0])}-bg);
  }
  ${unsafeCSS(
    sessionOrder
      .map(
        (id) => `:host([session="${id}"]) { --_session: var(--sett-session-${id}-main); --_session-sub: var(--sett-session-${id}-sub); --_session-bg: var(--sett-session-${id}-bg); }`,
      )
      .join('\n'),
  )}
`;
