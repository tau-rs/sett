import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SCOPE_LOCK, scopeStyles, scopeText, scopeWords, type Scope, type ScopeKind } from '../scope.js';
import type { SessionId } from '../session.js';

/**
 * The scope line: the first row of the left pane, saying what the shell is
 * about (DESIGN.md "The shell" rule 3). A dot in the scope's colour on the
 * scope's tint, the words from `scopeWords`, an optional muted note on the
 * right, and `🔒` when the scope is locked. An indicator, never a control: no
 * button, no event, nothing to focus. It is read as one label, e.g.
 * `scope: w1 · refund flow, locked`.
 */
@customElement('sett-scope-line')
export class SettScopeLine extends LitElement {
  /** what the shell is about */
  @property({ reflect: true }) scope: ScopeKind = 'main';

  /** session id when the scope is a session; unknown ids fall back to yk */
  @property({ reflect: true }) session?: SessionId;

  /** the worktree id of a session scope, e.g. `w1` */
  @property({ attribute: 'scope-id' }) scopeId?: string;

  /** what the scope is called: `refund flow`, `fix-pool-size` */
  @property() name?: string;

  /** a muted note at the right, e.g. `as on disk` */
  @property() sub?: string;

  /** the focus is pinned: shows 🔒 after the words */
  @property({ type: Boolean, reflect: true }) locked = false;

  static styles = [
    scopeStyles,
    css`
      :host {
        display: flex;
        align-items: center;
        gap: var(--sett-space-2);
        box-sizing: border-box;
        min-width: 0;
        padding: var(--sett-space-1) var(--sett-space-2);
        line-height: var(--sett-space-4);
        border-radius: var(--sett-radius-chip);
        background: var(--_scope-bg);
        color: var(--sett-color-ink2);
        font-family: var(--sett-font-sans);
        font-size: var(--sett-font-size-base);
        white-space: nowrap;
      }
      .dot { flex: none; width: var(--sett-space-2); height: var(--sett-space-2); border-radius: var(--sett-radius-chip); background: var(--_scope); }
      .words { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
      .head { font-family: var(--sett-font-mono); font-weight: var(--sett-font-weight-semibold); color: var(--sett-color-ink); }
      .end { flex: none; margin-left: auto; display: inline-flex; align-items: center; gap: var(--sett-space-2); }
      .sub { font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); }
      .lock { font-size: var(--sett-font-size-sm); }
    `,
  ];

  private get value(): Scope { return { kind: this.scope, id: this.scopeId, name: this.name, locked: this.locked }; }

  connectedCallback() {
    super.connectedCallback();
    // one label for the whole line: the words inside are its picture, not a second reading
    this.setAttribute('role', 'img');
  }
  willUpdate() {
    this.setAttribute('aria-label', `scope: ${[scopeText(this.value), this.sub, this.locked ? 'locked' : ''].filter(Boolean).join(', ')}`);
  }

  render() {
    const { head, tail } = scopeWords(this.value);
    return html`<span class="dot"></span><span class="words"><b class="head">${head}</b>${tail ? ` · ${tail}` : nothing}</span>${this.sub || this.locked
      ? html`<span class="end">${this.sub ? html`<span class="sub">${this.sub}</span>` : nothing}${this.locked ? html`<span class="lock">${SCOPE_LOCK}</span>` : nothing}</span>`
      : nothing}`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-scope-line': SettScopeLine }
}
