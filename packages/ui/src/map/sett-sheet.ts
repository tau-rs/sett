import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * The inside of an open unit: the exposes rail, the columns, the needs rail,
 * in one row. `sett-node[tier="sheet"]` hosts one in its `inside` slot, and a
 * ghost neighbour shows the same element folded. Everything inside is laid
 * out by normal flow, so the links of lane 4 read their endpoints from the DOM.
 *
 * `folded` folds every area at once (the PoC's areas / items switch).
 *
 * @slot exposes - a `sett-rail side="exposes"`
 * @slot - `sett-column` children
 * @slot needs - a `sett-rail side="needs"`
 * @fires sett-fold - bubbles from the areas inside
 */
@customElement('sett-sheet')
export class SettSheet extends LitElement {
  /** fold every area inside, or open them all again */
  @property({ type: Boolean, reflect: true }) folded = false;

  static styles = css`
    :host { position: relative; display: flex; align-items: flex-start; gap: var(--sett-map-size-column-gutter); }
  `;

  updated(changed: Map<string, unknown>) {
    if (!changed.has('folded') || (changed.get('folded') === undefined && !this.folded)) return;
    this.querySelectorAll('sett-area').forEach((a) => { (a as HTMLElement & { folded: boolean }).folded = this.folded; });
  }

  render() {
    return html`<slot name="exposes"></slot><slot></slot><slot name="needs"></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-sheet': SettSheet }
}
