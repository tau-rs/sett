import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type SessionId } from '../session.js';
import { scopeStyles, type ScopeKind } from '../scope.js';
import { STATUS, dotStyles, pillWords, type BranchState } from '../status.js';
import '../pill/sett-pill.js';

/**
 * The list under the scope selector: sessions grouped by what they need,
 * `planning` · `yours` · `needs you` · `running` · `in review` · `done`, and
 * `main` as a row of its own, in no group. Paper, hairline, card radius,
 * shadow. Not a modal: see sett-selector.
 *
 * @slot - sett-menu-group elements, and a sett-menu-item for a row that belongs to no group (`main`)
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
    ::slotted(sett-menu-item:first-child) { margin-top: var(--sett-space-1); }
  `;
  /** accessible name of the list; the selector that owns the menu usually says what it lists */
  @property() label = 'menu';
  render() { return html`<div role="listbox" aria-label=${this.label}><slot></slot></div>`; }
}

/**
 * A group in the menu: lowercase title in mute at 10.5 px, then rows. The
 * groups say what a session needs, in this order: `planning` · `yours` ·
 * `needs you` · `running` · `in review` · `done`.
 * @slot - sett-menu-item elements
 */
@customElement('sett-menu-group')
export class SettMenuGroup extends LitElement {
  /** group title, lowercase: planning · yours · needs you · running · in review · done */
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
 * One row: dot, name in mono, pill when the row has a state, then who or
 * how far on the right. A row that names a scope writes the words the
 * selector writes (`scopeText`). Rows never wrap: the name truncates with an
 * ellipsis, the right cell keeps its width and the name's size.
 *
 * @slot - the words of the scope: `main`, `w1 · refund flow`, `you · fix-pool-size`, `plan · refund flow`
 * @slot right - who is on it or how far it is, e.g. `Lyon · 4/6`
 * @fires sett-select - when the row is chosen
 */
@customElement('sett-menu-item')
export class SettMenuItem extends LitElement {
  @property({ reflect: true }) state: BranchState = 'main';
  @property({ reflect: true }) session?: SessionId;
  @property({ type: Number }) count?: number;
  /** the scope the row names: its dot takes the scope's colour, as in the selector and the scope line; `state` still gives the pill */
  @property({ reflect: true }) scope?: ScopeKind;
  /** the current row */
  @property({ type: Boolean, reflect: true }) selected = false;
  @property({ type: Boolean, reflect: true }) still = false;

  static styles = [
    scopeStyles,
    dotStyles,
    css`
      .dot[data-kind='scope'] { background: var(--_scope); }
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
      <span class="dot" data-kind=${this.scope ? 'scope' : s.dot} ?data-pulse=${!!s.pulse}></span>
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
