import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { base } from '@tau-rs/sett-tokens';
import { arrive, beatOf, durationMs, leave, presenceStyles } from './motion.js';
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
 * The head carries one dot per session with an agent on the unit (`sessions`).
 * A session that is working here now (`live`) breathes when this box is the
 * nearest thing you can see (DESIGN.md § Motion, "where it lands"): the unit
 * is closed, or it is open and no item of that session is rendered inside.
 * Open with the item on screen, the item (or the folded area's badge) carries
 * the life and the dot is still. When `live` flips, the node plays the
 * arrival or departure pulse on its box, the larger wave (`map.size.waveNode`).
 *
 * @slot - meta lines, one element each (`entry · hexagon`, `1 crate · 140 items`)
 * @slot badges - count badges in the head (a finding count); the session dots are the node's own
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
  /** the sessions with an agent on this unit, space-separated ids, one dot each in the head, in session order */
  @property() sessions = '';
  /** the sessions working here right now, space-separated: their dots breathe when the box is the nearest thing you can see; a change plays the pulse */
  @property() live = '';

  @state() private exposes = 0;
  @state() private needs = 0;
  @state() private igniting: string[] = [];
  private observer?: MutationObserver;

  static styles = [presenceStyles, css`
    :host {
      --_radius: var(--sett-map-radius-node);
      display: block; position: relative; box-sizing: border-box; overflow: visible;
      background: var(--sett-color-paper); color: var(--sett-color-ink);
      border: var(--sett-stroke-hair) solid var(--sett-color-line);
      border-radius: var(--_radius);
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
    .badges { margin-left: auto; display: flex; align-items: center; gap: var(--sett-space-1); }
    .sd { flex: 0 0 auto; width: var(--sett-space-2); height: var(--sett-space-2); border-radius: 50%; background: var(--_session); }
    .sd.live { animation: sett-badge var(--sett-motion-breath) ease-in-out infinite; animation-delay: calc(var(--sett-motion-breath) * var(--_beat, 0) / -4); }
    .sd.ignite { animation: sett-ignite var(--sett-motion-ignite) var(--sett-motion-ease-spring) 1; }
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
    @media (prefers-reduced-motion: reduce) { .sd.live, .sd.ignite { animation: none; } }
  `];

  connectedCallback() {
    super.connectedCallback();
    // open, whether a session's item is on screen decides where its mark lands; watch the items inside
    if (typeof MutationObserver === 'function') {
      this.observer = new MutationObserver(() => { if (this.tier === 'sheet') this.requestUpdate(); });
      this.observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['live', 'session', 'also'] });
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
  }

  private ids(v: string): string[] {
    return Array.from(new Set(v.split(/\s+/).filter(Boolean))).sort((a, b) => beatOf(a) - beatOf(b));
  }
  /** this box is the nearest thing you can see for that session: the unit is closed, or no live item of hers is rendered inside */
  private landsHere(id: string): boolean {
    if (this.tier !== 'sheet') return true;
    return !this.querySelector(`sett-item[live][session="${id}"], sett-item[live][also="${id}"]`);
  }

  /** before the render, so the igniting badge and the pulse land in the same frame */
  willUpdate(changed: Map<string, unknown>) {
    if (!changed.has('live') || changed.get('live') === undefined) return;
    const before = this.ids(changed.get('live') as string);
    const now = this.ids(this.live);
    const came = now.filter((id) => !before.includes(id) && this.landsHere(id));
    const went = before.filter((id) => !now.includes(id) && this.landsHere(id));
    if (came.length) {
      void arrive(this, true, came[0]);
      this.igniting = [...this.igniting, ...came];
      setTimeout(() => { this.igniting = this.igniting.filter((id) => !came.includes(id)); }, durationMs(base.motion.ignite));
    }
    if (went.length) void leave(this, true, went[0]);
  }

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
    const live = this.ids(this.live);
    return html`
      <div class="hd" part="hd"><b>${this.name}</b>${rich && this.kind ? html`<em>${this.kind}</em>` : nothing}<span class="badges">${this.ids(this.sessions).map((id) => html`<i class="sd ${this.igniting.includes(id) ? 'ignite' : live.includes(id) && this.landsHere(id) ? 'live' : ''}" style="--_session: var(--sett-session-${id}-main); --_beat: ${beatOf(id)}" title=${id}></i>`)}${rich ? html`<slot name="badges"></slot>` : nothing}</span></div>
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
