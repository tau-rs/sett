import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { base } from '@tau-rs/sett-tokens';
import { boxIn, scaleOf, selectorFor, signature, unwatch, watch, type Watched } from './lines.js';
import { route, type Box, type RouteLink } from './routes.js';
import { familyOf, isLinkKind } from './link-kinds.js';
import type { SettLink } from './sett-link.js';

const SPACING = parseFloat(base.map.size.track);
const FOLDED = parseFloat(base.map.size.areaFolded);
const HEADER = parseFloat(base.map.size.areaHeader);
const LIT = 'sett-item, sett-area, sett-port-row, sett-op-row';

/** what a link's end resolved to: the element, and the folded area hiding it if any */
interface End { el: Element; band: number; hidden?: Element }

/**
 * The inside of an open unit: the exposes rail, the columns, the needs rail,
 * in one row, and the `sett-link`s between the things inside, drawn over it.
 * Everything is laid out by normal flow; the sheet is the one element that
 * sees every link, so the rules are written once here and not by each app:
 *
 * - **routes**: square lines on tracks in the gutters (`map.size.track`
 *   apart), one trunk per source item and family with a dot at each branch;
 *   a link skipping a column takes a lane in the channel under the columns,
 *   one inside a column runs beside it; a right-to-left line is a smell.
 * - **the watcher**: each frame the ends are read and only the paths whose
 *   ends moved are rewritten, so folding, pulses and re-renders never leave
 *   a line pointing at nothing (`lines.ts`; it sleeps when no sheet is shown).
 * - **response** (DESIGN.md § Motion): pointing at an item lights its links
 *   and the item at the other end; selecting draws its links outward, the
 *   flow travels on them alone and every other link recedes to `map.far`.
 * - **folds**: an end hidden by a folded area rides the area's edge to the
 *   chip; a selected one gets the blue dock dot where it plugs in.
 * - **level**: `items` draws every link at rest, `plugs` a dot beside each
 *   connected item with the line on demand. A finding is drawn in every level.
 * - **filter**: kinds and families to keep; the rest recedes to `map.far`.
 *
 * `folded` folds every area at once.
 *
 * @slot exposes - a `sett-rail side="exposes"`
 * @slot - `sett-column` children, then the `sett-link`s
 * @slot needs - a `sett-rail side="needs"`
 * @fires sett-fold - bubbles from the areas inside
 */
@customElement('sett-sheet')
export class SettSheet extends LitElement implements Watched {
  /** fold every area inside, or open them all again */
  @property({ type: Boolean, reflect: true }) folded = false;
  /** what is drawn at rest: every link (`items`), or a plug beside each connected item with the lines on demand (`plugs`) */
  @property({ reflect: true }) level: 'items' | 'plugs' = 'items';
  /** link kinds and families to keep, space-separated (`calls does`); the rest recedes; empty keeps all */
  @property() filter = '';

  private observer?: MutationObserver;
  private ends = new Map<string, Element | null>();
  private seen = '';
  private hovered?: Element;
  private hoveredLink?: SettLink;

  static styles = css`
    :host { position: relative; display: flex; align-items: flex-start; gap: var(--sett-map-size-column-gutter); padding-bottom: var(--_channel, 0); }
  `;

