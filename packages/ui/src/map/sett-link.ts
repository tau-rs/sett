import { LitElement, css, html, nothing, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { base } from '@tau-rs/sett-tokens';
import { LINK_KINDS, familyOf, type LinkHead, type LinkKind, type LinkTail } from './link-kinds.js';
import { boxIn, selectorFor, signature, unwatch, watch } from './lines.js';
import { simpleRoute, type Pt, type Route } from './routes.js';
import { durationMs, reducedMotion } from './motion.js';

const ARROW = parseFloat(base.map.size.arrow);
const BRANCH = parseFloat(base.map.size.branch);
const DOT = parseFloat(base.map.size.dot);
const HAIR = parseFloat(base.stroke.hair);

const fmt = (p: Pt) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
const pathOf = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${fmt(p)}`).join(' ');
const dir = (a: Pt, b: Pt): Pt => { const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1; return { x: dx / l, y: dy / l }; };
const add = (p: Pt, d: Pt, k: number): Pt => ({ x: p.x + d.x * k, y: p.y + d.y * k });
const normal = (d: Pt): Pt => ({ x: -d.y, y: d.x });
/** the last segment with a length, so a degenerate corner never flips the head */
const lastDir = (pts: Pt[]): Pt => { for (let i = pts.length - 1; i > 0; i--) if (pts[i].x !== pts[i - 1].x || pts[i].y !== pts[i - 1].y) return dir(pts[i - 1], pts[i]); return { x: 1, y: 0 }; };
const firstDir = (pts: Pt[]): Pt => { for (let i = 1; i < pts.length; i++) if (pts[i].x !== pts[i - 1].x || pts[i].y !== pts[i - 1].y) return dir(pts[i - 1], pts[i]); return { x: 1, y: 0 }; };

/** the head at `e`, arriving along `d`; `a` is `map.size.arrow` */
function head(kind: LinkHead, e: Pt, d: Pt, a = ARROW) {
  const n = normal(d);
  const tri = (tip: Pt) => `M${fmt(tip)} L${fmt(add(add(tip, d, -a), n, a / 2.4))} L${fmt(add(add(tip, d, -a), n, -a / 2.4))} Z`;
  const chev = (tip: Pt) => `M${fmt(add(add(tip, d, -a * 0.8), n, a / 2))} L${fmt(tip)} L${fmt(add(add(tip, d, -a * 0.8), n, -a / 2))}`;
  switch (kind) {
    case 'triangle': return svg`<path class="h filled" d=${tri(e)} />`;
    case 'hollow-triangle': return svg`<path class="h hollow" d=${tri(e)} />`;
    case 'based-triangle': { const b = add(e, d, -a); return svg`<path class="h hollow" d=${tri(e)} /><path class="h open" d=${`M${fmt(add(b, n, a / 1.6))} L${fmt(add(b, n, -a / 1.6))}`} />`; }
    case 'double-hollow-triangle': return svg`<path class="h hollow" d=${tri(add(e, d, -a * 0.7))} /><path class="h hollow" d=${tri(e)} />`;
    case 'chevron': return svg`<path class="h open" d=${chev(e)} />`;
    case 'double-chevron': return svg`<path class="h open" d=${`${chev(e)} ${chev(add(e, d, -a / 2))}`} />`;
    case 'dot': { const c = add(e, d, -a / 2.6); return svg`<circle class="h filled" cx=${c.x} cy=${c.y} r=${a / 2.6} />`; }
    case 'hollow-dot': { const c = add(e, d, -a / 2.6); return svg`<circle class="h hollow" cx=${c.x} cy=${c.y} r=${a / 2.6} />`; }
    case 'bar': return svg`<path class="h open" d=${`M${fmt(add(e, n, a / 2))} L${fmt(add(e, n, -a / 2))}`} />`;
    case 'square': { const s = a * 0.7, c = add(e, d, -s / 2); const p = [add(add(c, d, s / 2), n, s / 2), add(add(c, d, s / 2), n, -s / 2), add(add(c, d, -s / 2), n, -s / 2), add(add(c, d, -s / 2), n, s / 2)]; return svg`<path class="h hollow" d=${`${pathOf(p)} Z`} />`; }
    case 'socket': { const c = add(e, d, -a / 2), r = a / 2, p = add(c, n, r), q = add(c, n, -r); return svg`<path class="h open" d=${`M${fmt(p)} A${r} ${r} 0 0 1 ${fmt(q)}`} />`; }
    default: return nothing;
  }
}
/** the ownership diamond at the start `s`, leaving along `d` */
function tail(kind: LinkTail, s: Pt, d: Pt, a = ARROW) {
  const n = normal(d);
  const p = [s, add(add(s, d, a / 2), n, a / 3.2), add(s, d, a), add(add(s, d, a / 2), n, -a / 3.2)];
  return svg`<path class=${`t ${kind === 'diamond' ? 'filled' : 'hollow'}`} d=${`${pathOf(p)} Z`} />`;
}

/**
 * One line between two things inside an open unit. It names its ends by
 * `key` (`from`, `to`) and never gets coordinates: the `sett-sheet` around it
 * routes every link together (tracks, lanes, trunks, docks) and hands each
 * its path; outside a sheet a link draws the simplest square route between
 * its ends by itself. The grammar is fixed (#58, #68): the line pattern is
 * the family, the head is the kind, a diamond at the start is ownership; the
 * lighter the line, the less the analyser knows. Links never carry presence.
 *
 * Response (DESIGN.md § Motion): `lit` turns it blue (`motion.hover`);
 * `selected` draws it outward from the `anchor` end (`motion.draw`), then
 * the `flow` dashes travel, on the selection alone. A finding is red and
 * heavier on any kind and never recedes.
 *
 * @fires sett-light - `{ on }` when pointed at; the sheet lights it with both ends
 * @csspart svg - the drawing
 */
@customElement('sett-link')
export class SettLink extends LitElement {
  /** the key of the dependent end */
  @property() from = '';
  /** the key of what it depends on */
  @property() to = '';
  @property({ reflect: true }) kind: LinkKind = 'calls';
  /** the exact construct, shown with the kind's name on hover */
  @property() label?: string;
  /** a rule is broken on this line: red and heavier, on any kind */
  @property({ type: Boolean, reflect: true }) finding = false;
  /** the analyser guessed this kind: a lighter line */
  @property({ type: Boolean, reflect: true }) guessed = false;
  /** a port wire: the line takes the port kind's colour (`--_wire`) */
  @property({ type: Boolean, reflect: true }) wire = false;
  /** pointed at, or an end is: blue */
  @property({ type: Boolean, reflect: true }) lit = false;
  /** an end is selected: drawn outward, then flowing */
  @property({ type: Boolean, reflect: true }) selected = false;
  /** the end the selection sits at; the line is drawn outward from it */
  @property({ reflect: true }) anchor: 'from' | 'to' = 'from';
  /** unrelated to the selection or filtered out: `map.far` */
  @property({ type: Boolean, reflect: true }) far = false;
  /** points right to left: a smell (rule 11), set by the sheet from the route */
  @property({ type: Boolean, reflect: true }) backward = false;
  /** the sheet's plugs level: a dot beside each end, the line on demand */
  @property({ type: Boolean, reflect: true }) plug = false;
  /** the geometry, in the coordinates of the positioned ancestor; the sheet sets it */
  @property({ attribute: false }) route?: Route;

  @state() private drawing = false;
  @state() private flowing = false;
  private seen = '';
  private standalone = false;

  static styles = css`
    :host { position: absolute; inset: 0; display: block; pointer-events: none; color: var(--sett-color-mute); }
    :host([guessed]) { color: var(--sett-color-line); }
    :host([kind='refers-to']) { color: var(--sett-color-line2); }
    :host([wire]) { color: var(--_wire, var(--sett-color-mute)); }
    :host([backward]) { color: var(--sett-map-status-smell-color); }
    :host([lit]), :host([selected]) { color: var(--sett-color-sel); }
    :host([finding]) { color: var(--sett-color-bad); }
    :host([far]) { opacity: var(--sett-map-far); }
    :host([far][finding]) { opacity: 1; }
    :host([family='does']) { --_dash: var(--sett-map-link-does-stroke); }
    :host([family='promises']) { --_dash: var(--sett-map-link-promises-stroke); }
    :host([family='knows']) { --_dash: var(--sett-map-link-knows-stroke); }
    :host([family='around']) { --_dash: var(--sett-map-link-around-stroke); }
    svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .hit { fill: none; stroke: transparent; stroke-width: var(--sett-map-size-hit); pointer-events: stroke; cursor: var(--_cursor, default); }
    .line { fill: none; stroke: currentColor; stroke-width: var(--sett-stroke-hair); stroke-dasharray: var(--_dash); transition: stroke var(--sett-motion-hover) ease, stroke-width var(--sett-motion-hover) ease; }
    :host([lit]) .line, :host([selected]) .line, :host([finding]) .line { stroke-width: var(--sett-stroke-lit); }
    .h, .t { transition: stroke var(--sett-motion-hover) ease, fill var(--sett-motion-hover) ease; }
    .filled { fill: currentColor; stroke: none; }
    .hollow { fill: var(--sett-color-paper); stroke: currentColor; stroke-width: var(--sett-stroke-hair); }
    .open { fill: none; stroke: currentColor; stroke-width: var(--sett-stroke-hair); stroke-linecap: round; stroke-linejoin: round; }
    :host([lit]) .hollow, :host([selected]) .hollow, :host([finding]) .hollow,
    :host([lit]) .open, :host([selected]) .open, :host([finding]) .open { stroke-width: var(--sett-stroke-lit); }
    .b { fill: currentColor; }
    .plug { fill: currentColor; }
    .dock { fill: var(--sett-color-sel); stroke: var(--sett-color-paper); stroke-width: var(--sett-map-size-dot-border); }
    .reveal { fill: none; stroke: var(--sett-color-ink); stroke-width: var(--sett-map-size-hit); }
    .flow { fill: none; stroke: var(--sett-color-paper); stroke-width: var(--sett-stroke-hair); stroke-dasharray: var(--sett-map-size-branch) var(--sett-map-size-track); animation: sett-flow var(--sett-motion-flow) linear infinite; }
    @keyframes sett-flow { to { stroke-dashoffset: calc(-1 * (var(--sett-map-size-branch) + var(--sett-map-size-track))); } }
    @media (prefers-reduced-motion: reduce) {
      .line, .h, .t { transition: none; }
      .flow { display: none; }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.standalone = !this.closest('sett-sheet');
    if (this.standalone) watch(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    unwatch(this);
  }

  /** outside a sheet: find both ends among the siblings and draw the simplest square route */
  measure() {
    const host = (this.offsetParent as HTMLElement | null) ?? this.parentElement;
    if (!host) return;
    const find = (k: string) => host.querySelector(selectorFor(k));
    const a = find(this.from), b = find(this.to);
    if (!a || !b) return;
    const boxes = [boxIn(a, host), boxIn(b, host)];
    const sig = signature(boxes);
    if (sig === this.seen) return;
    this.seen = sig;
    const dock = Number(base.map.link[familyOf(this.kind) ?? 'does'].dock);
    this.route = simpleRoute(boxes[0], boxes[1], dock);
    this.backward = this.route.backward;
  }

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('kind')) {
      const f = familyOf(this.kind);
      if (f) this.setAttribute('family', f); else this.removeAttribute('family');
    }
    if (changed.has('selected')) {
      if (this.selected) this.draw();
      else { this.drawing = false; this.flowing = false; }
    }
  }

  /** selecting draws the connections outward from the selection, then the flow dashes travel */
  private draw() {
    if (reducedMotion()) { this.flowing = true; return; }
    this.drawing = true;
    void this.updateComplete.then(() => {
      const reveal = this.shadowRoot?.querySelector('.reveal') as SVGPathElement | null;
      const len = reveal && typeof reveal.getTotalLength === 'function' && typeof reveal.animate === 'function' ? reveal.getTotalLength() : 0;
      const settle = () => { if (this.selected) { this.drawing = false; this.flowing = true; } };
      if (!len) { settle(); return; }
      const anim = reveal!.animate(
        [{ strokeDasharray: `${len} ${len}`, strokeDashoffset: this.anchor === 'to' ? -len : len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }],
        { duration: durationMs(base.motion.draw), easing: 'ease-out', fill: 'forwards' },
      );
      (anim?.finished ?? Promise.resolve()).then(settle, settle);
    });
  }

  private light = (on: boolean) => {
    this.dispatchEvent(new CustomEvent('sett-light', { bubbles: true, composed: true, detail: { on } }));
    if (this.standalone) this.lit = on;
  };

  render() {
    const r = this.route;
    if (!r || r.points.length < 2) return nothing;
    const spec = LINK_KINDS[this.kind] ?? LINK_KINDS['refers-to'];
    const pts = r.points, s = pts[0], e = pts[pts.length - 1];
    const d0 = firstDir(pts), d1 = lastDir(pts);
    const trim = spec.head === 'socket' ? ARROW / 2 : 0;
    const line = pathOf(trim ? [...pts.slice(0, -1), add(e, d1, -trim)] : pts);
    const full = pathOf(pts);
    const quiet = this.plug && !this.lit && !this.selected && !this.finding;
    const title = `${spec.label}${this.label ? ` · ${this.label}` : ''}`;
    return html`<svg part="svg" aria-label=${title} role="img">
      <title>${title}</title>
      ${this.drawing ? svg`<mask id="reveal" mask-type="alpha" maskUnits="userSpaceOnUse" x="-100000" y="-100000" width="200000" height="200000"><path class="reveal" d=${full} /></mask>` : nothing}
      <path class="hit" d=${full} @pointerenter=${() => this.light(true)} @pointerleave=${() => this.light(false)} />
      <g mask=${this.drawing ? 'url(#reveal)' : nothing}>
        ${quiet ? nothing : svg`<path class="line" d=${line} />${head(spec.head, e, d1)}${spec.tail ? tail(spec.tail, s, d0) : nothing}${r.branches.map((b) => svg`<circle class="b" cx=${b.x} cy=${b.y} r=${BRANCH / 2} />`)}`}
        ${this.flowing && !quiet ? svg`<path class="flow" d=${line} />` : nothing}
      </g>
      ${this.plug && !r.docked?.from ? svg`<circle class="plug" cx=${s.x + d0.x * (BRANCH / 2 + HAIR)} cy=${s.y + d0.y * (BRANCH / 2 + HAIR)} r=${BRANCH / 2} />` : nothing}
      ${this.plug && !r.docked?.to ? svg`<circle class="plug" cx=${e.x - d1.x * (BRANCH / 2 + HAIR)} cy=${e.y - d1.y * (BRANCH / 2 + HAIR)} r=${BRANCH / 2} />` : nothing}
      ${this.selected && r.docked?.from ? svg`<circle class="dock" cx=${s.x} cy=${s.y} r=${DOT / 2} />` : nothing}
      ${this.selected && r.docked?.to ? svg`<circle class="dock" cx=${e.x} cy=${e.y} r=${DOT / 2} />` : nothing}
    </svg>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-link': SettLink }
}
