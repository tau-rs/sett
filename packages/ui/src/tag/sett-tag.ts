import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sessionStyles, type SessionId } from '../session.js';

export type TagKind = 'default' | 'sug' | 'bad' | 'ok' | 'sel' | 'session';

/**
 * Small badge: a kind label, a count, a glyph, or a mono identifier such as
 * `service.rs:61`. Sans 10.5 px, radius 3, text only, never animates.
 *
 * @slot - the text or glyph
 */
@customElement('sett-tag')
export class SettTag extends LitElement {
  /** colour role, same set as sett-pill */
  @property({ reflect: true }) kind: TagKind = 'default';

  /** session id when kind is `session`; unknown ids fall back to yk */
  @property({ reflect: true }) session?: SessionId;

  /** mono face for identifiers, file:line, branch names */
  @property({ type: Boolean, reflect: true }) mono = false;

  static styles = [
    sessionStyles,
    css`
      :host {
        display: inline-block;
        font-family: var(--sett-font-sans);
        font-size: var(--sett-font-size-xs);
        line-height: var(--sett-size-tag);
        padding: 0 var(--sett-pad-tag);
        border-radius: var(--sett-radius-item);
        background: var(--sett-color-well);
        color: var(--sett-color-ink2);
        white-space: nowrap;
        vertical-align: middle;
      }
      :host([mono]) { font-family: var(--sett-font-mono); }
      :host([kind='sug']) { background: var(--sett-color-sug-bg); color: var(--sett-color-sug); }
      :host([kind='bad']) { background: var(--sett-color-bad-bg); color: var(--sett-color-bad); }
      :host([kind='ok']) { background: var(--sett-color-ok-bg); color: var(--sett-color-ok); }
      :host([kind='sel']) { background: var(--sett-color-sel-bg); color: var(--sett-color-sel); }
      :host([kind='session']) { background: var(--_session-bg); color: var(--_session); }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-tag': SettTag }
}