  connectedCallback() {
    super.connectedCallback();
    watch(this);
    if (typeof MutationObserver === 'function') {
      this.observer = new MutationObserver((rs) => this.onMutation(rs));
      this.observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['selected', 'key', 'data-id', 'kind', 'from', 'to', 'finding'] });
    }
    this.addEventListener('pointerover', this.onOver);
    this.addEventListener('pointerleave', this.onLeave);
    this.addEventListener('sett-light', this.onLight as EventListener);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    unwatch(this);
    this.observer?.disconnect();
    this.removeEventListener('pointerover', this.onOver);
    this.removeEventListener('pointerleave', this.onLeave);
    this.removeEventListener('sett-light', this.onLight as EventListener);
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('level') || changed.has('filter')) this.apply();
    if (!changed.has('folded') || (changed.get('folded') === undefined && !this.folded)) return;
    this.querySelectorAll('sett-area').forEach((a) => { (a as HTMLElement & { folded: boolean }).folded = this.folded; });
  }

  /** the links the sheet coordinates */
  get links(): SettLink[] { return Array.from(this.querySelectorAll('sett-link')) as SettLink[]; }

  private onMutation(records: MutationRecord[]) {
    if (records.some((r) => r.type === 'childList' || r.attributeName === 'key' || r.attributeName === 'data-id')) { this.ends.clear(); this.seen = ''; }
    this.apply();
  }

  /** the element a key names, cached until the children change */
  private endOf(key: string): Element | null {
    let el = this.ends.get(key);
    if (el === undefined || (el && !el.isConnected)) { el = this.querySelector(selectorFor(key)); this.ends.set(key, el); }
    return el;
  }
  private keyOf = (el: Element | null): string | undefined => el?.getAttribute('key') ?? el?.getAttribute('data-id') ?? undefined;

  // ── response: pointing ──────────────────────────────────────────────────────
  private onOver = (e: Event) => {
    const el = (e.target as Element).closest?.(LIT) ?? undefined;
    if (el === this.hovered) return;
    this.hovered = el && this.contains(el) ? el : undefined;
    this.apply();
  };
  private onLeave = () => { this.hovered = undefined; this.hoveredLink = undefined; this.apply(); };
  private onLight = (e: CustomEvent<{ on: boolean }>) => {
    const link = e.target as SettLink;
    this.hoveredLink = e.detail.on ? link : this.hoveredLink === link ? undefined : this.hoveredLink;
    this.apply();
  };

  /** lights, selection, level and filter, written onto the links and the things they end on */
  private apply() {
    const links = this.links;
    const hoveredKey = this.keyOf(this.hovered ?? null);
    const selected = new Set(Array.from(this.querySelectorAll(`${LIT.split(', ').map((t) => `${t}[selected]`).join(', ')}`)).map((el) => this.keyOf(el)).filter((k): k is string => !!k));
    const keep = this.filter.split(/\s+/).filter(Boolean);
    const litEnds = new Set<string>();
    for (const l of links) {
      const touchesHover = !!hoveredKey && (l.from === hoveredKey || l.to === hoveredKey);
      const lit = touchesHover || l === this.hoveredLink;
      l.lit = lit;
      if (l === this.hoveredLink) { litEnds.add(l.from); litEnds.add(l.to); }
      else if (touchesHover) litEnds.add(l.from === hoveredKey ? l.to : l.from);
      const sel = selected.has(l.from) || selected.has(l.to);
      if (sel) l.anchor = selected.has(l.from) ? 'from' : 'to';
      l.selected = sel;
      const kept = !keep.length || keep.includes(l.kind) || keep.includes(familyOf(l.kind) ?? '');
      l.far = (selected.size > 0 && !sel) || !kept;
      l.plug = this.level === 'plugs';
    }
    for (const el of this.querySelectorAll(LIT)) {
      const k = this.keyOf(el);
      (el as HTMLElement & { lit?: boolean }).lit = !!k && litEnds.has(k) && k !== hoveredKey;
    }
  }

  // ── the watcher: routes follow the DOM ─────────────────────────────────────
  measure() {
    if (!this.isConnected) return;
    const links = this.links;
    const columns = Array.from(this.querySelectorAll(':scope > sett-column'));
    const exposes = this.querySelector(':scope > sett-rail[side="exposes"]'), needs = this.querySelector(':scope > sett-rail[side="needs"]');
    const bandEls = [exposes, ...columns, needs].filter((e): e is Element => !!e);
    if (!links.length || !bandEls.length) { if (this.seen) { this.seen = ''; links.forEach((l) => { l.route = undefined; }); } return; }
    const origin = this.getBoundingClientRect(), scale = scaleOf(this);
    const box = (el: Element) => boxIn(el, this, origin, scale);
    const bands = bandEls.map(box);
    const bandOf = (el: Element): number => {
      const c = el.closest('sett-column'); if (c) return bandEls.indexOf(c);
      const r = el.closest('sett-rail'); return r ? bandEls.indexOf(r) : -1;
    };
    const shown = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 || r.height > 0; };
    const resolve = (key: string): End | undefined => {
      let el = this.endOf(key); if (!el) return undefined;
      // an op row folded behind `… n more` is not drawn: its wire lands on the port row that holds it
      if (!shown(el)) { const row = el.closest('sett-port-row'); if (!row || row === el || !shown(row)) return undefined; el = row; }
      const band = bandOf(el); if (band < 0) return undefined;
      const area = el.closest('sett-area[folded]');
      return { el, band, hidden: area && area !== el ? area : undefined };
    };
    const ends = links.map((l) => [resolve(l.from), resolve(l.to)] as const);
    const boxes: Box[] = [...bands];
    const endBoxes = ends.map(([a, b]) => [a && box(a.el), b && box(b.el), a?.hidden && box(a.hidden), b?.hidden && box(b.hidden)] as const);
    for (const eb of endBoxes) for (const b of eb) if (b) boxes.push(b);
    const sig = `${signature(boxes)}|${links.map((l) => `${l.from}>${l.to}:${l.kind}${l.wire ? 'w' : ''}`).join()}`;
    if (sig === this.seen) return;
    this.seen = sig;

    const channelTop = Math.max(...columns.map((c) => { const b = box(c); return b.y + b.h; })) + SPACING / 2;
    const input: RouteLink[] = [];
    const docked: Record<string, { from?: boolean; to?: boolean }> = {};
    links.forEach((l, i) => {
      const [a, b] = ends[i]; const [ab, bb, ah, bh] = endBoxes[i];
      // both ends hidden in the same folded area: nothing to draw until it opens
      if (!a || !b || !ab || !bb || (a.hidden && a.hidden === b.hidden)) { l.route = undefined; return; }
      const fam = l.wire ? undefined : familyOf(isLinkKind(l.kind) ? l.kind : 'refers-to');
      const dock = fam ? Number(base.map.link[fam].dock) : 0.5;
      const end = (e: End, eb: Box, hb: Box | undefined, d: number) => {
        if (hb) {
          // hidden by a fold: ride the area's edge up to the chip, and dock on its middle once it is shut
          const mid = hb.y + FOLDED / 2, y = Math.min(Math.max(eb.y + eb.h * d, mid), Math.max(mid, hb.y + hb.h - FOLDED / 2));
          return { box: { x: hb.x, y: y - eb.h / 2, w: hb.w, h: eb.h }, band: e.band, dock: 0.5 };
        }
        if (e.el.tagName === 'SETT-AREA') return { box: { ...eb, h: Math.min(eb.h, e.el.hasAttribute('folded') ? FOLDED : HEADER) }, band: e.band, dock: 0.5 };
        return { box: eb, band: e.band, dock: d };
      };
      const id = String(i);
      input.push({ id, from: end(a, ab, ah, dock), to: end(b, bb, bh, dock), trunk: `${l.from}|${fam ?? 'wire'}` });
      docked[id] = { from: !!ah, to: !!bh };
      if (l.wire) {
        const port = a.el.closest('sett-port-row') ?? b.el.closest('sett-port-row');
        const kind = port?.getAttribute('kind');
        if (kind) l.style.setProperty('--_wire', `var(--sett-map-kind-${kind}-color)`);
      }
    });
    const { routes, lanes } = route({ bands, links: input, spacing: SPACING, channelTop });
    links.forEach((l, i) => {
      const r = routes.get(String(i));
      if (!r) { l.route = undefined; return; }
      l.route = { ...r, docked: docked[String(i)] };
      l.backward = r.backward;
    });
    this.style.setProperty('--_channel', lanes ? `${(lanes + 0.5) * SPACING}px` : '0');
  }

  render() {
    return html`<slot name="exposes"></slot><slot></slot><slot name="needs"></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-sheet': SettSheet }
}
