import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sessionStyles, type SessionId } from '../session.js';
import { STATUS, dotStyles, pillWords, type BranchState } from '../status.js';
import '../pill/sett-pill.js';

/**
 * Branch selector in a pane bar: dot, branch name, a pill when the branch has
 * a state, caret. Click toggles `open`; the `menu` slot (a sett-menu) hangs
 * under it as an anchored disclosure: nothing is dimmed or trapped, Esc, a
 * click outside or choosing a row closes it.
 *
 * @slot - the branch name, mono
 * @slot menu - the sett-menu shown while open
 * @fires sett-open - when the menu opens
 * @fires sett-close - when the menu closes
 * @csspart button - the selector box
 */
@customElement('sett-selector')
export class SettSelector extends LitElement {
  @property({ reflect: true }) state: BranchState = 'main';

  /** session id for planning / working; unknown ids fall back to yk */
  @property({ reflect: true }) session?: SessionId;

  /** number of open asks, shown in the pill for the asks state */
  @property({ type: Number }) count?: number;

  /** whether the menu is shown */
  @property({ type: Boolean, reflect: true }) open = false;

  /** force the reduced-motion rendering */
  @property({ type: Boolean, reflect: true }) still = false;

  static styles = [
    sessionStyles,
    dotStyles,
    css`
      :host { display: inline-block; position: relative; }
      .button {
        display: inline-flex;
        align-items: center;
        gap: var(--sett-space-2);
        padding: var(--sett-space-1) var(--sett-space-2);
        line-height: var(--sett-space-4);
        border: var(--sett-stroke-hair) solid var(--sett-color-line);
        border-radius: var(--sett-radius-chip);
        background: var(--sett-color-paper);
        font-family: var(--sett-font-mono);
        font-size: var(--sett-font-size-lg);
        color: var(--sett-color-ink);
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
      }
      .button:focus-visible { outline: none; box-shadow: inset 0 0 0 var(--sett-stroke-lit) var(--sett-color-sel); }
      .car { color: var(--sett-color-mute); font-family: var(--sett-font-sans); }
      .menu { position: absolute; top: calc(100% + var(--sett-space-1)); left: 0; z-index: 1; }
      :host(:not([open])) .menu { display: none; }
    `,
  ];

  private onDocClick = (e: Event) => {
    if (!e.composedPath().includes(this)) this.close();
  };
  private onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.close();
  };

  updated(changed: Map<string, unknown>) {
    if (changed.has('open')) {
      if (this.open) {
        document.addEventListener('click', this.onDocClick, true);
        document.addEventListener('keydown', this.onKey);
        this.dispatchEvent(new CustomEvent('sett-open', { bubbles: true, composed: true }));
      } else if (changed.get('open') === true) {
        document.removeEventListener('click', this.onDocClick, true);
        document.removeEventListener('keydown', this.onKey);
        this.dispatchEvent(new CustomEvent('sett-close', { bubbles: true, composed: true }));
      }
    }
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('sett-select', this.close);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('sett-select', this.close);
    document.removeEventListener('click', this.onDocClick, true);
    document.removeEventListener('keydown', this.onKey);
  }

  close = () => { this.open = false; };
  toggle() { this.open = !this.open; }

  render() {
    const s = STATUS[this.state];
    const words = pillWords(this.state, this.count);
    return html`
      <span class="button" part="button" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded=${this.open}
        @click=${this.toggle} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggle(); } }}>
        <span class="dot" data-kind=${s.dot} ?data-pulse=${!!s.pulse}></span>
        <slot></slot>
        ${s.pill ? html`<sett-pill kind=${s.pill} session=${this.session ?? ''}>${words}</sett-pill>` : nothing}
        <span class="car">▾</span>
      </span>
      <div class="menu"><slot name="menu"></slot></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-selector': SettSelector }
}
