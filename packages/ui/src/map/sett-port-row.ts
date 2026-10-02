import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { base } from '@tau-rs/sett-tokens';
import './sett-op-row.js';

export type PortKind = 'rpc' | 'http' | 'cli' | 'topic' | 'crate' | 'sql' | 'pub' | 'redis' | 'fs' | 'tty' | 'declared';
export type PortSide = 'exposes' | 'needs';
export const PORT_KINDS: PortKind[] = ['rpc', 'http', 'cli', 'topic', 'crate', 'sql', 'pub', 'redis', 'fs', 'tty', 'declared'];

/**
 * One port of a unit: the dot on the border (the kind's colour), then
 * `kind · name · count`. On the `exposes` side the dot is on the left; on
 * `needs` the row mirrors and the dot is on the right. Op rows go in the
 * default slot; past `fold` of them a `… n more` row appears until expanded.
 *
 * @slot - `sett-op-row` children (a rail shows them; a card's rows have none)
 * @fires sett-select - `{ kind, name, side }` when the row is clicked
 * @csspart dot - the border dot
 * @csspart row - the kind · name · count line
 */
@customElement('sett-port-row')
export class SettPortRow extends LitElement {
  /** the name a `sett-link` ends on (`from` / `to`); the sheet also accepts `data-id` */
  @property({ reflect: true }) key?: string;
  @property({ reflect: true }) kind: PortKind = 'crate';
  @property() name = '';
  /** a count or short fact, mono, tabular */
  @property() count?: string;
  @property({ reflect: true }) side: PortSide = 'exposes';
  /** the contract's format, shown mute at the far end (rails only) */
  @property() format?: string;
  /** op rows shown before `… n more` */
  @property({ type: Number }) fold: number = Number(base.map.threshold.opFold);
  @property({ type: Boolean, reflect: true }) selected = false;
  /** compact density: `map.size.portRowCompact` */
  @property({ type: Boolean, reflect: true }) compact = false;
  @property({ type: Boolean, reflect: true }) expanded = false;

  @state() private hiddenOps = 0;

  static styles = css`
    :host { display: block; position: relative; font-family: var(--sett-font-mono); font-size: var(--sett-font-size-md); color: var(--sett-color-ink); }
    .row {
      display: flex; align-items: center; gap: var(--sett-space-2);
      height: var(--sett-map-size-port-row);
      padding: 0 var(--sett-space-1);
      border-radius: var(--sett-map-radius-item);
      white-space: nowrap; overflow: hidden; cursor: pointer;
      box-sizing: border-box;
    }
    :host([compact]) .row { height: var(--sett-map-size-port-row-compact); }
    :host([side='needs']) .row { flex-direction: row-reverse; text-align: right; }
    .row:hover { background: var(--sett-color-well); }
    :host([selected]) .row { background: var(--sett-color-sel-bg); }
    .dot {
      position: absolute; top: calc(var(--sett-map-size-port-row) / 2);
      width: var(--sett-map-size-dot); height: var(--sett-map-size-dot);
      margin-top: calc(var(--sett-map-size-dot) / -2);
      border-radius: 50%; box-sizing: border-box;
      border: var(--sett-map-size-dot-border) solid var(--sett-color-paper);
      box-shadow: 0 0 0 var(--sett-map-size-dot-ring) var(--sett-color-line);
      background: var(--_kind);
    }
    :host([compact]) .dot { top: calc(var(--sett-map-size-port-row-compact) / 2); }
    :host([side='exposes']) .dot { left: var(--sett-port-dot-offset, calc(var(--sett-map-size-dot) / -2)); }
    :host([side='needs']) .dot { right: var(--sett-port-dot-offset, calc(var(--sett-map-size-dot) / -2)); }
    .k { font-style: normal; color: var(--sett-color-mute); font-size: var(--sett-font-size-xs); }
    .nm { overflow: hidden; text-overflow: ellipsis; }
    .ct { color: var(--sett-color-ink2); font-size: var(--sett-font-size-sm); font-variant-numeric: tabular-nums; }
    .fm { margin-left: auto; font-family: var(--sett-font-sans); font-size: var(--sett-map-method-size); color: var(--sett-color-mute); }
    :host([side='needs']) .fm { margin-left: 0; margin-right: auto; }
    :host([kind='rpc']) { --_kind: var(--sett-map-kind-rpc-color); } :host([kind='http']) { --_kind: var(--sett-map-kind-http-color); }
    :host([kind='cli']) { --_kind: var(--sett-map-kind-cli-color); } :host([kind='topic']) { --_kind: var(--sett-map-kind-topic-color); }
    :host([kind='crate']) { --_kind: var(--sett-map-kind-crate-color); } :host([kind='sql']) { --_kind: var(--sett-map-kind-sql-color); }
    :host([kind='pub']) { --_kind: var(--sett-map-kind-pub-color); } :host([kind='redis']) { --_kind: var(--sett-map-kind-redis-color); }
    :host([kind='fs']) { --_kind: var(--sett-map-kind-fs-color); } :host([kind='tty']) { --_kind: var(--sett-map-kind-tty-color); }
    :host([kind='declared']) { --_kind: var(--sett-map-kind-declared-color); }
    :host([kind='declared']) .nm { color: var(--sett-color-ink2); }
  `;

  private select() {
    this.dispatchEvent(new CustomEvent('sett-select', { bubbles: true, composed: true, detail: { kind: this.kind, name: this.name, side: this.side } }));
  }

  private applyFold() {
    const ops = Array.from(this.querySelectorAll(':scope > sett-op-row'));
    let hidden = 0;
    ops.forEach((op, i) => { const hide = !this.expanded && i >= this.fold; op.toggleAttribute('hidden', hide); if (hide) hidden++; });
    this.hiddenOps = hidden;
  }

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('fold') || changed.has('expanded')) this.applyFold();
  }
  firstUpdated() { this.applyFold(); }

  render() {
    return html`
      <div class="row" part="row" @click=${this.select}>
        <i class="dot" part="dot"></i>
        <i class="k">${this.kind}</i>
        <span class="nm">${this.name}</span>
        ${this.count ? html`<span class="ct">${this.count}</span>` : nothing}
        ${this.format ? html`<span class="fm">${this.format}</span>` : nothing}
      </div>
      <slot @slotchange=${this.applyFold}></slot>
      ${this.hiddenOps ? html`<sett-op-row kind="more" .count=${this.hiddenOps} @sett-expand=${() => { this.expanded = true; }}></sett-op-row>` : nothing}`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-port-row': SettPortRow }
}
