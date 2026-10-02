import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';

/** what a row of the left pane names, in the detail of its events */
export type RowKind = 'session' | 'group' | 'agent' | 'file' | 'changes' | 'folder' | 'area' | 'item' | 'commit';

/** the status letters of a changed file, as git writes them */
export type StatusLetter = 'M' | 'A' | 'D' | 'R' | '?';

/**
 * The row rhythm of the left pane: one line of `space.6` (24), indented by
 * `space.3` per depth, a chevron column, a name that ends in an ellipsis, and
 * a mono muted cell at the right. Selected takes the sel tint; dim is a name
 * in mute. The host is the tree item and takes focus; the line inside it is
 * `.row`, so a folded row's children sit under it, not inside it.
 */
export const rowStyles = css`
  :host { display: block; font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); color: var(--sett-color-ink2); outline: none; }
  :host([hidden]) { display: none; }
  .row {
    display: flex;
    align-items: center;
    gap: var(--sett-space-2);
    box-sizing: border-box;
    height: var(--sett-space-6);
    padding: 0 var(--sett-space-3);
    padding-left: calc(var(--sett-space-3) * (1 + var(--_depth, 0)));
    white-space: nowrap;
    cursor: pointer;
  }
  :host([selected]) .row { background: var(--sett-color-sel-bg); }
  :host(:focus-visible) .row { box-shadow: inset 0 0 0 var(--sett-stroke-lit) var(--sett-color-sel); }
  .cv { flex: none; width: var(--sett-space-3); color: var(--sett-color-mute); font-size: var(--sett-font-size-xs); text-align: center; }
  .nm { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  :host([dim]) .nm { color: var(--sett-color-mute); }
  .mt { flex: none; margin-left: auto; max-width: 48%; overflow: hidden; text-overflow: ellipsis; font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-mute); }
  .ok { color: var(--sett-color-ok); }
  .kids { display: block; }
`;

/**
 * The status letter of a changed file: `M` sug, `A` ok, `D` bad, `R` plain,
 * `?` mute. On a selected row the letter goes ink: bad on the sel tint falls
 * under 4.5:1 in dark.
 */
export const letterStyles = css`
  .sl { flex: none; width: var(--sett-space-3); font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); font-weight: var(--sett-font-weight-medium); text-align: center; color: var(--sett-color-ink2); }
  .sl[data-letter='M'] { color: var(--sett-color-sug); }
  .sl[data-letter='A'] { color: var(--sett-color-ok); }
  .sl[data-letter='D'] { color: var(--sett-color-bad); }
  .sl[data-letter='?'] { color: var(--sett-color-mute); }
  :host([selected]) .sl { color: var(--sett-color-ink); }
`;

/** a row's event, built outside the class so the manifest lists the rows' real events, not a `type` */
const rowEvent = (type: string, detail: Record<string, unknown>) => new CustomEvent(type, { bubbles: true, composed: true, detail });

/**
 * A row of the left pane: a tree item with a depth, a selection and a fold.
 * It never changes its own `selected` or `open`: a click fires `sett-select`,
 * the chevron fires `sett-fold` with the state asked for, Enter or a double
 * click fires `sett-open` (a session row: `sett-focus`), Space fires
 * `sett-select`. Every detail carries `{ kind, name }`. Arrow keys belong to
 * the tree that holds the rows (tree.ts).
 */
export abstract class SettRow extends LitElement {
  /** what the row names */
  @property() name = '';

  /** nesting from 0; `space.3` of indent per level */
  @property({ type: Number, reflect: true }) depth = 0;

  /** the row the inspector is about: the sel tint */
  @property({ type: Boolean, reflect: true }) selected = false;

  /** a row that is not part of what matters here: name in mute */
  @property({ type: Boolean, reflect: true }) dim = false;

  /** children shown (foldable rows only) */
  @property({ type: Boolean, reflect: true }) open = false;

  abstract readonly kind: RowKind;

  /** a row with a chevron and children */
  get foldable(): boolean { return false; }

  /** what every event of this row says */
  protected get detail(): Record<string, unknown> { return { kind: this.kind, name: this.name }; }

  protected fire(type: string, extra: Record<string, unknown> = {}) {
    this.dispatchEvent(rowEvent(type, { ...this.detail, ...extra }));
  }

  /** the app's selection: a click, or Space */
  select() { this.fire('sett-select'); }

  /** Enter or a double click: open what the row names */
  activate() { this.fire('sett-open'); }

  /** the chevron, or Left/Right: asks for the other state */
  fold() { if (this.foldable) this.fire('sett-fold', { open: !this.open }); }

  private onClick = (e: Event) => { if (!e.defaultPrevented) this.select(); };
  private onDblClick = (e: Event) => { if (!e.defaultPrevented) this.activate(); };
  private onKey = (e: KeyboardEvent) => {
    if (e.target !== this) return;
    if (e.key === 'Enter') { e.preventDefault(); this.activate(); }
    else if (e.key === ' ') { e.preventDefault(); this.select(); }
  };
  /** the chevron is the fold and nothing else: its clicks never select or open the row */
  private onChevron = (e: Event) => { e.preventDefault(); e.stopPropagation(); if (e.type === 'click') this.fold(); };

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'treeitem');
    if (!this.hasAttribute('tabindex')) this.tabIndex = -1;
    this.addEventListener('click', this.onClick);
    this.addEventListener('dblclick', this.onDblClick);
    this.addEventListener('keydown', this.onKey);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('dblclick', this.onDblClick);
    this.removeEventListener('keydown', this.onKey);
  }
  updated() {
    this.style.setProperty('--_depth', String(this.depth));
    this.setAttribute('aria-level', String(this.depth + 1));
    if (this.foldable) this.setAttribute('aria-expanded', String(this.open)); else this.removeAttribute('aria-expanded');
    if (this.selected) this.setAttribute('aria-selected', 'true'); else this.removeAttribute('aria-selected');
  }

  /** the chevron column: a glyph on a foldable row, kept empty otherwise so names align */
  protected chevron() {
    return html`<span class="cv" aria-hidden="true" @click=${this.onChevron} @dblclick=${this.onChevron}>${this.foldable ? (this.open ? '▾' : '▸') : ''}</span>`;
  }

  /** the children, rendered only while open */
  protected kids() {
    return this.foldable && this.open ? html`<div class="kids" role="group"><slot></slot></div>` : nothing;
  }
}
