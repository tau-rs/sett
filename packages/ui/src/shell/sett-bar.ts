import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

/**
 * The bar: the one line on top of the shell (DESIGN.md "The shell" rule 1):
 * brand, repo › scope selector, chips, Ask. The bar writes the `›` after the
 * repo, so the consumer never does. A chip sits in the bar only if it carries
 * a verb. The chips and the Ask entry hold the right end; when room runs out
 * the chips give way and scroll sideways (a wheel, a trackpad, or focus brings
 * a chip into view; while they scroll, their strip is a tab stop the arrow keys
 * scroll), and nothing else wraps or shrinks. The bar never clips,
 * so the selector's menu hangs under it.
 *
 * Without anything in the `ask` slot the bar shows its own Ask entry, a word
 * door in mute ink followed by `shortcut`; choosing it fires `sett-ask`. The
 * shortcut is only written here: binding the key is the host's.
 *
 * @slot brand - the tool's name: `arch`
 * @slot repo - the repo's name: `orderly`; the bar writes the `›` after it
 * @slot - the scope selector, a sett-selector
 * @slot chips - sett-chip elements, each carrying a verb
 * @slot ask - the Ask entry, when the host brings its own; the bar's own entry stands in while it is empty
 * @fires sett-ask - the bar's own Ask entry was chosen
 * @csspart ask - the bar's own Ask entry
 */
@customElement('sett-bar')
export class SettBar extends LitElement {
  /** the shortcut written after the bar's own Ask entry: `⌘K` */
  @property() shortcut?: string;

  /** whether the chips overflow their strip, which then takes a tab stop so the keyboard can scroll it */
  @state() private scrolls = false;
  @query('.chips') private chips!: HTMLElement;
  private observer?: ResizeObserver;

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--sett-space-3);
      box-sizing: border-box;
      height: var(--sett-size-shell-bar);
      min-width: 0;
      padding: 0 var(--sett-space-3);
      background: var(--sett-color-paper);
      border-bottom: var(--sett-stroke-hair) solid var(--sett-color-line2);
      font-family: var(--sett-font-sans);
      font-size: var(--sett-font-size-base);
      color: var(--sett-color-ink);
      white-space: nowrap;
    }
    :host([hidden]) { display: none; }
    .brand, .repo, ::slotted(:not([slot])) { flex: none; }
    .brand { font-size: var(--sett-font-size-xl); font-weight: var(--sett-font-weight-semibold); }
    .repo { display: inline-flex; align-items: center; gap: var(--sett-space-1); color: var(--sett-color-ink2); }
    .repo[hidden] { display: none; }
    .end { margin-left: auto; display: flex; align-items: center; gap: var(--sett-space-3); flex: 0 1 auto; min-width: 0; }
    /* when room runs out the chips give way, scrolling as the tab bar's tabs do (#33); the room above and under keeps a verb's focus ring */
    .chips { display: flex; align-items: center; gap: var(--sett-space-2); flex: 0 1 auto; min-width: 0; margin: 0 calc(var(--sett-space-1) * -1); padding: var(--sett-space-1); overflow-x: auto; overflow-y: hidden; scrollbar-width: none; }
    .chips::-webkit-scrollbar { display: none; }
    .chips:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: calc(var(--sett-stroke-lit) * -1); }
    .chips ::slotted(*) { flex: none; }
    ::slotted([slot='ask']) { flex: none; }
    .ask { flex: none; padding: 0; border: 0; background: none; font: inherit; color: var(--sett-color-mute); cursor: pointer; border-radius: var(--sett-radius-item); }
    .ask:hover { color: var(--sett-color-ink); }
    .ask:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: var(--sett-stroke-hair); }
  `;

  // the `›` goes with the repo: it never dangles when the repo slot is empty
  private hasRepo = () => Array.from(this.children).some((c) => c.slot === 'repo' && (c.textContent ?? '').trim() !== '');
  private onSlot = () => this.requestUpdate();
  private measure = () => { if (this.chips) this.scrolls = this.chips.scrollWidth > this.chips.clientWidth; };
  private ask = () => this.dispatchEvent(new CustomEvent('sett-ask', { bubbles: true, composed: true }));

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'group');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'bar');
    this.updateComplete.then(() => {
      if (!this.isConnected || this.observer || typeof ResizeObserver === 'undefined') return;
      this.observer = new ResizeObserver(this.measure);
      this.observer.observe(this.chips);
    });
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
    this.observer = undefined;
  }

  render() {
    return html`<span class="brand"><slot name="brand"></slot></span>
      <span class="repo" ?hidden=${!this.hasRepo()}><slot name="repo" @slotchange=${this.onSlot}></slot><span aria-hidden="true">›</span></span>
      <slot></slot>
      <span class="end">
        <span class="chips" tabindex=${this.scrolls ? 0 : nothing} role=${this.scrolls ? 'group' : nothing} aria-label=${this.scrolls ? 'chips' : nothing}><slot name="chips" @slotchange=${this.measure}></slot></span>
        <slot name="ask"><button class="ask" part="ask" type="button" @click=${this.ask}>Ask${this.shortcut ? html` ${this.shortcut}` : nothing}</button></slot>
      </span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-bar': SettBar }
}
