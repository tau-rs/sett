import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { NodeTier } from './tier.js';

export type { NodeTier } from './tier.js';
export { tierFor } from './tier.js';

/**
 * A unit's box on the board, at one of four tiers. The host sets the box and
 * the tier (from the on-screen width, see `tierFor`); the node never resizes
 * itself, the camera moves (rule 3). `mini` is the name only; `chip` adds the
 * meta lines and badges; `card` adds the port rows in two columns and the
 * foot; `sheet` hosts what is inside.
 *
 * @slot - meta lines, one element each (`entry · hexagon`, `1 crate · 140 items`)
 * @slot badges - count badges in the head (a finding count, a session count)
 * @slot exposes - `sett-port-row side="exposes"` rows, left column of a card
 * @slot needs - `sett-port-row side="needs"` rows, right column of a card
 * @slot inside - the open unit (sheet tier)
 * @fires sett-open - `{ action: 'open' | 'enter' | 'close' }` from the foot
 * @csspart hd - the head: name · kind · badges
 * @csspart ports - the two-column port grid
 * @csspart foot - the foot with the open / enter acts
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
    .pcap { display: flex; justify-content: space-between; padding: var(--sett-space-1) var(--sett-space-3) 0; font-size: var(--sett-font-size-xs); color: var(--sett-color-mute); }
    .inside { border-top: var(--sett-stroke-hair) solid var(--sett-color-line2); margin-top: var(--sett-space-2); padding: var(--sett-space-2) var(--sett-space-3); }
    .ft { display: flex; justify-content: space-between; padding: var(--sett-space-1) var(--sett-space-3) var(--sett-space-1); font-size: var(--sett-font-size-sm); }
    .ft a { color: var(--sett-color-sel); cursor: pointer; }
  `;

  private act(action: 'open' | 'enter' | 'close') {
    this.dispatchEvent(new CustomEvent('sett-open', { bubbles: true, composed: true, detail: { action } }));
  }
  private count() {
    this.exposes = this.querySelectorAll("[slot='exposes']").length;
    this.needs = this.querySelectorAll("[slot='needs']").length;
  }
  firstUpdated() { this.count(); }

  render() {
    const rich = this.tier !== 'mini';
    const ports = this.tier === 'card' || this.tier === 'sheet';
    return html`
      <div class="hd" part="hd"><b>${this.name}</b>${rich && this.kind ? html`<em>${this.kind}</em>` : nothing}${rich ? html`<span class="badges"><slot name="badges"></slot></span>` : nothing}</div>
      ${rich ? html`<div class="meta">${this.declared ? html`declared · unverified` : html`<slot></slot>`}</div>` : nothing}
      ${ports ? html`
        <div class="ports" part="ports">
          <div class="col"><slot name="exposes" @slotchange=${this.count}></slot></div>
          <div class="col"><slot name="needs" @slotchange=${this.count}></slot></div>
        </div>
        <div class="pcap"><span>exposes · ${this.exposes}</span><span>needs · ${this.needs}</span></div>` : nothing}
      ${this.tier === 'sheet' ? html`<div class="inside"><slot name="inside"></slot></div>` : nothing}
      ${ports ? html`<div class="ft" part="foot">
          ${this.tier === 'sheet' ? html`<a @click=${() => this.act('close')}>▴ close</a>` : html`<a @click=${() => this.act('open')}>▾ open · what is inside</a>`}
          <a @click=${() => this.act('enter')}>enter ›</a>
        </div>` : nothing}`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-node': SettNode }
}
