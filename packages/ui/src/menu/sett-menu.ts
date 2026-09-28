import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sessionStyles, type SessionId } from '../session.js';
import { STATUS, dotStyles, pillWords, type BranchState } from '../status.js';
import '../pill/sett-pill.js';

/**
 * The list under a selector: rows grouped by what they need from you.
 * Paper, hairline, card radius, shadow. Not a modal: see sett-selector.
 *
 * @slot - sett-menu-group elements
 */
@customElement('sett-menu')
export class SettMenu extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-width: calc(var(--sett-space-1) * 70);
      background: var(--sett-color-paper);
      border: var(--sett-stroke-hair) solid var(--sett-color-line);
      border-radius: var(--sett-radius-card);
      box-shadow: var(--sett-shadow);
      font-size: var(--sett-font-size-lg);
      padding-bottom: var(--sett-space-1);
    }
  `;
  /** accessible name of the list; the selector that owns the menu usually says what it lists */
  @property() label = 'menu';
  render() { return html`<div role="listbox" aria-label=${this.label}><slot></slot></div>`; }
}

/**
 * A group in the menu: lowercase title in mute at 10.5 px, then rows.
 * @slot - sett-menu-item elements
 */
@customElement('sett-menu-group')
export class SettMenuGroup extends LitElement {
  /** group title: needs you · working · waiting to merge · saved plans · main */
  @property() label = '';
  static styles = css`
    :host { display: block; }
    h6 {
      margin: 0;
      padding: var(--sett-space-2) var(--sett-space-3) var(--sett-space-1);
      font-size: var(--sett-font-size-xs);
      font-weight: var(--sett-font-weight-medium);
      color: var(--sett-color-mute);
      text-transform: lowercase;
    }
  `;
  connectedCallback() { super.connectedCallback(); this.setAttribute('role', 'group'); }
  updated() { this.setAttribute('aria-label', this.label); }
  // the heading is presentational: a listbox group may only own options, and the group carries the name
  render() { return html`<h6 role="presentation">${this.label}</h6><slot></slot>`; }
}

/**
 * One row: dot, name in mono, pill when the branch has a state, then who or
 * how far on the right. Rows never wrap: the name truncates with an ellipsis,
 * the right cell keeps its width and the name's size.
 *
 * @slot - the branch or plan name
 * @slot right - who is on it or how far it is, e.g. `Lyon · 4/6`
 * @fires sett-select - when the row is chosen
 */
@customElement('sett-menu-item')
export class SettMenuItem extends LitElement {
  @property({ reflect: true }) state: BranchState = 'main';
  @property({ reflect: true }) session?: SessionId;
  @property({ type: Number }) count?: number;
  /** the current row */
  @property({ type: Boolean, reflect: true }) selected = false;
  @property({ type: Boolean, reflect: true }) still = false;

  static styles = [
    sessionStyles,
    dotStyles,
    css`
      :host {
        display: flex;
        align-items: center;
        gap: var(--sett-space-2);
        padding: var(--sett-space-1) var(--sett-space-3);
        line-height: var(--sett-space-4);
        cursor: pointer;
        white-space: nowrap;
        color: var(--sett-color-ink);
      }
      :host(:hover) { background: var(--sett-color-well); }
      :host([selected]) { background: var(--sett-color-sel-bg); }
      .name { font-family: var(--sett-font-mono); overflow: hidden; text-overflow: ellipsis; min-width: 0; }
      sett-pill { flex: none; }
      .right { flex: none; margin-left: auto; color: var(--sett-color-ink2); }
      ::slotted([slot='right']) { font-family: var(--sett-font-sans); }
    `,
  ];

  private choose() {
    this.dispatchEvent(new CustomEvent('sett-select', { bubbles: true, composed: true, detail: { state: this.state } }));
  }

  // the row itself is the option, so the listbox > group > option tree is what assistive tech reads
  updated() { this.setAttribute('aria-selected', String(this.selected)); }

  render() {
    const s = STATUS[this.state];
    return html`
      <span class="dot" data-kind=${s.dot} ?data-pulse=${!!s.pulse}></span>
      <span class="name"><slot></slot></span>
      ${s.pill ? html`<sett-pill kind=${s.pill} session=${this.session ?? ''}>${pillWords(this.state, this.count)}</sett-pill>` : ''}
      <span class="right"><slot name="right"></slot></span>`;
  }
  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'option');
    this.addEventListener('click', this.choose);
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-menu': SettMenu; 'sett-menu-group': SettMenuGroup; 'sett-menu-item': SettMenuItem }
}
