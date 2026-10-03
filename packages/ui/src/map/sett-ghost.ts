import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type GhostBody = 'unit' | 'system' | 'cluster';

/**
 * A neighbour from outside the repository, shown beside the open unit
 * (#56): a unit of another repository, or a system from the system map.
 * Where it goes is `placeGhosts` (`ghosts.ts`): on the side where it lies on
 * the system map, never callers-left / dependencies-right. Three bodies:
 *
 * - `unit`: another repository's unit, a folded `sett-sheet` in the `inside`
 *   slot (its areas closed into chips, so a line lands on the area it reaches);
 * - `system`: an outside system, its port rows in `exposes` and `needs`
 *   (dashed when `declared`);
 * - `cluster`: ghosts that would overlap, merged; one row per member in
 *   `members`.
 *
 * A ghost recedes by colour, never by opacity, and so does everything it
 * holds: inside it the ink tokens are the mute ones and the borders the
 * faint ones, inherited down into every element it hosts, a folded sheet's
 * areas and items included (text stays above 4.5:1). It never carries `▴ close`: it is not open.
 * Its `key` is what a `sett-edge` ends on.
 *
 * @slot - one or two meta lines
 * @slot inside - the folded `sett-sheet` (body `unit`)
 * @slot exposes - `sett-port-row side="exposes"` rows (body `system`)
 * @slot needs - `sett-port-row side="needs"` rows (body `system`)
 * @slot members - one `sett-port-row side="exposes"` per member (body `cluster`)
 * @csspart hd - the head: name · kind
 */
@customElement('sett-ghost')
export class SettGhost extends LitElement {
  /** the name a `sett-edge` ends on */
  @property({ reflect: true }) key?: string;
  @property() name = '';
  /** data store · third-party · app · … shown mute after the name */
  @property() kind = '';
  @property({ reflect: true }) body: GhostBody = 'system';
  /** declared by hand, nothing verified: dashed (rule 10) */
  @property({ type: Boolean, reflect: true }) declared = false;

  static styles = css`
    :host {
      /* recede by colour: what the ghost holds reads the mute ink and the faint lines */
      --sett-color-ink: var(--sett-color-mute);
      --sett-color-ink2: var(--sett-color-mute);
      --sett-color-line: var(--sett-color-line2);
      display: block; position: relative; box-sizing: border-box;
      background: var(--sett-color-paper); color: var(--sett-color-mute);
      border: var(--sett-stroke-hair) solid var(--sett-color-line2);
      border-radius: var(--sett-map-radius-node);
      font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); line-height: var(--sett-font-line-height-ui);
      user-select: none;
    }
    :host([declared]) { border-style: dashed; }
    .hd { display: flex; align-items: baseline; gap: var(--sett-space-2); padding: var(--sett-space-2) var(--sett-space-3) 0; font-size: var(--sett-font-size-lg); white-space: nowrap; overflow: hidden; }
    .hd b { font-weight: var(--sett-font-weight-semibold); overflow: hidden; text-overflow: ellipsis; }
    .hd em { font-style: normal; font-size: var(--sett-font-size-sm); }
    .meta { padding: 0 var(--sett-space-3); font-size: var(--sett-font-size-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .meta ::slotted(*) { display: block; overflow: hidden; text-overflow: ellipsis; }
    .ports { display: grid; grid-template-columns: 1fr 1fr; column-gap: var(--sett-space-3); padding: var(--sett-space-1) var(--sett-space-3) var(--sett-space-2); --sett-port-dot-offset: calc(-1 * (var(--sett-space-3) + var(--sett-map-size-dot) / 2)); }
    .rows { padding: var(--sett-space-1) var(--sett-space-3) var(--sett-space-2); --sett-port-dot-offset: calc(-1 * (var(--sett-space-3) + var(--sett-map-size-dot) / 2)); }
    .col { min-width: 0; }
    .inside { border-top: var(--sett-stroke-hair) solid var(--sett-color-line2); margin-top: var(--sett-space-2); padding: var(--sett-space-2) var(--sett-space-3); }
  `;

  render() {
    return html`
      <div class="hd" part="hd"><b>${this.name}</b>${this.kind ? html`<em>${this.kind}</em>` : nothing}</div>
      <div class="meta">${this.declared ? html`declared · unverified` : html`<slot></slot>`}</div>
      ${this.body === 'unit' ? html`<div class="inside"><slot name="inside"></slot></div>`
        : this.body === 'cluster' ? html`<div class="rows"><slot name="members"></slot></div>`
        : html`<div class="ports"><div class="col"><slot name="exposes"></slot></div><div class="col"><slot name="needs"></slot></div></div>`}`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-ghost': SettGhost }
}
