import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type HintKind = 'default' | 'planned' | 'finding' | 'session' | 'blame';

/**
 * An inlay hint: rust-analyzer's type hints and arch's own use one shape, a
 * quiet grey pill after the code. `kind` colours the text (planned, finding,
 * session, blame). `planned` is the hint pill of a planned element, after the
 * line at its site next to the `◇` in the gutter (DESIGN.md rule 12): the plan
 * is never an inserted line.
 * @slot - the hint text
 */
@customElement('sett-hint')
export class SettHint extends LitElement {
  @property({ reflect: true }) kind: HintKind = 'default';
  static styles = css`
    :host { display: inline-block; font-family: var(--sett-font-sans); font-size: var(--sett-font-size-xs); line-height: var(--sett-size-tag); padding: 0 var(--sett-space-1); border-radius: var(--sett-radius-item); background: var(--sett-editor-hint-bg); color: var(--sett-editor-hint-ink); margin: 0 var(--sett-space-1); white-space: nowrap; vertical-align: baseline; }
    :host([kind='planned']) { color: var(--sett-color-sug); }
    :host([kind='finding']) { color: var(--sett-color-bad); }
    :host([kind='session']) { color: var(--_session, var(--sett-session-yk-main)); }
    :host([kind='blame']) { color: var(--sett-color-mute); background: transparent; }
  `;
  render() { return html`<slot></slot>`; }
}

declare global { interface HTMLElementTagNameMap { 'sett-hint': SettHint } }
