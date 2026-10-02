import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type ColumnKind = 'driving' | 'domain' | 'driven' | 'layer';
export const COLUMN_KINDS: ColumnKind[] = ['driving', 'domain', 'driven', 'layer'];
/** where a layer sits: the public API, the internals, the leaves */
export type ColumnDepth = 'api' | 'internal' | 'leaf';
export const COLUMN_DEPTHS: ColumnDepth[] = ['api', 'internal', 'leaf'];

/**
 * A tinted band inside an open unit, holding areas. In a hexagon the three
 * columns are driving (what calls in), domain (the core) and driven (what is
 * called out to); a layered unit has one `layer` column per layer, public API
 * first and leaves last, so "uses" points left to right under both rules
 * (rule 11). A layer has no tint of its own: its `depth` takes the driving
 * tint (`api`), the domain tint (`internal`) or the driven tint (`leaf`).
 * Externals are never a column: they are ports on the needs rail (rule 6).
 *
 * @slot - `sett-area` children, stacked by normal flow
 * @csspart header - the column's label
 */
@customElement('sett-column')
export class SettColumn extends LitElement {
  @property({ reflect: true }) kind: ColumnKind = 'domain';
  /** a `layer` column's place by depth, which picks its tint; other kinds ignore it */
  @property({ reflect: true }) depth: ColumnDepth = 'internal';
  /** e.g. `routes · driving`; the kind is appended when the label does not already say it */
  @property() label = '';

  static styles = css`
    :host {
      display: block;
      flex: 0 0 auto;
      box-sizing: border-box;
      width: var(--sett-map-size-column);
      padding-bottom: var(--sett-space-2);
      border-radius: var(--sett-radius-node);
      background: var(--sett-color-well);
      color: var(--sett-color-ink);
      font-family: var(--sett-font-sans);
      font-size: var(--sett-font-size-base);
    }
    :host([kind='driving']) { background: var(--sett-map-surface-driving); }
    :host([kind='domain']) { background: var(--sett-map-surface-domain); }
    :host([kind='driven']) { background: var(--sett-map-surface-driven); }
    :host([kind='layer']) { background: var(--sett-map-surface-domain); }
    :host([kind='layer'][depth='api']) { background: var(--sett-map-surface-driving); }
    :host([kind='layer'][depth='leaf']) { background: var(--sett-map-surface-driven); }
    .ch { display: flex; align-items: center; gap: var(--sett-space-2); box-sizing: border-box; height: var(--sett-map-size-area-folded); padding: 0 var(--sett-space-3); white-space: nowrap; overflow: hidden; }
    b { font-weight: var(--sett-font-weight-semibold); overflow: hidden; text-overflow: ellipsis; }
    em { font-style: normal; color: var(--sett-color-mute); }
    ::slotted(sett-area) { margin: 0 var(--sett-space-2) var(--sett-space-3); }
    ::slotted(sett-area:last-child) { margin-bottom: 0; }
  `;

  render() {
    const sayKind = this.kind !== 'layer' && !this.label.includes(this.kind);
    return html`<div class="ch" part="header"><b>${this.label || this.kind}</b>${sayKind && this.label ? html`<em>${this.kind}</em>` : nothing}</div><slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-column': SettColumn }
}
