import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Where you are on the map, as the trail that led there: numbered rows, the
 * oldest first. The rows before the `current` one are where you came from: a
 * click goes back to that place. After going back, the rows past the current
 * one are `future`: still listed, lighter, a click goes forward again. The
 * list numbers its rows itself.
 *
 * @slot - sett-position-row elements, in the order they were visited
 * @fires sett-go - `{ n, key, future }` from a row: go to that place
 */
@customElement('sett-position')
export class SettPosition extends LitElement {
  static styles = css`
    :host { display: flex; flex-direction: column; padding: var(--sett-space-1) 0; }
  `;
  private observer?: MutationObserver;
  private number = () => {
    const rows = Array.from(this.children).filter((r): r is SettPositionRow => r.localName === 'sett-position-row');
    rows.forEach((r, i) => { r.n = i + 1; });
  };
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'position');
    this.observer = new MutationObserver(this.number);
    this.observer.observe(this, { childList: true });
    this.number();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
  }
  render() { return html`<slot @slotchange=${this.number}></slot>`; }
}

/**
 * One place of the trail: its number, its name in mono, and the level it is
 * at in plain words (`board`, `unit`, `area`, `item`). A past or future row
 * is a button; the `current` row is where you are and leads nowhere. Pointing
 * eases the row's background (`motion.hover`); the name never moves or fades.
 *
 * @slot - the place's name
 * @fires sett-go - `{ n, key, future }` on click, Enter or Space
 */
@customElement('sett-position-row')
export class SettPositionRow extends LitElement {
  /** the row's number in the trail; set by sett-position */
  @property({ type: Number }) n?: number;
  /** what the host knows this place by */
  @property({ reflect: true }) key?: string;
  /** the level of the place: `board`, `unit`, `area`, `item` */
  @property() level = '';
  /** where you are now */
  @property({ type: Boolean, reflect: true }) current = false;
  /** ahead of where you are, after going back */
  @property({ type: Boolean, reflect: true }) future = false;

  static styles = css`
    :host {
      display: grid;
      grid-template-columns: var(--sett-space-4) minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--sett-space-2);
      box-sizing: border-box;
      height: var(--sett-map-size-item-row);
      padding: 0 var(--sett-space-3);
      color: var(--sett-color-ink);
      font-family: var(--sett-font-mono);
      font-size: var(--sett-font-size-base);
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
      transition: background-color var(--sett-motion-hover) ease;
    }
    :host(:hover) { background: var(--sett-color-well); }
    :host(:focus-visible) { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: calc(-1 * var(--sett-stroke-lit)); }
    .n, .lv { color: var(--sett-color-mute); }
    .n { text-align: right; }
    .lv { font-family: var(--sett-font-sans); font-size: var(--sett-font-size-sm); }
    .t { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    :host([future]) .t { color: var(--sett-color-mute); }
    :host([current]) { background: var(--sett-color-sel-bg); cursor: default; }
    :host([current]) .t { font-weight: var(--sett-font-weight-medium); }
    :host([current]) .n, :host([current]) .lv { color: var(--sett-color-ink2); }
    @media (prefers-reduced-motion: reduce) { :host { transition: none; } }
  `;

  private go = () => {
    if (this.current) return;
    this.dispatchEvent(new CustomEvent('sett-go', { detail: { n: this.n, key: this.key, future: this.future }, bubbles: true, composed: true }));
  };
  private onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    this.go();
  };

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.go);
    this.addEventListener('keydown', this.onKey);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.go);
    this.removeEventListener('keydown', this.onKey);
  }
  willUpdate() {
    // the current row is a place, not a control
    if (this.current) { this.removeAttribute('role'); this.removeAttribute('tabindex'); this.setAttribute('aria-current', 'step'); }
    else { this.setAttribute('role', 'button'); this.tabIndex = 0; this.removeAttribute('aria-current'); }
  }

  render() {
    return html`<span class="n">${this.n ?? nothing}</span><span class="t"><slot></slot></span><span class="lv">${this.level}</span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-position': SettPosition; 'sett-position-row': SettPositionRow }
}
