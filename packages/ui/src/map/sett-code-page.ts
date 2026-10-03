import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/** `[n, text, state?]`: `hl` is the item's own span, `bad` the line a finding points at */
export type CodeLine = [n: number, text: string, state?: 'hl' | 'bad'];
/** a way out of the page: `[key, label]`, the item at the other end of a call */
export type CodePortal = [key: string, label: string];
export type CodePortalSide = 'callers' | 'calls';

/**
 * The page around the code of an item, in a tab of `sett-tabbar` (map rule
 * 4). It is not an editor (rule 12: the editor is Theia's): it is the head
 * (`file:line`, the unit) and the two portals, `callers` and `calls`, each a
 * row of pills that lead to the item at the other end of a call.
 *
 * The body is the host's: in Theia, put the editor in the default slot and
 * mark its lines through the decoration classes of `editor.css`
 * (`sett-ed-line`, `sett-ed-line--bad`). With nothing slotted the body is a
 * read-only listing of `lines`: numbers, the item's span highlighted, a bad
 * line tinted with `⚠` in its gutter. No caret, no selection model, no
 * syntax engine. Pointing eases a portal's border (`motion.hover`).
 *
 * @slot - the host's editor; replaces the listing
 * @fires sett-portal - `{ key, side }` when a portal is chosen
 * @csspart head - the file line and the portals
 * @csspart body - the listing, or the slotted editor
 */
@customElement('sett-code-page')
export class SettCodePage extends LitElement {
  @property() file = '';
  /** the line the item starts at */
  @property({ type: Number }) line?: number;
  /** the unit the item lives in */
  @property() unit?: string;
  @property({ attribute: false }) lines: CodeLine[] = [];
  @property({ attribute: false }) callers: CodePortal[] = [];
  @property({ attribute: false }) calls: CodePortal[] = [];

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      background: var(--sett-map-surface-code);
      color: var(--sett-color-ink);
      font-family: var(--sett-font-sans);
      font-size: var(--sett-font-size-base);
    }
    .head { flex: none; padding: var(--sett-space-2) var(--sett-space-3); border-bottom: var(--sett-stroke-hair) solid var(--sett-color-line2); }
    .where { display: flex; align-items: baseline; gap: var(--sett-space-2); white-space: nowrap; }
    .file { min-width: 0; overflow: hidden; text-overflow: ellipsis; font-family: var(--sett-font-mono); font-weight: var(--sett-font-weight-medium); }
    .unit, .k, .none { color: var(--sett-color-mute); }
    .side { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sett-space-1); margin-top: var(--sett-space-1); }
    .k { width: calc(var(--sett-space-6) * 2); flex: none; font-size: var(--sett-font-size-sm); }
    .none { font-size: var(--sett-font-size-sm); }
    button {
      box-sizing: border-box;
      height: var(--sett-map-size-item-row);
      margin: 0; padding: 0 var(--sett-space-2);
      border: var(--sett-stroke-hair) solid var(--sett-color-line);
      border-radius: var(--sett-radius-chip);
      background: var(--sett-color-paper);
      color: var(--sett-color-ink);
      font-family: var(--sett-font-mono); font-size: var(--sett-font-size-md);
      white-space: nowrap;
      cursor: pointer;
      transition: border-color var(--sett-motion-hover) ease;
    }
    button:hover { border-color: var(--sett-color-ink2); }
    button:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: var(--sett-stroke-hair); }
    .body { flex: 1; min-height: 0; overflow: auto; }
    .body:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: calc(-1 * var(--sett-stroke-lit)); }
    .code { display: inline-block; min-width: 100%; box-sizing: border-box; padding: var(--sett-space-1) 0; font-family: var(--sett-font-mono); font-size: var(--sett-font-size-md); line-height: var(--sett-font-line-height-code); }
    .ln { display: flex; align-items: baseline; white-space: pre; padding-right: var(--sett-space-3); }
    .g { width: var(--sett-space-4); flex: none; text-align: center; font-family: var(--sett-font-sans); font-size: var(--sett-font-size-xs); color: var(--sett-color-bad); }
    .n { width: var(--sett-space-6); flex: none; margin-right: var(--sett-space-3); text-align: right; color: var(--sett-color-mute); user-select: none; }
    .ln.hl { background: var(--sett-editor-line); }
    .ln.bad { background: var(--sett-color-bad-bg); }
    .ln.bad .n { color: var(--sett-color-ink2); }
    .ln.bad .g::before { content: var(--sett-glyph-finding); }
    @media (prefers-reduced-motion: reduce) { button { transition: none; } }
  `;

  private go(key: string, side: CodePortalSide) {
    this.dispatchEvent(new CustomEvent('sett-portal', { detail: { key, side }, bubbles: true, composed: true }));
  }

  willUpdate() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
    this.setAttribute('aria-label', `code · ${this.where}`);
  }
  private get where() { return this.line === undefined ? this.file : `${this.file}:${this.line}`; }

  private side(side: CodePortalSide, portals: CodePortal[]) {
    return html`<div class="side" role="group" aria-label=${side}>
      <span class="k">${side}</span>
      ${portals.length ? portals.map(([key, label]) => html`<button type="button" @click=${() => this.go(key, side)}>${label}</button>`) : html`<span class="none">none</span>`}
    </div>`;
  }

  render() {
    return html`
      <div class="head" part="head">
        <div class="where"><span class="file">${this.where}</span>${this.unit ? html`<span class="unit">${this.unit}</span>` : nothing}</div>
        ${this.side('callers', this.callers)}
        ${this.side('calls', this.calls)}
      </div>
      <div class="body" part="body" tabindex="0" role="group" aria-label="code">
        <slot><div class="code">${this.lines.map(([n, text, state]) => html`<div class="ln ${state ?? ''}"><span class="g" aria-hidden="true"></span><span class="n">${n}</span><span class="t">${text}</span></div>`)}</div></slot>
      </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-code-page': SettCodePage }
}
