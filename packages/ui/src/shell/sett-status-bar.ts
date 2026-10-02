import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { SCOPE_LOCK, scopeStyles, scopeText, type ScopeKind } from '../scope.js';
import type { SessionId } from '../session.js';
import { clickOnEnter, hostLinkStyles, syncHostLink } from './host-link.js';

/**
 * The status bar: counts and states, each a link to the view that owns it,
 * never a verb (DESIGN.md "The shell" rule 8). One line at the bottom of the
 * shell.
 *
 * @slot - sett-status-item elements, from the left: the scope first
 * @slot right - sett-status-item elements pushed to the right end (the caret's place in a file, the map's freshness)
 */
@customElement('sett-status-bar')
export class SettStatusBar extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--sett-space-3);
      box-sizing: border-box;
      height: var(--sett-size-shell-status);
      padding: 0 var(--sett-space-3);
      border-top: var(--sett-stroke-hair) solid var(--sett-color-line2);
      background: var(--sett-color-well);
      color: var(--sett-color-ink2);
      font-family: var(--sett-font-sans);
      font-size: var(--sett-font-size-md);
      white-space: nowrap;
    }
    .right { margin-left: auto; display: flex; align-items: center; gap: var(--sett-space-3); }
  `;
  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'group');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'status');
  }
  render() { return html`<slot></slot><span class="right"><slot name="right"></slot></span>`; }
}

/**
 * One item of the status bar: a count or a state, and a link to the view that
 * owns it. The whole item is the link: the host, or an `<a>` when `href` is
 * set. With `scope` it is the scope item: a dot in the scope's colour, then
 * the scope's words from `scopeText` (and `🔒` when locked), then its state.
 *
 * @slot - the count or state: `b` is a count (ink, medium); `[data-tone="sug" | "bad" | "ok"]` takes that accent
 */
@customElement('sett-status-item')
export class SettStatusItem extends LitElement {
  /** the view's name before the content, e.g. `Sessions` */
  @property() label?: string;

  /** where the item leads; renders an `<a>`. Without it the host is the link and its click is the consumer's */
  @property() href?: string;

  /** makes this the scope item: the kind of scope the shell is about */
  @property({ reflect: true }) scope?: ScopeKind;

  /** session id when the scope is a session; unknown ids fall back to yk */
  @property({ reflect: true }) session?: SessionId;

  /** the worktree id of a session scope, e.g. `w1` */
  @property({ attribute: 'scope-id' }) scopeId?: string;

  /** what the scope is called: `refund flow`, `fix-pool-size` */
  @property() name?: string;

  /** the scope is locked: 🔒 after its words */
  @property({ type: Boolean, reflect: true }) locked = false;

  /** whether the slot holds anything, so the scope's words are not followed by a dangling `·` */
  @state() private filled = false;

  static styles = [
    scopeStyles,
    hostLinkStyles,
    css`
      :host, a { display: inline-flex; align-items: center; gap: var(--sett-space-2); white-space: nowrap; }
      :host(:hover) { color: var(--sett-color-ink); }
      .dot { flex: none; width: var(--sett-space-2); height: var(--sett-space-2); border-radius: var(--sett-radius-chip); background: var(--_scope); }
      ::slotted(b) { font-weight: var(--sett-font-weight-medium); color: var(--sett-color-ink); }
      ::slotted([data-tone='sug']) { color: var(--sett-color-sug); }
      ::slotted([data-tone='bad']) { color: var(--sett-color-bad); }
      ::slotted([data-tone='ok']) { color: var(--sett-color-ok); }
    `,
  ];

  private onSlot = (e: Event) => {
    this.filled = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).some((n) => (n.textContent ?? '').trim() !== '');
  };

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', clickOnEnter);
    this.filled = (this.textContent ?? '').trim() !== '';
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', clickOnEnter);
  }
  willUpdate() { syncHostLink(this, this.href); }

  render() {
    const scope = this.scope
      ? html`<span class="scope">${scopeText({ kind: this.scope, id: this.scopeId, name: this.name })}</span>${this.locked ? html` · <span class="lock" role="img" aria-label="locked">${SCOPE_LOCK}</span>` : nothing}${this.filled ? ' · ' : nothing}`
      : nothing;
    const body = html`${this.scope ? html`<span class="dot"></span>` : nothing}<span class="text">${scope}${this.label ? html`<span class="label">${this.label}</span> ` : nothing}<slot @slotchange=${this.onSlot}></slot></span>`;
    return this.href ? html`<a href=${this.href}>${body}</a>` : body;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-status-bar': SettStatusBar; 'sett-status-item': SettStatusItem }
}
