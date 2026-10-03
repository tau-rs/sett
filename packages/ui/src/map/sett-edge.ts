import { LitElement, css, html, nothing, svg, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { base } from '@tau-rs/sett-tokens';
import { joinBoard, leaveBoard } from './board-lines.js';
import { PORT_KINDS, type PortKind } from './sett-port-row.js';
import type { Pt, Route } from './routes.js';

const ARROW = parseFloat(base.map.size.arrow);
const BRANCH = parseFloat(base.map.size.branch);

const fmt = (p: Pt) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
const pathOf = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${fmt(p)}`).join(' ');
const dir = (a: Pt, b: Pt): Pt => { const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1; return { x: dx / l, y: dy / l }; };
const lastDir = (pts: Pt[]): Pt => { for (let i = pts.length - 1; i > 0; i--) if (pts[i].x !== pts[i - 1].x || pts[i].y !== pts[i - 1].y) return dir(pts[i - 1], pts[i]); return { x: 1, y: 0 }; };
/** the middle of the longest stretch: where the label sits */
function labelAt(pts: Pt[]): Pt {
  let best = 1, len = -1;
  for (let i = 1; i < pts.length; i++) { const l = Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y); if (l > len) { len = l; best = i; } }
  return { x: (pts[best].x + pts[best - 1].x) / 2, y: (pts[best].y + pts[best - 1].y) / 2 };
}
/** the filled arrow at `e`, arriving along `d` */
const head = (e: Pt, d: Pt) => {
  const b = { x: e.x - d.x * ARROW, y: e.y - d.y * ARROW }, n = { x: -d.y * ARROW / 2.4, y: d.x * ARROW / 2.4 };
  return `M${fmt(e)} L${fmt({ x: b.x + n.x, y: b.y + n.y })} L${fmt({ x: b.x - n.x, y: b.y - n.y })} Z`;
};
/** one dash period of a kind's stroke, so the marching dashes loop without a jump */
const period = (k: PortKind) => { const s = base.map.kind[k]?.stroke ?? 'solid'; return s === 'solid' ? 0 : s.split(/\s+/).reduce((a: number, v: string) => a + parseFloat(v), 0); };

/**
 * One line between two units on the board. It names its ends by `key`
 * (`from`, `to`) and, at card zoom, the port rows it leaves and reaches
 * (`from-port`, `to-port`); it never gets coordinates. The edges under one
 * parent are routed together (`board-lines.ts`): square lines in the gaps
 * between the boxes, one trunk per source with a dot where it branches,
 * lines into one dock joining before it, a line going back around the near
 * end of its own box (#56). At chip zoom a line leaves the middle of a side;
 * at card zoom it docks on the port dots. An end off-screen ends on the hint
 * pill that stands in for it.
 *
 * Colour and dash are the port kind (`map.kind.*`); the arrow says who uses
 * whom and the line stops `map.size.arrow` before it; a halo parts it from
 * the lines it crosses. Nothing is written on it at rest: the kind and the
 * `label` show under the pointer. `lit` (an end is pointed at, or its hint
 * pill) turns it blue and keeps its dash; `selected` (the selected
 * unit's edges) adds the `flow`: a dashed kind's own dashes march, a solid
 * one carries travelling gaps. `far` recedes it to `map.far`.
 *
 * @fires sett-light - `{ on }` when pointed at
 * @csspart svg - the drawing
 * @csspart label - the label pill, under the pointer
 */
@customElement('sett-edge')
export class SettEdge extends LitElement {
  /** the key of the unit that uses */
  @property({ reflect: true }) from = '';
  /** the key of the unit it uses */
  @property({ reflect: true }) to = '';
  /** the key of the port row it leaves, on a card */
  @property({ attribute: 'from-port' }) fromPort?: string;
  /** the key of the port row it reaches, on a card */
  @property({ attribute: 'to-port' }) toPort?: string;
  @property({ reflect: true }) kind: PortKind = 'crate';
  /** what and how much, shown with the kind under the pointer (`crate · 31 uses`) */
  @property() label?: string;
  /** an end is pointed at, or the hint pill it ends on: blue, its dash kept */
  @property({ type: Boolean, reflect: true }) lit = false;
  /** an edge of the selected unit: blue, with the flow */
  @property({ type: Boolean, reflect: true }) selected = false;
  /** unrelated to the selection: `map.far` */
  @property({ type: Boolean, reflect: true }) far = false;
  /** the geometry, in the parent's coordinates; the board coordinator sets it */
  @property({ attribute: false }) route?: Route;

  @state() private pointed = false;

  static styles = css`
    :host { position: absolute; inset: 0; display: block; pointer-events: none; color: var(--_kind, var(--sett-color-mute)); }
    ${unsafeCSS(PORT_KINDS.map((k) => `:host([kind='${k}']) { --_kind: var(--sett-map-kind-${k}-color); --_dash: var(--sett-map-kind-${k}-stroke); }`).join('\n'))}
    :host([lit]), :host([selected]) { z-index: 1; }
    svg.on { color: var(--sett-color-sel); }
    :host([far]) { opacity: var(--sett-map-far); }
    svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .hit { fill: none; stroke: transparent; stroke-width: var(--sett-map-size-hit); pointer-events: stroke; }
    .halo { fill: none; stroke: var(--sett-color-bg); stroke-width: calc(var(--sett-stroke-hair) + 2 * var(--sett-map-size-halo)); }
    .line { fill: none; stroke: currentColor; stroke-width: var(--sett-stroke-hair); stroke-dasharray: var(--_dash); transition: stroke var(--sett-motion-hover) ease; }
    .on .line { stroke-width: var(--sett-stroke-lit); }
    .on .halo { stroke-width: calc(var(--sett-stroke-lit) + 2 * var(--sett-map-size-halo-lit)); }
    .h, .b { fill: currentColor; stroke: none; transition: fill var(--sett-motion-hover) ease; }
    .march { animation: sett-march var(--sett-motion-flow) linear infinite; }
    @keyframes sett-march { to { stroke-dashoffset: calc(-1 * var(--_period)); } }
    .flow { fill: none; stroke: var(--sett-color-paper); stroke-width: var(--sett-stroke-hair); stroke-dasharray: var(--sett-map-size-branch) var(--sett-map-size-track); animation: sett-flow var(--sett-motion-flow) linear infinite; }
    @keyframes sett-flow { to { stroke-dashoffset: calc(-1 * (var(--sett-map-size-branch) + var(--sett-map-size-track))); } }
    .label {
      position: absolute; transform: translate(-50%, -50%); z-index: 1;
      padding: 0 var(--sett-space-2); border-radius: var(--sett-map-radius-hint);
      background: var(--sett-color-ink); color: var(--sett-color-bg);
      font: var(--sett-font-size-sm) / var(--sett-map-size-port-row-compact) var(--sett-font-sans); white-space: nowrap;
    }
    @media (prefers-reduced-motion: reduce) {
      .line, .h, .b { transition: none; }
      .march, .flow { animation: none; }
      .flow { display: none; }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    joinBoard(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    leaveBoard(this);
  }

  /** a route gone under the pointer (an end left the window) never gets a pointerleave: let go of the pointer */
  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('route') && this.pointed && !(this.route && this.route.points.length >= 2)) this.point(false);
  }

  private point = (on: boolean) => {
    this.pointed = on;
    this.dispatchEvent(new CustomEvent('sett-light', { bubbles: true, composed: true, detail: { on } }));
  };

  render() {
    const r = this.route;
    if (!r || r.points.length < 2) return nothing;
    const pts = r.points, e = pts[pts.length - 1], d = lastDir(pts);
    // the line stops one arrow short of its end; the head fills the gap
    const line = pathOf([...pts.slice(0, -1), { x: e.x - d.x * ARROW, y: e.y - d.y * ARROW }]);
    const on = this.lit || this.selected || this.pointed;
    const p = period(this.kind);
    const flowing = this.selected;
    const title = `${this.kind}${this.label ? ` · ${this.label}` : ''}`;
    const at = labelAt(pts);
    return html`<svg part="svg" class=${on ? 'on' : ''} role="img" aria-label=${title}>
        <title>${title}</title>
        <path class="hit" d=${pathOf(pts)} @pointerenter=${() => this.point(true)} @pointerleave=${() => this.point(false)} />
        <path class="halo" d=${line} />
        <path class=${`line${flowing && p ? ' march' : ''}`} style=${p ? `--_period: ${p}px` : nothing} d=${line} />
        ${flowing && !p ? svg`<path class="flow" d=${line} />` : nothing}
        <path class="h" d=${head(e, d)} />
        ${r.branches.map((b) => svg`<circle class="b" cx=${b.x} cy=${b.y} r=${BRANCH / 2} />`)}
      </svg>
      ${this.pointed && this.label ? html`<span part="label" class="label" style=${`left: ${at.x}px; top: ${at.y}px`}>${title}</span>` : nothing}`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-edge': SettEdge }
}
