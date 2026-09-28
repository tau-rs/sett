import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sessionStyles, type SessionId } from '../session.js';

export type PillKind = 'default' | 'sug' | 'bad' | 'ok' | 'sel' | 'session';

/**
 * Status pill: the one way a blocked or waiting state is written wherever its
 * subject is named (selector, menu row, gated button reason, session-card row).
 * Mono, 11 px, never animates.
 *
 * @slot - the label, lowercase
 * @csspart pill - the pill box
 */
@customElement('sett-pill')
export class SettPill extends LitElement {
  /** colour role. `sug` amber for asks/planned/waiting, `bad`, `ok`, `sel`, or `session` (see `session`). */
  @property({ reflect: true }) kind: PillKind = 'default';

  /** session id (yk tl mg cy ol sn pl) when kind is `session`; unknown ids fall back to yk */
  @property({ reflect: true }) session?: SessionId;

  static styles = [
    sessionStyles,
    css`
      :host {
        display: inline-block;
        font-family: var(--sett-font-mono);
        font-size: var(--sett-font-size-sm);
        line-height: var(--sett-size-pill);
        padding: 0 var(--sett-pad-pill);
        border: var(--sett-stroke-hair) solid var(--sett-color-line);
        border-radius: var(--sett-radius-pill);
        color: var(--sett-color-ink2);
        background: transparent;
        white-space: nowrap;
        vertical-align: middle;
      }
      :host([kind='sug']) { background: var(--sett-color-sug-bg); border-color: transparent; color: var(--sett-color-sug); }
      :host([kind='bad']) { background: var(--sett-color-bad-bg); border-color: transparent; color: var(--sett-color-bad); }
      :host([kind='ok']) { background: var(--sett-color-ok-bg); border-color: transparent; color: var(--sett-color-ok); }
      :host([kind='sel']) { background: var(--sett-color-sel-bg); border-color: transparent; color: var(--sett-color-sel); }
      :host([kind='session']) { background: var(--_session-bg); border-color: transparent; color: var(--_session); }
    `,
  ];

  render() {
    return html`<slot part="pill"></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-pill': SettPill }
}
