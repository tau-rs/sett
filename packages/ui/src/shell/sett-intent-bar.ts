import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * The intent bar: the plan's intention, above the Map in a plan scope (the
 * plan on the shell: "the intention sits above it"). One line of text on
 * the sug tint with a hairline under it; Enter drafts: the planner draws
 * elements. At the right, what the plan holds so far in mute (`5 elements ·
 * 2 groups`) and the app's verbs, if any. The field's styling is the
 * composer's, kept local here: the composer's styles are not a shared
 * module and lifting them out would be a refactor of it.
 *
 * @slot verbs - sett-button elements at the right end
 * @fires sett-intent - `{ value }` on Enter
 * @csspart input - the text field
 */
@customElement('sett-intent-bar')
export class SettIntentBar extends LitElement {
  /** the intention's words; kept in step with what is typed */
  @property() value = '';

  /** the empty field's words */
  @property() placeholder = 'what should change?';

  /** what the plan holds, mute at the right, e.g. `5 elements · 2 groups` */
  @property() counts?: string;

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--sett-space-2);
      box-sizing: border-box;
      padding: var(--sett-space-2) var(--sett-space-3);
      background: var(--sett-color-sug-bg);
      border-bottom: var(--sett-stroke-hair) solid var(--sett-color-line2);
      font-family: var(--sett-font-sans);
      font-size: var(--sett-font-size-base);
      color: var(--sett-color-ink2);
    }
    input {
      flex: 1;
      min-width: 0;
      box-sizing: border-box;
      font: inherit;
      font-size: var(--sett-font-size-lg);
      line-height: var(--sett-font-line-height-ui);
      padding: var(--sett-space-1) var(--sett-space-2);
      color: var(--sett-color-ink);
      background: var(--sett-color-paper);
      border: var(--sett-stroke-hair) solid var(--sett-color-line);
      border-radius: var(--sett-radius-chip);
    }
    input::placeholder { color: var(--sett-color-mute); }
    input:focus-visible { outline: none; box-shadow: 0 0 0 var(--sett-stroke-lit) var(--sett-color-sel); }
    .counts { flex: none; color: var(--sett-color-mute); white-space: nowrap; }
    .verbs { flex: none; display: flex; gap: var(--sett-space-1); }
  `;

  private onInput = (e: Event) => { this.value = (e.target as HTMLInputElement).value; };
  private onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    this.dispatchEvent(new CustomEvent('sett-intent', { bubbles: true, composed: true, detail: { value: this.value } }));
  };

  render() {
    return html`<input part="input" type="text" aria-label="intention" .value=${this.value} placeholder=${this.placeholder} @input=${this.onInput} @keydown=${this.onKey}>
      ${this.counts ? html`<span class="counts">${this.counts}</span>` : nothing}
      <span class="verbs"><slot name="verbs"></slot></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-intent-bar': SettIntentBar }
}
