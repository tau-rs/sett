import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * The way back up, as a pill: `‹` and the place it leads to, with the key
 * that does the same (`esc`) when the host gives one. It docks at the start
 * of the map's strip, before the crumb (map rule 8): it never floats over the
 * drawing. Pointing eases its border (`motion.hover`); its words never move.
 *
 * @slot - where back leads: `board`, `api`; default `back`
 * @fires sett-back - on click, Enter or Space
 */
@customElement('sett-back')
export class SettBack extends LitElement {
  /** the key that does the same, shown after the words: `esc` */
  @property() hint?: string;

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--sett-space-1);
      flex: none;
      box-sizing: border-box;
      height: var(--sett-map-size-item-row);
      padding: 0 var(--sett-pad-pill);
      border: var(--sett-stroke-hair) solid var(--sett-color-line);
      border-radius: var(--sett-radius-pill);
      background: var(--sett-color-paper);
      color: var(--sett-color-ink2);
      font-family: var(--sett-font-sans);
      font-size: var(--sett-font-size-base);
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
      transition: border-color var(--sett-motion-hover) ease;
    }
    :host(:hover) { border-color: var(--sett-color-ink2); color: var(--sett-color-ink); }
    :host(:focus-visible) { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: var(--sett-stroke-hair); }
    .k { font-family: var(--sett-font-mono); font-size: var(--sett-font-size-xs); color: var(--sett-color-mute); }
    @media (prefers-reduced-motion: reduce) { :host { transition: none; } }
  `;

  private back = () => this.dispatchEvent(new CustomEvent('sett-back', { bubbles: true, composed: true }));
  private onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    this.back();
  };

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'button');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.addEventListener('click', this.back);
    this.addEventListener('keydown', this.onKey);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.back);
    this.removeEventListener('keydown', this.onKey);
  }

  render() {
    return html`<span aria-hidden="true">‹</span><slot>back</slot>${this.hint ? html`<span class="k">${this.hint}</span>` : nothing}`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-back': SettBack }
}
