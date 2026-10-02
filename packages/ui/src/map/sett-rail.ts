import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { PortSide } from './sett-port-row.js';

export type RailSection = 'services' | 'third-party' | 'events' | 'data' | 'system' | 'crates' | 'unresolved';
/** the fixed order of a rail's sections, unresolved always last (rule 6) */
export const RAIL_SECTIONS: RailSection[] = ['services', 'third-party', 'events', 'data', 'system', 'crates', 'unresolved'];
/** header per section, per side, as the PoC labels them */
export const RAIL_LABEL: Record<RailSection, Record<PortSide, string>> = {
  services: { exposes: 'api', needs: 'platform services' },
  'third-party': { exposes: 'api · public', needs: 'third-party services' },
  events: { exposes: 'events published', needs: 'events consumed' },
  data: { exposes: 'data', needs: 'data stores' },
  system: { exposes: 'os', needs: 'os · files · terminal' },
  crates: { exposes: 'public items', needs: 'libraries' },
  unresolved: { exposes: 'unresolved', needs: 'unresolved' },
};

/**
 * A unit's API block on one flat side: `exposes` on the left, `needs` on the
 * right. Ports go in the slot named after their section; the rail keeps the
 * sections in the fixed order, labels them per side, and hides empty ones.
 * Headers are lowercase and mute. Width is `map.size.rail`.
 *
 * `unresolved` is always last and sits on its own tint
 * (`map.surface.unresolved`): the externals without an owner, which no other
 * section can claim. They have no contract, so their rows carry no op rows.
 *
 * @slot services · third-party · events · data · system · crates · unresolved - `sett-port-row` children
 * @csspart header - the `exposes · n ports` line
 * @csspart section - each section header
 */
@customElement('sett-rail')
export class SettRail extends LitElement {
  @property({ reflect: true }) side: PortSide = 'exposes';
  @state() private counts: Partial<Record<RailSection, number>> = {};

  static styles = css`
    :host {
      display: block; width: var(--sett-map-size-rail); box-sizing: border-box;
      background: var(--sett-color-paper);
      border: var(--sett-stroke-hair) solid var(--sett-color-line);
      border-radius: var(--sett-map-radius-area);
      padding: 0 var(--sett-space-2) var(--sett-space-2);
      font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); color: var(--sett-color-ink);
      --sett-port-dot-offset: calc(-1 * (var(--sett-space-2) + var(--sett-map-size-dot) / 2));
    }
    .ah { display: flex; align-items: baseline; gap: var(--sett-space-2); height: var(--sett-map-size-area-header); padding: 0 var(--sett-space-1); white-space: nowrap; }
    .ah b { font-weight: var(--sett-font-weight-medium); }
    .ah em { font-style: normal; color: var(--sett-color-mute); font-size: var(--sett-font-size-xs); }
    .sec { display: flex; align-items: flex-end; gap: var(--sett-space-2); line-height: var(--sett-map-size-port-row-compact); padding: 0 var(--sett-space-1); font-size: var(--sett-font-size-xs); color: var(--sett-color-mute); border-bottom: var(--sett-stroke-hair) solid var(--sett-color-line2); }
    .sec em { font-style: normal; margin-left: auto; }
    .sec[hidden], .un[hidden] { display: none; }
    .un {
      margin: var(--sett-space-1) calc(-1 * var(--sett-space-2)) calc(-1 * var(--sett-space-2)); padding: 0 var(--sett-space-2) var(--sett-space-2);
      background: var(--sett-map-surface-unresolved);
      border-radius: 0 0 calc(var(--sett-map-radius-area) - var(--sett-stroke-hair)) calc(var(--sett-map-radius-area) - var(--sett-stroke-hair));
    }
    .none { color: var(--sett-color-mute); line-height: var(--sett-map-size-port-row); padding: 0 var(--sett-space-1); }
  `;

  private recount() {
    const counts: Partial<Record<RailSection, number>> = {};
    for (const s of RAIL_SECTIONS) counts[s] = this.querySelectorAll(`sett-port-row[slot='${s}']`).length;
    this.counts = counts;
  }

  firstUpdated() { this.recount(); }

  private section(s: RailSection) {
    return html`
        <div class="sec" part="section" ?hidden=${!this.counts[s]}><span>${RAIL_LABEL[s][this.side]}</span><em>${this.counts[s] ?? 0}</em></div>
        <slot name=${s} @slotchange=${this.recount}></slot>`;
  }

  render() {
    const total = RAIL_SECTIONS.reduce((n, s) => n + (this.counts[s] ?? 0), 0);
    return html`
      <div class="ah" part="header"><b>${this.side}</b><em>${total} port${total === 1 ? '' : 's'}</em></div>
      ${total ? '' : html`<div class="none">nothing ${this.side === 'exposes' ? 'exposed' : 'needed'}</div>`}
      ${RAIL_SECTIONS.filter((s) => s !== 'unresolved').map((s) => this.section(s))}
      <div class="un" ?hidden=${!this.counts.unresolved}>${this.section('unresolved')}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-rail': SettRail }
}
