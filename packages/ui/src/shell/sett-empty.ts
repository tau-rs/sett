import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * An empty state: what a view with nothing in it opens to. Views are never
 * disabled (DESIGN.md rule 11): a tab body, a pane or a seg's view with
 * nothing to list stays clickable and says so here, in a line of words in
 * secondary ink, then the doors that lead out of it, agent door first and
 * bold, manual door second and plain (P-1, rule 3). It is not a banner and
 * not a status: nothing about it moves or is announced.
 *
 * Stacked by default, the words over the doors, centred, for a narrow pane;
 * `inline` puts the words and the doors on one line, separated by `·`, for a
 * wide and short body such as a bottom panel tab.
 *
 * @slot - the words: `no findings`, `no review yet on feat/refund`
 * @slot door - sett-button elements, the agent door first (`variant="primary"`), then the manual door; none, one or two
 */
@customElement('sett-empty')
export class SettEmpty extends LitElement {
  /** the words and the doors on one line, separated by `·` */
  @property({ type: Boolean, reflect: true }) inline = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--sett-space-2);
      box-sizing: border-box;
      padding: var(--sett-space-4);
      text-align: center;
      font-family: var(--sett-font-sans);
      font-size: var(--sett-font-size-md);
      line-height: var(--sett-font-line-height-ui);
      color: var(--sett-color-ink2);
    }
    :host([hidden]) { display: none; }
    :host([inline]) { flex-direction: row; flex-wrap: wrap; padding: var(--sett-space-6) var(--sett-space-3); }
    .doors { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--sett-space-2); }
    .doors[hidden] { display: none; }
    .sep::before { content: var(--sett-glyph-sep); color: var(--sett-color-mute); }
  `;

  // the doors' row and the `·` before it go with the doors: they never dangle
  private hasDoors = () => Array.from(this.children).some((c) => c.slot === 'door');
  private onSlot = () => this.requestUpdate();

  render() {
    const doors = this.hasDoors();
    return html`<span class="words"><slot></slot></span>${this.inline && doors ? html`<span class="sep" aria-hidden="true"></span>` : nothing}<span class="doors" ?hidden=${!doors}><slot name="door" @slotchange=${this.onSlot}></slot></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-empty': SettEmpty }
}
