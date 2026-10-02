import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { NodeTier } from './tier.js';

export type { NodeTier } from './tier.js';
export { tierFor } from './tier.js';

/**
 * A unit's box on the board, at one of four tiers. The host sets the box and
 * the tier (from the on-screen width, see `tierFor`); the node never resizes
 * itself, the camera moves (rule 3). `mini` is the name only; `chip` adds the
 * meta lines and badges; `card` adds the port rows in two columns; `sheet`
 * hosts what is inside. A closed node has no foot and no link: opening is the
 * host's, by double-click or ↩ on the node and by nothing else (rule 4). An
 * open node keeps one link, `▴ close`.
 *
 * @slot - meta lines, one element each (`entry · hexagon`, `1 crate · 140 items`)
 * @slot badges - count badges in the head (a finding count, a session count)
 * @slot exposes - `sett-port-row side="exposes"` rows, left column of a card
 * @slot needs - `sett-port-row side="needs"` rows, right column of a card
 * @slot inside - the open unit (sheet tier)
 * @fires sett-open - `{ action: 'close' }` from `▴ close` on an open node; the node never asks to open
 * @csspart hd - the head: name · kind · badges
 * @csspart ports - the two-column port grid
 * @csspart foot - the foot of an open node: `▴ close`
 */
@customElement('sett-node')
export class SettNode extends LitElement {
  @property() name = '';
  /** app · library · external · … shown mute after the name */
  @property() kind = '';
  @property({ reflect: true }) tier: NodeTier = 'chip';
  /** the selection: sel border and ring */
  @property({ type: Boolean, reflect: true }) selected = false;
  /** the focused card: sel ring and the focus shadow, above its neighbours */
  @property({ type: Boolean, reflect: true }) focused = false;
  /** unrelated to the focus: recedes to mute ink and a faint border (text stays above 4.5:1; `map.far` opacity is for edges and dots) */
  @property({ type: Boolean, reflect: true }) far = false;
  /** declared by hand, nothing verified: dashed, secondary ink (rule 10) */
  @property({ type: Boolean, reflect: true }) declared = false;

  @state() private exposes = 0;
  @state() private needs = 0;

  static styles = css`
    :host {
      display: block; position: relative; box-sizing: border-box; overflow: visible;
      background: var(--sett-color-paper); color: var(--sett-color-ink);
      border: var(--sett-stroke-hair) solid var(--sett-color-line);
      border-radius: var(--sett-map-radius-node);
      font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); line-height: var(--sett-font-line-height-ui);
      user-select: none;
    }
    :host([selected]) { border-color: var(--sett-color-sel); box-shadow: 0 0 0 var(--sett-stroke-hair) var(--sett-color-sel); }
    :host([focused]) { border-color: var(--sett-color-sel); box-shadow: var(--sett-map-shadow-focus); z-index: 1; }
    :host([tier='sheet']) { box-shadow: var(--sett-map-shadow-card); }
    :host([tier='sheet'][focused]) { box-shadow: var(--sett-map-shadow-focus); }
    :host([far]) { color: var(--sett-color-mute); border-color: var(--sett-color-line2); }
    :host([far]) .hd em, :host([far]) .meta, :host([far]) .pcap, :host([far]) .ft a { color: var(--sett-color-mute); }
    :host([declared]) { border-style: dashed; color: var(--sett-color-ink2); }
    .hd { display: flex; align-items: baseline; gap: var(--sett-space-2); padding: var(--sett-space-2) var(--sett-space-2) 0; font-size: var(--sett-font-size-lg); white-space: nowrap; overflow: hidden; }
    :host([tier='card']) .hd, :host([tier='sheet']) .hd { padding: var(--sett-space-2) var(--sett-space-3) 0; }
    :host([tier='mini']) .hd { padding: var(--sett-space-1) var(--sett-space-2); font-size: var(--sett-font-size-md); }
    .hd b { font-weight: var(--sett-font-weight-semibold); overflow: hidden; text-overflow: ellipsis; }
    .hd em { font-style: normal; color: var(--sett-color-mute); font-size: var(--sett-font-size-sm); }
    .badges { margin-left: auto; display: flex; gap: var(--sett-space-1); }
    .meta { padding: 0 var(--sett-space-2); color: var(--sett-color-ink2); font-size: var(--sett-font-size-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
    :host([tier='card']) .meta, :host([tier='sheet']) .meta { padding: 0 var(--sett-space-3); }
    .meta ::slotted(*) { display: block; overflow: hidden; text-overflow: ellipsis; }
    .ports { display: grid; grid-template-columns: 1fr 1fr; column-gap: var(--sett-space-3); padding: var(--sett-space-1) var(--sett-space-3) 0; --sett-port-dot-offset: calc(-1 * (var(--sett-space-3) + var(--sett-map-size-dot) / 2)); }
    .col { min-width: 0; }
    .ports[hidden], .pcap[hidden] { display: none; }
    .pcap { display: flex; justify-content: space-between; padding: var(--sett-space-1) var(--sett-space-3) 0; font-size: var(--sett-font-size-xs); color: var(--sett-color-mute); }
    :host([tier='card']) .pcap { padding-bottom: var(--sett-space-2); }
    .inside { border-top: var(--sett-stroke-hair) solid var(--sett-color-line2); margin-top: var(--sett-space-2); padding: var(--sett-space-2) var(--sett-space-3); }
    .ft { display: flex; padding: var(--sett-space-1) var(--sett-space-3) var(--sett-space-1); font-size: var(--sett-font-size-sm); }
    .ft a { color: var(--sett-color-sel); cursor: pointer; }
  `;

  private close() {
    this.dispatchEvent(new CustomEvent('sett-open', { bubbles: true, composed: true, detail: { action: 'close' } }));
  }
  private count() {
    // its own port rows only: a sheet inside has rails in slots of the same name
    this.exposes = this.querySelectorAll(":scope > [slot='exposes']").length;
    this.needs = this.querySelectorAll(":scope > [slot='needs']").length;
  }
  firstUpdated() { this.count(); }

  render() {
    const rich = this.tier !== 'mini';
    const ports = this.tier === 'card' || this.tier === 'sheet';
    // an open unit whose inside brings its own rails does not list its ports a second time
    const bare = this.tier === 'sheet' && this.exposes + this.needs === 0;
    return html`
      <div class="hd" part="hd"><b>${this.name}</b>${rich && this.kind ? html`<em>${this.kind}</em>` : nothing}${rich ? html`<span class="badges"><slot name="badges"></slot></span>` : nothing}</div>
      ${rich ? html`<div class="meta">${this.declared ? html`declared · unverified` : html`<slot></slot>`}</div>` : nothing}
      ${ports ? html`
        <div class="ports" part="ports" ?hidden=${bare}>
          <div class="col"><slot name="exposes" @slotchange=${this.count}></slot></div>
          <div class="col"><slot name="needs" @slotchange=${this.count}></slot></div>
        </div>
        <div class="pcap" ?hidden=${bare}><span>exposes · ${this.exposes}</span><span>needs · ${this.needs}</span></div>` : nothing}
      ${this.tier === 'sheet' ? html`<div class="inside"><slot name="inside"></slot></div><div class="ft" part="foot"><a @click=${this.close}>▴ close</a></div>` : nothing}`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-node': SettNode }
}
