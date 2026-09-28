import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sessionStyles, type SessionId } from '../session.js';

/**
 * The centre tab bar: map pinned first, file tabs in mono, shortcuts on the right.
 * @slot - sett-tab elements
 * @slot right - what sits at the right end (level switch, overlay toggles, shortcuts)
 */
@customElement('sett-tabbar')
export class SettTabbar extends LitElement {
  static styles = css`
    :host { display: flex; align-items: stretch; height: calc(var(--sett-space-4) * 2); border-bottom: var(--sett-stroke-hair) solid var(--sett-color-line2); background: var(--sett-color-well); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); color: var(--sett-color-ink2); }
    .sp { flex: 1; }
    .r { display: flex; align-items: center; gap: var(--sett-space-2); padding: 0 var(--sett-space-2); color: var(--sett-color-mute); font-size: var(--sett-font-size-sm); }
  `;
  render() { return html`<slot></slot><span class="sp"></span><span class="r"><slot name="right"></slot></span>`; }
}

/**
 * A tab. `pinned` has no close mark; `dirty` carries an amber mark after the
 * name and keeps its close mark; `session` colours the label.
 * @slot - the label
 * @fires sett-select - the tab was chosen
 * @fires sett-close - the close mark was pressed
 */
@customElement('sett-tab')
export class SettTab extends LitElement {
  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: Boolean, reflect: true }) pinned = false;
  @property({ type: Boolean, reflect: true }) dirty = false;
  /** mono label, for files */
  @property({ type: Boolean, reflect: true }) mono = false;
  @property({ reflect: true }) session?: SessionId;
  static styles = [
    sessionStyles,
    css`
      :host { display: flex; align-items: center; gap: var(--sett-space-2); padding: 0 var(--sett-space-3); border-right: var(--sett-stroke-hair) solid var(--sett-color-line2); color: var(--sett-color-ink2); cursor: pointer; white-space: nowrap; }
      :host([mono]) { font-family: var(--sett-font-mono); font-size: var(--sett-font-size-md); }
      :host([pinned]) { padding-left: var(--sett-space-2); font-weight: var(--sett-font-weight-medium); }
      :host([active]) { background: var(--sett-color-paper); color: var(--sett-color-ink); box-shadow: inset 0 var(--sett-stroke-lit) 0 var(--sett-color-sel); }
      :host([session]) { color: var(--_session); }
      :host(:focus-visible) { outline: none; box-shadow: inset 0 0 0 var(--sett-stroke-lit) var(--sett-color-sel); }
      .mark { color: var(--sett-color-sug); font-size: var(--sett-font-size-xs); }
      .x { color: var(--sett-color-mute); font-size: var(--sett-font-size-xs); cursor: pointer; }
      .x:hover { color: var(--sett-color-ink); }
    `,
  ];
  private select = () => this.dispatchEvent(new CustomEvent('sett-select', { bubbles: true, composed: true }));
  private close(e: Event) { e.stopPropagation(); this.dispatchEvent(new CustomEvent('sett-close', { bubbles: true, composed: true })); }
  connectedCallback() { super.connectedCallback(); this.setAttribute('role', 'tab'); this.tabIndex = 0; this.addEventListener('click', this.select); }
  render() {
    return html`<slot></slot>${this.dirty ? html`<span class="mark" title="unsaved">●</span>` : nothing}${this.pinned ? nothing : html`<span class="x" @click=${this.close}>✕</span>`}`;
  }
}

/**
 * A segmented control in a well. Never has a disabled item: a view with
 * nothing in it opens to an empty state instead.
 * @slot - sett-seg-item elements
 */
@customElement('sett-seg')
export class SettSeg extends LitElement {
  /** stretch to the container, items share the width */
  @property({ type: Boolean, reflect: true }) fill = false;
  static styles = css`
    :host { display: inline-flex; gap: var(--sett-space-1); background: var(--sett-color-well); border-radius: var(--sett-radius-card); padding: var(--sett-space-1); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-md); }
    :host([fill]) { display: flex; }
    :host([fill]) ::slotted(sett-seg-item) { flex: 1; text-align: center; }
  `;
  render() { return html`<slot></slot>`; }
}

/** One item of a segmented control. @slot - the label, with a count if any. @fires sett-select - with `{ value }` */
@customElement('sett-seg-item')
export class SettSegItem extends LitElement {
  @property() value = '';
  @property({ type: Boolean, reflect: true }) active = false;
  static styles = css`
    :host { display: inline-block; padding: 0 var(--sett-space-2); line-height: var(--sett-space-5); border-radius: var(--sett-radius-chip); color: var(--sett-color-ink2); cursor: pointer; white-space: nowrap; }
    :host(:hover) { color: var(--sett-color-ink); }
    :host([active]) { background: var(--sett-color-paper); color: var(--sett-color-ink); font-weight: var(--sett-font-weight-medium); }
    :host(:focus-visible) { outline: none; box-shadow: 0 0 0 var(--sett-stroke-lit) var(--sett-color-sel); }
  `;
  private select = () => this.dispatchEvent(new CustomEvent('sett-select', { bubbles: true, composed: true, detail: { value: this.value } }));
  connectedCallback() { super.connectedCallback(); this.setAttribute('role', 'tab'); this.tabIndex = 0; this.addEventListener('click', this.select); }
  render() { return html`<slot></slot>`; }
}

/** The row of overlay toggles on the map bar. @slot - sett-toggle elements */
@customElement('sett-overlay-toggles')
export class SettOverlayToggles extends LitElement {
  static styles = css`:host { display: inline-flex; gap: var(--sett-space-2); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-sm); }`;
  render() { return html`<slot></slot>`; }
}

/** One overlay toggle: a small square that fills when on. @slot - the label. @fires sett-toggle - with `{ value, on }` */
@customElement('sett-toggle')
export class SettToggle extends LitElement {
  @property() value = '';
  @property({ type: Boolean, reflect: true }) on = false;
  static styles = css`
    :host { display: inline-flex; align-items: center; gap: var(--sett-space-1); padding: 0 var(--sett-space-2); line-height: var(--sett-space-4); border: var(--sett-stroke-hair) solid var(--sett-color-line); border-radius: var(--sett-radius-pill); color: var(--sett-color-ink2); cursor: pointer; white-space: nowrap; }
    :host([on]) { border-color: var(--sett-color-ink2); color: var(--sett-color-ink); }
    :host(:focus-visible) { outline: none; box-shadow: 0 0 0 var(--sett-stroke-lit) var(--sett-color-sel); }
    i { width: var(--sett-space-2); height: var(--sett-space-2); border-radius: var(--sett-radius-item); border: var(--sett-stroke-hair) solid currentColor; box-sizing: border-box; }
    :host([on]) i { background: currentColor; }
  `;
  private flip = () => { this.on = !this.on; this.dispatchEvent(new CustomEvent('sett-toggle', { bubbles: true, composed: true, detail: { value: this.value, on: this.on } })); };
  connectedCallback() { super.connectedCallback(); this.setAttribute('role', 'switch'); this.tabIndex = 0; this.addEventListener('click', this.flip); }
  updated() { this.setAttribute('aria-checked', String(this.on)); }
  render() { return html`<i></i><slot></slot>`; }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-tabbar': SettTabbar; 'sett-tab': SettTab; 'sett-seg': SettSeg; 'sett-seg-item': SettSegItem; 'sett-overlay-toggles': SettOverlayToggles; 'sett-toggle': SettToggle }
}
