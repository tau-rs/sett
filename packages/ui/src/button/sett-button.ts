import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../pill/sett-pill.js';

export type ButtonVariant = 'default' | 'primary' | 'quiet';
export type ButtonSize = 'md' | 'sm';

/**
 * A button. Grid metrics, lowercase, tokens only. A disabled primary is a
 * dashed blue outline at full contrast, never a faded fill.
 *
 * @slot - the label
 * @csspart button - the native button
 */
@customElement('sett-button')
export class SettButton extends LitElement {
  @property({ reflect: true }) variant: ButtonVariant = 'default';
  @property({ reflect: true }) size: ButtonSize = 'md';
  @property({ type: Boolean, reflect: true }) disabled = false;
  static styles = css`
    :host { display: inline-block; }
    :host([hidden]) { display: none; }
    button {
      font: inherit; font-size: var(--sett-font-size-base); line-height: var(--sett-space-4);
      padding: var(--sett-space-1) var(--sett-space-2);
      color: var(--sett-color-ink); background: var(--sett-color-paper);
      border: var(--sett-stroke-hair) solid var(--sett-color-line); border-radius: var(--sett-radius-chip);
      cursor: pointer; text-transform: lowercase; white-space: nowrap;
    }
    :host([size='sm']) button { font-size: var(--sett-font-size-md); padding: 0 var(--sett-space-2); }
    button:hover { background: var(--sett-color-well); }
    button:focus-visible { outline: none; box-shadow: 0 0 0 var(--sett-stroke-lit) var(--sett-color-sel); }
    :host([variant='primary']) button { background: var(--sett-color-sel); color: var(--sett-color-paper); border-color: var(--sett-color-sel); }
    :host([variant='quiet']) button { border-color: transparent; background: transparent; color: var(--sett-color-ink2); }
    button:disabled { cursor: not-allowed; background: transparent; border-style: dashed; color: var(--sett-color-mute); border-color: var(--sett-color-line); }
    :host([variant='primary']) button:disabled { background: transparent; border-style: dashed; color: var(--sett-color-sel); border-color: var(--sett-color-sel); }
  `;
  render() { return html`<button part="button" ?disabled=${this.disabled}><slot></slot></button>`; }
}

/**
 * The planner's accept: the main verb plus a ▾ that opens a list (the driver)
 * under it, an anchored disclosure like the selector's.
 *
 * @slot - the main verb
 * @slot menu - a sett-menu shown while open
 * @fires sett-press - the main verb was pressed
 * @fires sett-open / sett-close
 */
@customElement('sett-split-button')
export class SettSplitButton extends LitElement {
  @property({ reflect: true }) variant: ButtonVariant = 'primary';
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  static styles = css`
    :host { display: inline-block; position: relative; }
    .group { display: inline-flex; }
    button { font: inherit; font-size: var(--sett-font-size-base); line-height: var(--sett-space-4); padding: var(--sett-space-1) var(--sett-space-2); color: var(--sett-color-ink); background: var(--sett-color-paper); border: var(--sett-stroke-hair) solid var(--sett-color-line); cursor: pointer; text-transform: lowercase; white-space: nowrap; }
    button:hover { background: var(--sett-color-well); }
    button:focus-visible { outline: none; box-shadow: 0 0 0 var(--sett-stroke-lit) var(--sett-color-sel); position: relative; z-index: 1; }
    .main { border-radius: var(--sett-radius-chip) 0 0 var(--sett-radius-chip); }
    .dd { border-radius: 0 var(--sett-radius-chip) var(--sett-radius-chip) 0; padding-left: var(--sett-space-1); padding-right: var(--sett-space-1); margin-left: calc(-1 * var(--sett-stroke-hair)); }
    :host([variant='primary']) button { background: var(--sett-color-sel); color: var(--sett-color-paper); border-color: var(--sett-color-sel); }
    :host([variant='primary']) .dd { border-left-color: var(--sett-color-paper); }
    button:disabled, :host([variant='primary']) button:disabled { cursor: not-allowed; background: transparent; border-style: dashed; color: var(--sett-color-sel); border-color: var(--sett-color-sel); }
    .menu { position: absolute; top: calc(100% + var(--sett-space-1)); left: 0; z-index: 1; }
    :host(:not([open])) .menu { display: none; }
  `;
  private onDocClick = (e: Event) => { if (!e.composedPath().includes(this)) this.close(); };
  private onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') this.close(); };
  close = () => { this.open = false; };
  toggle = () => { this.open = !this.open; };
  press = () => { this.dispatchEvent(new CustomEvent('sett-press', { bubbles: true, composed: true })); };
  updated(changed: Map<string, unknown>) {
    if (!changed.has('open')) return;
    if (this.open) {
      document.addEventListener('click', this.onDocClick, true); document.addEventListener('keydown', this.onKey);
      this.dispatchEvent(new CustomEvent('sett-open', { bubbles: true, composed: true }));
    } else if (changed.get('open') === true) {
      document.removeEventListener('click', this.onDocClick, true); document.removeEventListener('keydown', this.onKey);
      this.dispatchEvent(new CustomEvent('sett-close', { bubbles: true, composed: true }));
    }
  }
  connectedCallback() { super.connectedCallback(); this.addEventListener('sett-select', this.close); }
  disconnectedCallback() { super.disconnectedCallback(); this.removeEventListener('sett-select', this.close); document.removeEventListener('click', this.onDocClick, true); document.removeEventListener('keydown', this.onKey); }
  render() {
    return html`<span class="group">
      <button class="main" part="main" ?disabled=${this.disabled} @click=${this.press}><slot></slot></button>
      <button class="dd" part="dropdown" ?disabled=${this.disabled} aria-haspopup="listbox" aria-expanded=${this.open} @click=${this.toggle}>▾</button>
    </span><div class="menu"><slot name="menu"></slot></div>`;
  }
}

/**
 * The merge: a primary button that stays visibly primary while blocked, with
 * its reason under it. Blocked = dashed blue outline; reasons are pills, each a
 * link to what unblocks it.
 *
 * @slot - the verb
 * @slot reason - pills or words under the button
 * @fires sett-press - when open and pressed
 */
@customElement('sett-gated-button')
export class SettGatedButton extends LitElement {
  @property({ type: Boolean, reflect: true }) blocked = false;
  static styles = css`
    :host { display: inline-flex; flex-direction: column; align-items: flex-start; gap: var(--sett-space-1); }
    .reason { font-size: var(--sett-font-size-sm); color: var(--sett-color-ink2); display: flex; gap: var(--sett-space-1); align-items: center; flex-wrap: wrap; }
    .reason:not(:has(*)) { display: none; }
  `;
  private press = () => { if (!this.blocked) this.dispatchEvent(new CustomEvent('sett-press', { bubbles: true, composed: true })); };
  render() {
    return html`<sett-button variant="primary" ?disabled=${this.blocked} @click=${this.press}><slot></slot></sett-button><span class="reason" part="reason"><slot name="reason"></slot></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-button': SettButton; 'sett-split-button': SettSplitButton; 'sett-gated-button': SettGatedButton }
}
