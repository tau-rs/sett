import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type ColumnKind = 'driving' | 'domain' | 'driven' | 'layer';
export const COLUMN_KINDS: ColumnKind[] = ['driving', 'domain', 'driven', 'layer'];

/**
 * A tinted band inside an open unit, holding areas. In a hexagon the three
 * columns are driving (what calls in), domain (the core) and driven (what is
 * called out to); a layered unit has one `layer` column per layer. Externals
 * are never a column: they are ports on the needs rail (rule 6).
 *
 * @slot - `sett-area` children, stacked by normal flow
 * @csspart header - the column's label
 */
@customElement('sett-column')
export class SettColumn extends LitElement {
  @property({ reflect: true }) kind: ColumnKind = 'domain';
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
