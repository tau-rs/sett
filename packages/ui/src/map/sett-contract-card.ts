import { LitElement, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { PORT_KINDS, type PortKind } from './sett-port-row.js';
import '../tag/sett-tag.js';

/** who uses a contract, and how: `['api', 'insert · update · select']` */
export type ContractUse = [who: string, how?: string];

/**
 * What a port promises: the kind chip (the kind's dot and word, the same
 * colour as on the port row), the name, the owner, then `format · witness`,
 * the ops in mono on the well tint, the schema, who uses it, and the notes.
 * A part with nothing to say is absent. Every contract cites a witness
 * `file:line` (map rule 10); one without is `declared`: dashed, and it says so.
 *
 * One skeleton for every kind; the card never animates and holds no verb.
 *
 * @csspart chip - the kind chip
 * @csspart ops - the ops block
 */
@customElement('sett-contract-card')
export class SettContractCard extends LitElement {
  /** the port kind, from the kind table (`PORT_KINDS`) */
  @property({ reflect: true }) kind: PortKind = 'crate';
  @property() name = '';
  /** who owns the contract: a unit, a repo, or `external` */
  @property() owner = '';
  /** how it is written down: `actix-web App · 12 routes` */
  @property() format?: string;
  /** where it is stated in code, `file:line`, several separated by ` · `; none means declared by hand */
  @property() witness?: string;
  /** one line per operation, as written in the contract */
  @property({ attribute: false }) ops: string[] = [];
  /** the shape it carries, one line */
  @property() schema?: string;
  /** who uses it, and how */
  @property({ attribute: false }) used: ContractUse[] = [];
  @property() notes?: string;

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      padding: var(--sett-space-2) var(--sett-space-3) var(--sett-space-3);
      border: var(--sett-stroke-hair) solid var(--sett-color-line);
      border-radius: var(--sett-radius-card);
      background: var(--sett-color-paper);
      color: var(--sett-color-ink);
      font-family: var(--sett-font-sans);
      font-size: var(--sett-font-size-base);
      line-height: var(--sett-font-line-height-ui);
    }
    :host([declared]) { border-style: dashed; }
    ${unsafeCSS(PORT_KINDS.map((k) => `:host([kind='${k}']) { --_kind: var(--sett-map-kind-${k}-color); }`).join('\n'))}
    .head { display: flex; align-items: center; gap: var(--sett-space-2); min-width: 0; }
    .chip {
      display: inline-flex; align-items: center; gap: var(--sett-space-1); flex: none;
      padding: 0 var(--sett-space-1);
      border: var(--sett-stroke-hair) solid var(--sett-color-line);
      border-radius: var(--sett-radius-chip);
      font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-ink2);
    }
    .dot { width: var(--sett-map-size-dot); height: var(--sett-map-size-dot); border-radius: 50%; background: var(--_kind); }
    .name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: var(--sett-font-weight-medium); }
    .line { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--sett-space-1); margin-top: var(--sett-space-1); color: var(--sett-color-ink2); }
    .k { color: var(--sett-color-mute); }
    sett-tag { max-width: 100%; box-sizing: border-box; overflow: hidden; text-overflow: ellipsis; }
    h6 { margin: var(--sett-space-2) 0 var(--sett-space-1); font-size: var(--sett-font-size-xs); font-weight: var(--sett-font-weight-normal); color: var(--sett-color-mute); }
    .ops, .schema {
      margin: 0; padding: var(--sett-space-1) var(--sett-space-2);
      border-radius: var(--sett-radius-item);
      background: var(--sett-color-well);
      color: var(--sett-color-ink);
      font-family: var(--sett-font-mono); font-size: var(--sett-font-size-md); line-height: var(--sett-font-line-height-code);
      white-space: pre-wrap; overflow-wrap: anywhere;
    }
    .ops div { padding-left: var(--sett-space-3); text-indent: calc(-1 * var(--sett-space-3)); }
    .use { display: flex; align-items: baseline; gap: var(--sett-space-2); }
    .use .who { flex: none; font-family: var(--sett-font-mono); font-size: var(--sett-font-size-md); }
    .use .how { min-width: 0; color: var(--sett-color-ink2); }
    .notes { margin: 0; color: var(--sett-color-ink2); }
  `;

  willUpdate() {
    // a contract with no witness is declared by hand, whatever its kind
    this.toggleAttribute('declared', this.kind === 'declared' || !this.witness);
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
    this.setAttribute('aria-label', `contract · ${this.name}`);
  }

  render() {
    const sep = html`<span class="k">·</span>`;
    return html`
      <div class="head"><span class="chip" part="chip"><span class="dot"></span>${this.kind}</span><span class="name">${this.name}</span></div>
      ${this.owner ? html`<div class="line"><span class="k">owner</span><span>${this.owner}</span></div>` : nothing}
      <div class="line">
        ${this.format ? html`<span>${this.format}</span>${sep}` : nothing}
        ${this.witness ? this.witness.split(' · ').map((w) => html`<sett-tag mono>${w}</sett-tag>`) : html`<span>${this.kind === 'declared' ? 'no witness' : 'declared · no witness'}</span>`}
      </div>
      ${this.ops.length ? html`<h6>ops</h6><div class="ops" part="ops">${this.ops.map((o) => html`<div>${o}</div>`)}</div>` : nothing}
      ${this.schema ? html`<h6>schema</h6><div class="schema">${this.schema}</div>` : nothing}
      ${this.used.length ? html`<h6>used by</h6>${this.used.map(([who, how]) => html`<div class="use"><span class="who">${who}</span>${how ? html`<span class="how">${how}</span>` : nothing}</div>`)}` : nothing}
      ${this.notes ? html`<h6>notes</h6><p class="notes">${this.notes}</p>` : nothing}`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-contract-card': SettContractCard }
}
