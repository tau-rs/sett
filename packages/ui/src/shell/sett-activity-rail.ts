import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { badgeStyles, type BadgeTone } from '../badge.js';
import { scopeStyles, type ScopeKind } from '../scope.js';
import type { SessionId } from '../session.js';

/**
 * The activity rail: the always-visible column that picks what the left pane
 * shows (DESIGN.md "The shell" rule 2). Two items, Sessions · Files, each a
 * glyph over a horizontal label; findings live in the bottom panel. It never
 * hides: `closed` only records that the left pane is folded, and changes
 * nothing here, so the badges and the scope bar stay. When the scope is not
 * main, the active item's bar takes the scope's colour.
 *
 * Arrow up and down move focus between the items, Enter or Space activates.
 * The rail reports and never changes `active` itself. Give it an `aria-label`.
 *
 * @slot - sett-rail-item elements
 * @fires sett-view - `{ value, active }` when an item is activated; `active` is true when it already was the active one (the consumer closes the pane)
 */
@customElement('sett-activity-rail')
export class SettActivityRail extends LitElement {
  /** what the shell is about; anything but main colours the active item's bar */
  @property({ reflect: true }) scope: ScopeKind = 'main';

  /** session id when the scope is a session; unknown ids fall back to yk */
  @property({ reflect: true }) session?: SessionId;

  /** the left pane is closed. A fact for the consumer: the rail looks the same */
  @property({ type: Boolean, reflect: true }) closed = false;

  private observer?: MutationObserver;

  static styles = [
    scopeStyles,
    css`
      :host {
        --_rail-bar: var(--sett-color-sel);
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: calc(var(--sett-space-1) / 2);
        flex: none;
        box-sizing: border-box;
        width: var(--sett-size-shell-rail);
        padding: var(--sett-space-1) 0;
        background: var(--sett-color-well);
        border-right: var(--sett-stroke-hair) solid var(--sett-color-line2);
        font-family: var(--sett-font-sans);
      }
      :host([scope='session']), :host([scope='you']), :host([scope='plan']) { --_rail-bar: var(--_scope); }
    `,
  ];

  private get items(): SettRailItem[] {
    return Array.from(this.children).filter((c): c is SettRailItem => c instanceof SettRailItem);
  }

  /** one tab stop: the active item, or the first when none is */
  private sync = () => {
    const items = this.items;
    const stop = items.find((i) => i.active) ?? items[0];
    for (const i of items) i.tabIndex = i === stop ? 0 : -1;
  };

  private onClick = (e: Event) => {
    const item = e.composedPath().find((n): n is SettRailItem => n instanceof SettRailItem);
    if (!item || item.parentElement !== this) return;
    this.dispatchEvent(new CustomEvent('sett-view', { bubbles: true, composed: true, detail: { value: item.value, active: item.active } }));
  };

  private onKey = (e: KeyboardEvent) => {
    const items = this.items;
    const at = items.indexOf(e.target as SettRailItem);
    if (at < 0) return;
    const to = e.key === 'ArrowDown' ? (at + 1) % items.length
      : e.key === 'ArrowUp' ? (at - 1 + items.length) % items.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? items.length - 1
      : -1;
    if (to >= 0) { e.preventDefault(); items[to].focus(); return; }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); items[at].click(); }
  };

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'tablist');
    this.setAttribute('aria-orientation', 'vertical');
    this.addEventListener('click', this.onClick);
    this.addEventListener('keydown', this.onKey);
    if (typeof MutationObserver === 'function') {
      this.observer = new MutationObserver(this.sync);
      this.observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['active'] });
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('keydown', this.onKey);
    this.observer?.disconnect();
  }
  updated() { this.sync(); }

  render() { return html`<slot @slotchange=${this.sync}></slot>`; }
}

/**
 * One view of the activity rail: a glyph over a horizontal label, never the
 * glyph alone. Active, it is ink on paper with a bar on its left: `sel`, or
 * the scope's colour when the rail has one. A badge sits top right: `sug` for
 * what asks you, `bad` for something that blocks.
 *
 * @slot - the label, always shown
 * @slot glyph - an inline SVG drawn with `currentColor`; sized and stroked here
 */
@customElement('sett-rail-item')
export class SettRailItem extends LitElement {
  /** the view this item picks, reported by the rail's `sett-view` */
  @property() value = '';

  @property({ type: Boolean, reflect: true }) active = false;

  /** a count shown top right; no attribute, no badge */
  @property() badge?: string;

  /** the badge's fill: sug (asks you) or bad (something that blocks) */
  @property({ reflect: true }) tone: BadgeTone = 'sug';

  /** what the badge says to a screen reader, e.g. `1 asks you` */
  @property({ attribute: 'badge-label' }) badgeLabel?: string;

  static styles = [
    badgeStyles,
    css`
      :host {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--sett-space-1);
        box-sizing: border-box;
        padding: var(--sett-space-2) 0 var(--sett-space-1);
        border-left: var(--sett-size-shell-scope-bar) solid transparent;
        font-family: var(--sett-font-sans);
        font-size: var(--sett-font-size-xs);
        line-height: var(--sett-font-line-height-ui);
        color: var(--sett-color-ink2);
        white-space: nowrap;
        cursor: pointer;
        user-select: none;
      }
      :host(:hover) { color: var(--sett-color-ink); }
      :host([active]) { color: var(--sett-color-ink); font-weight: var(--sett-font-weight-medium); background: var(--sett-color-paper); border-left-color: var(--_rail-bar, var(--sett-color-sel)); }
      :host(:focus-visible) { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: calc(-1 * var(--sett-stroke-lit)); }
      ::slotted(svg) {
        width: calc(var(--sett-space-1) * 4.5);
        height: calc(var(--sett-space-1) * 4.5);
        stroke: currentColor;
        fill: none;
        stroke-width: var(--sett-stroke-lit);
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .badge { position: absolute; top: calc(var(--sett-space-1) / 2); right: var(--sett-space-2); }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'tab');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
  }
  updated() { this.setAttribute('aria-selected', String(this.active)); }

  render() {
    return html`<slot name="glyph"></slot><slot></slot>${this.badge
      ? html`<span class="badge" data-tone=${this.tone} role="img" aria-label=${this.badgeLabel || this.badge}>${this.badge}</span>`
      : nothing}`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-activity-rail': SettActivityRail; 'sett-rail-item': SettRailItem }
}
