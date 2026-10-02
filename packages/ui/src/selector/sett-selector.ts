import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SessionId } from '../session.js';
import { SCOPE_LOCK, scopeStyles, scopeText, type ScopeKind } from '../scope.js';
import { STATUS, dotStyles, pillWords, type BranchState } from '../status.js';
import '../pill/sett-pill.js';

/**
 * The scope selector in the bar: dot, the words of the scope, a pill when it
 * has a state, caret. With `scope` set it writes the scope the way the scope
 * line and the frame do (DESIGN.md "The shell" rule 3): the words come from
 * `scopeText` (`main` · `w1 · refund flow` · `you · fix-pool-size` ·
 * `plan · refund flow`), never from the consumer; the dot takes the scope's
 * colour; for a session, you and a plan the border and the words take it too
 * (main stays neutral); `locked` adds `🔒` after the words. `state` still
 * drives the pill (`asks · n`, `paused`, `done`, `collision`…) and the dot's
 * pulse. Without `scope` it is the branch selector it was: the default slot is
 * the name and `state` drives the dot and the pill.
 *
 * Click toggles `open`; the `menu` slot (a sett-menu) hangs under it as an
 * anchored disclosure: nothing is dimmed or trapped, Esc, a click outside or
 * choosing a row closes it.
 *
 * @slot - the branch name, mono; not shown while `scope` is set
 * @slot menu - the sett-menu shown while open
 * @fires sett-open - when the menu opens
 * @fires sett-close - when the menu closes
 * @csspart button - the selector box
 */
@customElement('sett-selector')
export class SettSelector extends LitElement {
  @property({ reflect: true }) state: BranchState = 'main';

  /** what the shell is about; when set, the words are written from `scope`, `scope-id` and `name` */
  @property({ reflect: true }) scope?: ScopeKind;

  /** session id: the colour of a session scope and of the planning / working pill; unknown ids fall back to yk */
  @property({ reflect: true }) session?: SessionId;

  /** the worktree id of a session scope, e.g. `w1` */
  @property({ attribute: 'scope-id' }) scopeId?: string;

  /** what the scope is called: `refund flow`, `fix-pool-size` */
  @property() name?: string;

  /** the focus is pinned: shows 🔒 after the words of the scope */
  @property({ type: Boolean, reflect: true }) locked = false;

  /** number of open asks, shown in the pill for the asks state */
  @property({ type: Number }) count?: number;

  /** whether the menu is shown */
  @property({ type: Boolean, reflect: true }) open = false;

  /** force the reduced-motion rendering */
  @property({ type: Boolean, reflect: true }) still = false;

  static styles = [
    scopeStyles,
    dotStyles,
    css`
      :host { display: inline-block; position: relative; }
      .button {
        display: inline-flex;
        align-items: center;
        gap: var(--sett-space-2);
        padding: var(--sett-space-1) var(--sett-space-2);
        line-height: var(--sett-space-4);
        border: var(--sett-stroke-hair) solid var(--sett-color-line);
        border-radius: var(--sett-radius-chip);
        background: var(--sett-color-paper);
        font-family: var(--sett-font-mono);
        font-size: var(--sett-font-size-lg);
        color: var(--sett-color-ink);
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
      }
      .button:focus-visible { outline: none; box-shadow: inset 0 0 0 var(--sett-stroke-lit) var(--sett-color-sel); }
      .dot[data-kind='scope'] { background: var(--_scope); }
      :host([scope='session']) .button, :host([scope='you']) .button, :host([scope='plan']) .button { border-color: var(--_scope); color: var(--_scope); }
      .lock { font-size: var(--sett-font-size-sm); }
      .car { color: var(--sett-color-mute); font-family: var(--sett-font-sans); }
      .menu { position: absolute; top: calc(100% + var(--sett-space-1)); left: 0; z-index: 1; }
      :host(:not([open])) .menu { display: none; }
    `,
  ];

  private onDocClick = (e: Event) => {
    if (!e.composedPath().includes(this)) this.close();
  };
  private onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.close();
  };

  updated(changed: Map<string, unknown>) {
    if (changed.has('open')) {
      if (this.open) {
        document.addEventListener('click', this.onDocClick, true);
        document.addEventListener('keydown', this.onKey);
        this.dispatchEvent(new CustomEvent('sett-open', { bubbles: true, composed: true }));
      } else if (changed.get('open') === true) {
        document.removeEventListener('click', this.onDocClick, true);
        document.removeEventListener('keydown', this.onKey);
        this.dispatchEvent(new CustomEvent('sett-close', { bubbles: true, composed: true }));
      }
    }
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('sett-select', this.close);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('sett-select', this.close);
    document.removeEventListener('click', this.onDocClick, true);
    document.removeEventListener('keydown', this.onKey);
  }

  close = () => { this.open = false; };
  toggle() { this.open = !this.open; }

  render() {
    const s = STATUS[this.state];
    const words = pillWords(this.state, this.count);
    const text = this.scope ? scopeText({ kind: this.scope, id: this.scopeId, name: this.name }) : undefined;
    // one label while a scope is set, worded like the scope line's: the lock is said, not read as a glyph
    const label = text ? `scope: ${[text, this.locked ? 'locked' : '', s.pill ? words : ''].filter(Boolean).join(', ')}` : nothing;
    return html`
      <span class="button" part="button" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded=${this.open} aria-label=${label}
        @click=${this.toggle} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggle(); } }}>
        <span class="dot" data-kind=${text ? 'scope' : s.dot} ?data-pulse=${!!s.pulse}></span>
        ${text ? html`<span class="words">${text}</span>${this.locked ? html`<span class="lock">${SCOPE_LOCK}</span>` : nothing}` : html`<slot></slot>`}
        ${s.pill ? html`<sett-pill kind=${s.pill} session=${this.session ?? ''}>${words}</sett-pill>` : nothing}
        <span class="car">▾</span>
      </span>
      <div class="menu"><slot name="menu"></slot></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-selector': SettSelector }
}
