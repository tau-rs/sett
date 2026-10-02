import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type OpKind = 'route' | 'rpc' | 'schema' | 'table' | 'flag' | 'text' | 'more';
const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

/**
 * One operation under a port in a rail: a route (method chip · path · return
 * or `→ handler`), an rpc (`name(args) → out`), a schema line, a table, a cli
 * flag, plain text, or the `… n more` fold line. One row = `map.size.opRow`.
 *
 * @slot - the text of a schema, table, text or rpc-args row
 * @fires sett-select - `{ kind, path }` when a row with a handler or a route is clicked
 * @fires sett-expand - from the `more` row
 * @csspart method - the method chip
 */
@customElement('sett-op-row')
export class SettOpRow extends LitElement {
  /** the name a `sett-link` ends on (`from` / `to`); the sheet also accepts `data-id` */
  @property({ reflect: true }) key?: string;
  @property({ reflect: true }) kind: OpKind = 'text';
  /** GET · POST · PUT · PATCH · DELETE for a route; the flag itself (`-i`) for a flag */
  @property() method?: string;
  /** the route path, the rpc name, or the flag's description */
  @property() path?: string;
  /** what comes back, shown mute after the path when there is no handler */
  @property() returns?: string;
  /** the item that handles the route; shown as `→ handler` in sel and reflected as `has-handler` */
  @property() handler?: string;
  /** hidden rows behind a `more` row */
  @property({ type: Number }) count = 0;
  @property({ type: Boolean, reflect: true }) selected = false;

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--sett-space-2);
      height: var(--sett-map-size-op-row);
      padding: 0 var(--sett-space-1) 0 var(--sett-space-4);
      border-radius: var(--sett-map-radius-item);
      font-family: var(--sett-font-mono);
      font-size: var(--sett-font-size-sm);
      color: var(--sett-color-ink);
      white-space: nowrap;
      overflow: hidden;
      box-sizing: border-box;
    }
    :host([hidden]) { display: none; }
    :host([has-handler]), :host([kind='route']), :host([kind='more']) { cursor: pointer; }
    :host([has-handler]:hover), :host([kind='more']:hover) { background: var(--sett-color-well); }
    :host([selected]) { background: var(--sett-color-sel-bg); }
    :host([kind='more']) { color: var(--sett-color-mute); font-family: var(--sett-font-sans); }
    :host([kind='more']:hover) { color: var(--sett-color-sel); }
    .m { flex: 0 0 var(--sett-map-size-method-column); font-weight: var(--sett-map-method-weight); font-size: var(--sett-map-method-size); color: var(--sett-color-ink2); }
    .m.get { color: var(--sett-map-method-get); } .m.post { color: var(--sett-map-method-post); } .m.put { color: var(--sett-map-method-put); }
    .m.patch { color: var(--sett-map-method-patch); } .m.delete { color: var(--sett-map-method-delete); } .m.flag { color: var(--sett-color-ok); }
    .p { overflow: hidden; text-overflow: ellipsis; }
    .p i { font-style: normal; color: var(--sett-color-ink2); }
    .rt { color: var(--sett-color-mute); overflow: hidden; text-overflow: ellipsis; }
    .sc { color: var(--sett-color-ink2); font-size: var(--sett-font-size-xs); overflow: hidden; text-overflow: ellipsis; }
    .hd2 { margin-left: auto; color: var(--sett-color-sel); font-size: var(--sett-font-size-xs); flex: 0 0 auto; }
  `;

  willUpdate() {
    this.toggleAttribute('has-handler', !!this.handler);
  }

  private select() {
    if (this.kind === 'more') { this.dispatchEvent(new CustomEvent('sett-expand', { bubbles: true, composed: true })); return; }
    if (this.kind === 'route' || this.handler) this.dispatchEvent(new CustomEvent('sett-select', { bubbles: true, composed: true, detail: { kind: this.kind, path: this.path, handler: this.handler } }));
  }

  render() {
    const tail = this.handler ? html`<span class="hd2">→ ${this.handler}</span>` : this.returns ? html`<span class="rt">${this.returns}</span>` : nothing;
    let body;
    switch (this.kind) {
      case 'route': { const m = (this.method ?? '').toLowerCase(); body = html`<b class="m ${METHODS.includes(m) ? m : ''}" part="method">${this.method}</b><span class="p" title=${this.path ?? ''}>${this.path}</span>${tail}`; break; }
      case 'flag': body = html`<b class="m flag" part="method">${this.method}</b><span class="p">${this.path}</span>`; break;
      case 'rpc': body = html`<span class="p">${this.path}<i>(<slot></slot>)</i></span>${this.returns ? html`<span class="rt">→ ${this.returns}</span>` : nothing}`; break;
      case 'schema': body = html`<span class="sc"><slot></slot></span>`; break;
      case 'table': body = html`<span class="p">▤ <slot></slot></span>`; break;
      case 'more': body = html`… ${this.count} more`; break;
      default: body = html`<span class="rt"><slot></slot></span>`;
    }
    return html`<div class="row" style="display:contents" @click=${this.select}>${body}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-op-row': SettOpRow }
}
