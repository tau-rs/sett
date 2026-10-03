import { LitElement, css, html, nothing, svg, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { base } from '@tau-rs/sett-tokens';
import { LINK_FAMILIES, LINK_FAMILY_MEANS, LINK_KINDS, LINK_KIND_NAMES, isLinkKind, kindsOf, type LinkFamily, type LinkKind } from './link-kinds.js';
import { linkCut, linkHead, linkTail } from './sett-link.js';
import { PORT_KINDS } from './sett-port-row.js';

const ARROW = parseFloat(base.map.size.arrow);
/** the swatch: a short line with the kind's head, drawn with sett-link's own shapes */
const W = ARROW * 5, H = ARROW * 1.5;

/** the filter value that keeps nothing: no kind or family has this name, so every link recedes */
export const FILTER_NONE = 'none';

/** the kinds a `sett-sheet` filter keeps: a family name stands for its kinds; empty keeps everything */
export function keptOf(filter: string): Set<LinkKind> {
  const words = filter.split(/\s+/).filter(Boolean);
  if (!words.length) return new Set(LINK_KIND_NAMES);
  const kept = new Set<LinkKind>();
  for (const w of words) {
    if ((LINK_FAMILIES as string[]).includes(w)) kindsOf(w as LinkFamily).forEach((k) => kept.add(k));
    else if (isLinkKind(w)) kept.add(w);
  }
  return kept;
}
/** the shortest `sett-sheet` filter that keeps exactly these kinds: empty for all, a family's name when the family is whole */
export function filterOf(kept: Set<LinkKind>): string {
  if (LINK_KIND_NAMES.every((k) => kept.has(k))) return '';
  if (!kept.size) return FILTER_NONE;
  const words: string[] = [];
  for (const f of LINK_FAMILIES) {
    const kinds = kindsOf(f);
    if (kinds.every((k) => kept.has(k))) words.push(f);
    else words.push(...kinds.filter((k) => kept.has(k)));
  }
  words.push(...LINK_KIND_NAMES.filter((k) => !LINK_KINDS[k].family && kept.has(k)));
  return words.join(' ');
}

type Check = 'true' | 'false' | 'mixed';

/**
 * The key to the map, on demand (map rule 8): a section of `sett-panel`,
 * folded to one row until `open`. It is also the control that filters the
 * links: one toggle per family (does · promises · knows · around), one per
 * kind inside it, and one for the fallback. Its rows come from the kind
 * tables (`LINK_KINDS`, `LINK_FAMILIES`, `PORT_KINDS`), never a second list:
 * a swatch is the family's line pattern and the kind's head, as `sett-link`
 * draws them. The port kinds are a key only, as is the finding, which never
 * recedes.
 *
 * `overlays` names the overlay toggles that are on (the values of the
 * `sett-toggle`s, separated by spaces), copied by the host. While the plan
 * or the delta is on, the legend keys it (rule 13): a planned item and a
 * planned link; what is added, removed and unchanged. Those rows are a key,
 * not a filter. The sessions and the findings need no row here: a session
 * ring names itself, and the finding is keyed with the links.
 *
 * It holds no map state. `filter` is the value of `sett-sheet filter` (the
 * families and kinds to keep; empty keeps everything); a toggle fires
 * `sett-filter` with the next value and the host copies it onto the sheet
 * and back here. Folded, the row says how many kinds are shown while a
 * filter is on. Opening the section and listing a family's kinds are the
 * legend's own. Pointing eases a row's background (`motion.hover`).
 *
 * @fires sett-filter - `{ filter }`, the next value for `sett-sheet filter`, when a family or a kind is toggled
 * @csspart head - the row that opens and closes the section
 */
@customElement('sett-legend')
export class SettLegend extends LitElement {
  /** the families and kinds kept, as `sett-sheet filter` takes them; empty keeps everything */
  @property() filter = '';
  /** the section is unfolded */
  @property({ type: Boolean, reflect: true }) open = false;
  /** the families whose kinds are listed, separated by spaces */
  @property() expanded = '';
  /** the overlays that are on, as the `sett-toggle` values (`sessions plan findings delta`); the plan and the delta get a key */
  @property() overlays = '';

  static styles = css`
    :host {
      display: block;
      border-top: var(--sett-stroke-hair) solid var(--sett-color-line2);
      color: var(--sett-color-ink);
      font-family: var(--sett-font-sans);
      font-size: var(--sett-font-size-base);
    }
    .row, .head {
      display: flex; align-items: center; gap: var(--sett-space-2);
      box-sizing: border-box;
      height: var(--sett-map-size-port-row);
      padding: 0 var(--sett-space-3);
      white-space: nowrap;
    }
    .head, .check, .more { cursor: pointer; user-select: none; transition: background-color var(--sett-motion-hover) ease; }
    .head:hover, .check:hover, .more:hover { background: var(--sett-color-well); }
    .head { width: 100%; margin: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; }
    .head b { font-weight: var(--sett-font-weight-medium); }
    .row { padding: 0; }
    .check { display: flex; align-items: center; gap: var(--sett-space-2); flex: 1; min-width: 0; height: 100%; padding-left: var(--sett-space-3); }
    .kind .check, .kind.key { padding-left: var(--sett-space-6); height: var(--sett-map-size-item-row); }
    .kind { height: var(--sett-map-size-item-row); }
    .key { padding-left: var(--sett-space-3); }
    .more { display: flex; align-items: center; justify-content: center; flex: none; width: var(--sett-space-6); height: 100%; margin: 0; padding: 0; border: 0; background: none; color: var(--sett-color-mute); font: inherit; }
    .ar { margin-left: auto; color: var(--sett-color-mute); }
    .mu { min-width: 0; overflow: hidden; text-overflow: ellipsis; color: var(--sett-color-mute); }
    h6 { margin: 0; padding: var(--sett-space-2) var(--sett-space-3) var(--sett-space-1); font-size: var(--sett-font-size-xs); font-weight: var(--sett-font-weight-normal); color: var(--sett-color-mute); }
    .box {
      display: inline-flex; align-items: center; justify-content: center; flex: none;
      box-sizing: border-box; width: var(--sett-space-3); height: var(--sett-space-3);
      border: var(--sett-stroke-hair) solid var(--sett-color-mute);
      border-radius: var(--sett-radius-item);
      color: var(--sett-color-paper);
      font-size: var(--sett-font-size-xs); line-height: 1;
    }
    [aria-checked='true'] .box { background: var(--sett-color-sel); border-color: var(--sett-color-sel); }
    [aria-checked='true'] .box::before { content: var(--sett-glyph-done); }
    [aria-checked='mixed'] .box { border-color: var(--sett-color-sel); }
    [aria-checked='mixed'] .box::before { content: ''; width: 50%; height: 50%; background: var(--sett-color-sel); }
    .box.none { visibility: hidden; }
    [aria-checked='false'] .nm { color: var(--sett-color-mute); }
    [aria-checked='false'] svg { opacity: var(--sett-map-far); }
    .head:focus-visible, .check:focus-visible, .more:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: calc(-1 * var(--sett-stroke-lit)); }
    svg { display: block; flex: none; overflow: visible; color: var(--sett-color-mute); }
    svg.refers-to { color: var(--sett-color-line); }
    svg.finding { color: var(--sett-color-bad); }
    ${unsafeCSS(LINK_FAMILIES.map((f) => `svg.${f} { --_dash: var(--sett-map-link-${f}-stroke); }`).join('\n'))}
    .line { fill: none; stroke: currentColor; stroke-width: var(--sett-stroke-hair); stroke-dasharray: var(--_dash); }
    svg.finding .line { stroke-width: var(--sett-stroke-lit); }
    svg.planned { color: var(--sett-color-sug); }
    svg.planned .line { stroke-width: var(--sett-stroke-lit); }
    svg.planned .hollow, svg.planned .open { stroke-width: var(--sett-stroke-lit); }
    svg.removed { color: var(--sett-color-line); }
    svg.unchanged { opacity: var(--sett-map-far); }
    .band { fill: none; stroke: var(--sett-color-sug-bg); stroke-width: var(--sett-map-size-band); stroke-linejoin: round; }
    .cut { fill: none; stroke: var(--sett-color-mute); stroke-width: var(--sett-stroke-lit); stroke-linecap: round; }
    /* an item's box at the overlay keys, with sett-item's own fills and lines */
    .it { flex: none; box-sizing: border-box; width: var(--sett-space-6); height: var(--sett-space-3); border: var(--sett-stroke-hair) solid var(--sett-color-line); border-radius: var(--sett-radius-item); background: var(--sett-color-paper); }
    .it.planned { background: var(--sett-color-sug-bg); border-color: var(--sett-color-sug); border-style: dashed; }
    .it.removed { background: transparent; border-color: var(--sett-color-line); border-style: dashed; }
    .it.unchanged { border-color: var(--sett-color-line2); }
    .filled { fill: currentColor; stroke: none; }
    .hollow { fill: var(--sett-color-paper); stroke: currentColor; stroke-width: var(--sett-stroke-hair); }
    .open { fill: none; stroke: currentColor; stroke-width: var(--sett-stroke-hair); stroke-linecap: round; stroke-linejoin: round; }
    .ports { display: flex; flex-wrap: wrap; gap: var(--sett-space-1) var(--sett-space-3); padding: 0 var(--sett-space-3) var(--sett-space-3); font-family: var(--sett-font-mono); font-size: var(--sett-font-size-sm); color: var(--sett-color-ink2); }
    .pk { display: inline-flex; align-items: center; gap: var(--sett-space-1); }
    .dot { width: var(--sett-map-size-dot); height: var(--sett-map-size-dot); border-radius: 50%; background: var(--_kind); }
    ${unsafeCSS(PORT_KINDS.map((k) => `.pk.${k} { --_kind: var(--sett-map-kind-${k}-color); }`).join('\n'))}
    @media (prefers-reduced-motion: reduce) { .head, .check, .more { transition: none; } }
  `;

  private get kept() { return keptOf(this.filter); }
  private get listed() { return new Set(this.expanded.split(/\s+/).filter(Boolean)); }

  private say(kept: Set<LinkKind>) {
    this.dispatchEvent(new CustomEvent('sett-filter', { detail: { filter: filterOf(kept) }, bubbles: true, composed: true }));
  }
  private toggleKind(kind: LinkKind) {
    const kept = this.kept;
    if (kept.has(kind)) kept.delete(kind); else kept.add(kind);
    this.say(kept);
  }
  /** a family that is whole goes off; one that is off or partial comes back whole */
  private toggleFamily(family: LinkFamily) {
    const kept = this.kept, kinds = kindsOf(family);
    const whole = kinds.every((k) => kept.has(k));
    kinds.forEach((k) => (whole ? kept.delete(k) : kept.add(k)));
    this.say(kept);
  }
  private list(family: LinkFamily) {
    const listed = this.listed;
    if (listed.has(family)) listed.delete(family); else listed.add(family);
    this.expanded = LINK_FAMILIES.filter((f) => listed.has(f)).join(' ');
  }
  private onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).click();
  };

  private swatch(cls: string, kind?: LinkKind) {
    const spec = kind ? LINK_KINDS[kind] : undefined;
    const y = H / 2, s = { x: 0, y }, e = { x: W, y }, d = { x: 1, y: 0 };
    const end = spec?.head === 'socket' ? W - ARROW / 2 : W;
    const line = `M0 ${y} L${end} ${y}`, overlay = cls.split(' ');
    return html`<svg class=${cls} width=${W} height=${H} viewBox="0 0 ${W} ${H}" aria-hidden="true">${svg`${overlay.includes('planned') ? svg`<path class="band" d=${line} />` : nothing}<path class="line" d=${line} />${spec ? linkHead(spec.head, e, d) : nothing}${spec?.tail ? linkTail(spec.tail, s, d) : nothing}${overlay.includes('removed') ? linkCut([s, { x: end, y }]) : nothing}`}</svg>`;
  }
  private check(state: Check, label: string, toggle: () => void, body: unknown) {
    return html`<span class="check" role="checkbox" tabindex="0" aria-checked=${state} aria-label=${label} @click=${toggle} @keydown=${this.onKey}><span class="box" aria-hidden="true"></span>${body}</span>`;
  }

  private family(f: LinkFamily, kept: Set<LinkKind>) {
    const kinds = kindsOf(f), on = kinds.filter((k) => kept.has(k)).length;
    const state: Check = on === kinds.length ? 'true' : on ? 'mixed' : 'false';
    const listed = this.listed.has(f);
    return html`
      <div class="row">
        ${this.check(state, `${f} · ${LINK_FAMILY_MEANS[f]}`, () => this.toggleFamily(f), html`${this.swatch(f)}<span class="nm">${f}</span><span class="mu">${LINK_FAMILY_MEANS[f]}</span>`)}
        <button class="more" type="button" aria-expanded=${listed ? 'true' : 'false'} aria-label=${`${f} · kinds`} @click=${() => this.list(f)}>${listed ? '▾' : '▸'}</button>
      </div>
      ${listed ? kinds.map((k) => this.kind(k, kept)) : nothing}`;
  }
  private kind(k: LinkKind, kept: Set<LinkKind>) {
    const spec = LINK_KINDS[k];
    return html`<div class="row kind" title=${spec.means}>${this.check(kept.has(k) ? 'true' : 'false', spec.label, () => this.toggleKind(k), html`${this.swatch(spec.family ?? k, k)}<span class="nm">${spec.label}</span>`)}</div>`;
  }

  /** one row of an overlay's key: no toggle, a box for the item and a swatch for the link */
  private key(name: string, means: string, item?: string, link?: string) {
    return html`<div class="row key"><span class="box none" aria-hidden="true"></span>${item !== undefined ? html`<span class=${`it ${item}`} aria-hidden="true"></span>` : nothing}${link !== undefined ? this.swatch(`does ${link}`, 'calls') : nothing}<span class="nm">${name}</span><span class="mu">${means}</span></div>`;
  }

  render() {
    const kept = this.kept, total = LINK_KIND_NAMES.length;
    const on = new Set(this.overlays.split(/\s+/).filter(Boolean));
    const fallback = LINK_KIND_NAMES.filter((k) => !LINK_KINDS[k].family);
    return html`
      <button class="head" part="head" type="button" aria-expanded=${this.open ? 'true' : 'false'} @click=${() => { this.open = !this.open; }}>
        <b>legend</b>${kept.size < total ? html`<span class="mu">· ${kept.size} of ${total} link kinds shown</span>` : nothing}<span class="ar" aria-hidden="true">${this.open ? '▾' : '▸'}</span>
      </button>
      ${this.open ? html`
        <h6>links</h6>
        <div role="group" aria-label="links">
          ${LINK_FAMILIES.map((f) => this.family(f, kept))}
          ${fallback.map((k) => html`<div class="row" title=${LINK_KINDS[k].means}>${this.check(kept.has(k) ? 'true' : 'false', LINK_KINDS[k].label, () => this.toggleKind(k), html`${this.swatch(k)}<span class="nm">${LINK_KINDS[k].label}</span><span class="mu">the least known</span>`)}</div>`)}
          <div class="row key"><span class="box none" aria-hidden="true"></span>${this.swatch('finding', 'calls')}<span class="nm">finding</span><span class="mu">on any kind, never recedes</span></div>
        </div>
        ${on.has('plan') ? html`<h6>plan</h6>
        <div role="group" aria-label="plan">
          ${this.key('planned item', 'not written yet; g1, its group', 'planned')}
          ${this.key('planned link', 'keeps its pattern', undefined, 'planned')}
        </div>` : nothing}
        ${on.has('delta') ? html`<h6>delta</h6>
        <div role="group" aria-label="delta">
          ${this.key('added or changed', 'drawn as it is', '', '')}
          ${this.key('removed', 'a ghost, struck', 'removed', 'removed')}
          ${this.key('unchanged', 'recedes', 'unchanged', 'unchanged')}
        </div>` : nothing}
        <h6>ports</h6>
        <div class="ports" role="group" aria-label="ports">${PORT_KINDS.map((k) => html`<span class="pk ${k}"><span class="dot"></span>${k}</span>`)}</div>` : nothing}`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-legend': SettLegend }
}
