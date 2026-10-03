import { LitElement, css, html, nothing, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { base } from '@tau-rs/sett-tokens';
import type { Pt } from './routes.js';

const ARROW = parseFloat(base.map.size.arrow);

export type BundleOrigin = 'driving' | 'domain' | 'driven';
export const BUNDLE_ORIGINS: BundleOrigin[] = ['driving', 'domain', 'driven'];

/** one pair of the tree: the line from the group this bundle leaves to one other group */
export interface BundleBranch {
  /** the key of the group it reaches */
  to: string;
  /** the name of that group, for the label */
  name?: string;
  /** how many links it stands for; one is a single line, drawn by its own `sett-link` past the shared stretch */
  count: number;
  /** the stretch shared with other branches, from the source (`stretches()`) */
  shared: Pt[];
  /** its own stretch, to the arrow end */
  own: Pt[];
  /** opened by hand: its links are drawn instead, and it keeps its track */
  open?: boolean;
  lit?: boolean;
  /** filtered out, or unchanged in the delta: `map.far` */
  far?: boolean;
  /** points right to left: a smell (rule 11) */
  backward?: boolean;
}

const fmt = (p: Pt) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
const pathOf = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${fmt(p)}`).join(' ');
/** the last segment with a length */
const lastDir = (pts: Pt[]): Pt => {
  for (let i = pts.length - 1; i > 0; i--) {
    const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y, l = Math.hypot(dx, dy);
    if (l) return { x: dx / l, y: dy / l };
  }
  return { x: 1, y: 0 };
};
const join = (b: BundleBranch): Pt[] => (b.shared.length ? [...b.shared, ...b.own.slice(1)] : b.own);

/**
 * The one line leaving an area at the areas level (rule 12). A stretch that
 * carries two or more links is a double line: `map.size.bundle` wide with a
 * `map.size.bundleGap` inside, edges in `color.mute`, the inside in the hue
 * of the column it leaves (`origin`, `map.origin.*`). Where it branches it
 * opens like a pipe junction, no dot; it passes over another double line
 * with a halo. Each pair of two or more links ends in an arrow; a pair of
 * exactly one link is that `sett-link`, which leaves the double line with a
 * small dot.
 *
 * The `sett-sheet` draws one per area and hands it its `branches`; it is not
 * placed by hand. Open by hand: the arrow end opens that pair, the shared
 * stretch opens everything leaving the area. An opened pair is no longer
 * drawn but stays reachable by keyboard, to close it.
 *
 * @fires sett-open - `{ from, to?, open }`: a pair (`to`) or everything leaving `from`
 * @csspart svg - the drawing
 */
@customElement('sett-bundle')
export class SettBundle extends LitElement {
  /** the key of the group it leaves */
  @property() from = '';
  /** the name of that group, for the labels */
  @property() name = '';
  /** the column it leaves, which tints the inside; a rail has none */
  @property({ reflect: true }) origin?: BundleOrigin;
  /** unrelated to the pins: `map.far` */
  @property({ type: Boolean, reflect: true }) far = false;
  /** the geometry, in the coordinates of the positioned ancestor; the sheet sets it */
  @property({ attribute: false }) branches: BundleBranch[] = [];

  /** what is pointed at or focused: a branch's `to`, or `*` for the shared stretch */
  @state() private hot?: string;

  static styles = css`
    :host { position: absolute; inset: 0; display: block; pointer-events: none; color: var(--sett-color-mute); --_in: var(--sett-color-line2); }
    :host([origin='driving']) { --_in: var(--sett-map-origin-driving); }
    :host([origin='domain']) { --_in: var(--sett-map-origin-domain); }
    :host([origin='driven']) { --_in: var(--sett-map-origin-driven); }
    :host([far]) { opacity: var(--sett-map-far); }
    svg { display: block; width: 100%; height: 100%; overflow: visible; }
    path { fill: none; stroke-linejoin: miter; }
    .halo { stroke: var(--sett-color-paper); stroke-width: calc(var(--sett-map-size-bundle) + 2 * var(--sett-map-size-halo)); }
    .edge { stroke: currentColor; stroke-width: var(--sett-map-size-bundle); transition: stroke var(--sett-motion-hover) ease; }
    .in { stroke: var(--_in); stroke-width: var(--sett-map-size-bundle-gap); transition: stroke var(--sett-motion-hover) ease; }
    .head { fill: currentColor; stroke: none; transition: fill var(--sett-motion-hover) ease; }
    .backward { color: var(--sett-map-status-smell-color); }
    .lit { color: var(--sett-color-sel); }
    .in.lit { stroke: var(--sett-color-sel-bg); }
    .faded { opacity: var(--sett-map-far); }
    .hit { stroke: transparent; stroke-width: var(--sett-map-size-hit); pointer-events: stroke; cursor: pointer; }
    .open .hit { pointer-events: none; }
    g[role='button'] { outline: none; }
    @media (prefers-reduced-motion: reduce) {
      .edge, .in, .head { transition: none; }
    }
  `;

  private fire(to: string | undefined, open: boolean) {
    this.dispatchEvent(new CustomEvent('sett-open', { bubbles: true, composed: true, detail: { from: this.from, to, open } }));
  }
  private onKey = (e: KeyboardEvent, run: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); }
  };

  /** halo, edges, insides, in that order over the whole set, so a junction opens like a pipe */
  private pipes(set: { d: string; cls: string }[]) {
    return svg`${set.map((p) => svg`<path class="halo" d=${p.d} />`)}${set.map((p) => svg`<path class=${`edge ${p.cls}`} d=${p.d} />`)}${set.map((p) => svg`<path class=${`in ${p.cls}`} d=${p.d} />`)}`;
  }

  render() {
    const all = this.branches.filter((b) => b.own.length > 0);
    if (!all.length) return nothing;
    const lit = (b: BundleBranch) => !!b.lit || this.hot === '*' || this.hot === b.to;
    // an opened pair is not drawn, unless the keyboard is on it
    const drawn = all.filter((b) => !b.open || this.hot === b.to);
    const heads: unknown[] = [];
    const paths = drawn.map((b) => {
      const cls = `${lit(b) ? 'lit' : ''} ${b.backward ? 'backward' : ''}`;
      if (b.count < 2) return { d: b.shared.length ? pathOf(b.shared) : '', cls, far: !!b.far, lit: lit(b) };
      const pts = join(b), e = pts[pts.length - 1], d = lastDir(pts), n = { x: -d.y, y: d.x };
      const back = { x: e.x - d.x * ARROW, y: e.y - d.y * ARROW };
      const tri = `M${fmt(e)} L${fmt({ x: back.x + n.x * ARROW / 1.6, y: back.y + n.y * ARROW / 1.6 })} L${fmt({ x: back.x - n.x * ARROW / 1.6, y: back.y - n.y * ARROW / 1.6 })} Z`;
      heads.push(svg`<path class=${`head ${cls} ${b.far ? 'faded' : ''}`} d=${tri} />`);
      return { d: pathOf([...pts.slice(0, -1), back]), cls, far: !!b.far, lit: lit(b) };
    }).filter((p) => p.d).sort((p, q) => Number(p.lit) - Number(q.lit));
    const near = paths.filter((p) => !p.far), far = paths.filter((p) => p.far);
    const closed = all.filter((b) => !b.open);
    const trunk = closed.filter((b) => b.shared.length);
    const total = closed.reduce((n, b) => n + b.count, 0);
    const from = this.name || this.from;
    const hover = (to?: string) => ({ enter: () => { this.hot = to; }, leave: () => { if (this.hot === to) this.hot = undefined; } });
    return html`<svg part="svg">
      ${far.length ? svg`<g class="faded">${this.pipes(far)}</g>` : nothing}
      ${this.pipes(near)}${heads}
      ${trunk.length > 1 ? (() => {
        const h = hover('*'), run = () => this.fire(undefined, true);
        const label = `${total} links leaving ${from} · open them all`;
        return svg`<g role="button" tabindex="0" aria-label=${label} @click=${run} @keydown=${(e: KeyboardEvent) => this.onKey(e, run)} @pointerenter=${h.enter} @pointerleave=${h.leave} @focus=${h.enter} @blur=${h.leave}>
          <title>${label}</title>${trunk.map((b) => svg`<path class="hit" d=${pathOf(b.shared)} />`)}</g>`;
      })() : nothing}
      ${all.filter((b) => b.count > 1).map((b) => {
        const h = hover(b.to), run = () => this.fire(b.to, !b.open);
        const label = `${b.count} links · ${from} → ${b.name || b.to} · ${b.open ? 'close' : 'open'}`;
        return svg`<g class=${b.open ? 'open' : ''} role="button" tabindex="0" aria-expanded=${String(!!b.open)} aria-label=${label} @click=${run} @keydown=${(e: KeyboardEvent) => this.onKey(e, run)} @pointerenter=${h.enter} @pointerleave=${h.leave} @focus=${h.enter} @blur=${h.leave}>
          <title>${label}</title><path class="hit" d=${pathOf(trunk.length > 1 || b.open ? b.own : join(b))} /></g>`;
      })}
    </svg>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-bundle': SettBundle }
}
