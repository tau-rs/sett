import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Where the map is, as one mono line: `orderly › api › routes › subscribe()`.
 * Every step but the last is a click that goes up to it; the last is where
 * you are. A step changes ink at once when pointed at: text never eases.
 * With no room the earlier steps end in an ellipsis; the last one stays whole.
 *
 * @fires sett-go - `{ index, step }`: go up to that step
 */
@customElement('sett-crumb')
export class SettCrumb extends LitElement {
  /** the steps from the repo down, e.g. `["orderly","api","routes"]`; the last is where you are */
  @property({ type: Array }) steps: string[] = [];

  static styles = css`
    :host { display: flex; align-items: center; gap: var(--sett-space-1); min-width: 0; color: var(--sett-color-ink2); font-family: var(--sett-font-mono); font-size: var(--sett-font-size-base); white-space: nowrap; }
    button { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; margin: 0; padding: 0; border: 0; background: none; color: inherit; font: inherit; cursor: pointer; }
    button:hover { color: var(--sett-color-ink); }
    button:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: var(--sett-stroke-hair); border-radius: var(--sett-radius-item); }
    i { flex: none; font-style: normal; color: var(--sett-color-mute); }
    b { flex: none; font-weight: var(--sett-font-weight-medium); color: var(--sett-color-ink); }
  `;

  private go(index: number) {
    this.dispatchEvent(new CustomEvent('sett-go', { detail: { index, step: this.steps[index] }, bubbles: true, composed: true }));
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'where the map is');
  }
  render() {
    const last = this.steps.length - 1;
    return this.steps.map((s, i) => i === last
      ? html`<b aria-current="location">${s}</b>`
      : html`<button type="button" @click=${() => this.go(i)}>${s}</button><i aria-hidden="true">›</i>`);
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-crumb': SettCrumb }
}
