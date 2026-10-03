import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { base } from '@tau-rs/sett-tokens';
import { boxIn, scaleOf, selectorFor, signature, unwatch, watch, type Watched } from './lines.js';
import { route, stretches, type Box, type RouteEnd, type RouteLink } from './routes.js';
import { familyOf, isLinkKind } from './link-kinds.js';
import type { SettLink } from './sett-link.js';
import type { BundleBranch, BundleOrigin } from './sett-bundle.js';
import './sett-bundle.js';

const SPACING = parseFloat(base.map.size.track);
const FOLDED = parseFloat(base.map.size.areaFolded);
const HEADER = parseFloat(base.map.size.areaHeader);
const PORT_ROW = parseFloat(base.map.size.portRow);
const LIT = 'sett-item, sett-area, sett-port-row, sett-op-row';
/** what a line leaves at the areas level: an item's area, an op row's port row */
const GROUP = 'sett-area, sett-port-row';

export type SheetLevel = 'items' | 'areas' | 'plugs';

/** what a link's end resolved to: the element, and the folded area hiding it if any */
interface End { el: Element; band: number; hidden?: Element }
/** the two groups a link joins, when they differ: at the areas level every link of a pair is one line */
interface Pair { id: string; from: Element; to: Element; fromKey: string; toKey: string; open: boolean }
/** one `sett-bundle`: the line leaving a group on one side */
interface Bundle { key: string; from: string; name: string; origin?: BundleOrigin; far: boolean; branches: BundleBranch[] }

const originOf = (group: Element): BundleOrigin | undefined => {
  const col = group.closest('sett-column');
  if (!col) return undefined;
  const kind = col.getAttribute('kind') ?? 'domain';
  if (kind !== 'layer') return kind as BundleOrigin;
  const depth = col.getAttribute('depth');
  return depth === 'api' ? 'driving' : depth === 'leaf' ? 'driven' : 'domain';
};

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
 * - **level**: what is drawn at rest. `areas` (the default) draws one line
 *   per pair of areas, header to header: a `sett-bundle` per area, double
 *   where it carries two or more links; the item links appear when pointed
 *   at, pinned or opened by hand. `items` draws every link; `plugs` a dot
 *   beside each connected item with the line on demand. A finding is drawn
 *   item to item in every level.
 * - **open by hand**: the arrow end of a double line opens that pair into
 *   its links, its shared stretch opens everything leaving the area, an
 *   opened line closes its pair (`open`, `sett-open`). The level is the
 *   default for whatever was not opened by hand. Opening never moves another
 *   line: a pair keeps its track while open.
 * - **pins**: a click on an item toggles its `selected`; several at once.
 *   Their links are drawn item to item and everything else recedes.
 * - **filter**: kinds and families to keep; the rest recedes to `map.far`.
 *
 * `folded` folds every area at once.
 *
 * @slot exposes - a `sett-rail side="exposes"`
 * @slot - `sett-column` children, then the `sett-link`s
 * @slot needs - a `sett-rail side="needs"`
 * @fires sett-fold - bubbles from the areas inside
 * @fires sett-open - `{ from, to?, open }` when a pair (`to`), or everything leaving `from`, is opened or closed by hand
 */
@customElement('sett-sheet')
export class SettSheet extends LitElement implements Watched {
  /** fold every area inside, or open them all again */
  @property({ type: Boolean, reflect: true }) folded = false;
  /** what is drawn at rest: one line per pair of areas (`areas`), every link (`items`), or a plug beside each connected item with the lines on demand (`plugs`) */
  @property({ reflect: true }) level: SheetLevel = 'areas';
  /** the pairs opened by hand, space-separated `from>to` area keys; a bare `from` is everything leaving it. Keys here hold no space and no `>` */
  @property({ reflect: true }) open = '';
  /** link kinds and families to keep, space-separated (`calls does`); the rest recedes; empty keeps all */
  @property() filter = '';

  private observer?: MutationObserver;
  private ends = new Map<string, Element | null>();
  private seen = '';
  private hovered?: Element;
  private hoveredLink?: SettLink;
  @state() private bundles: Bundle[] = [];
  /** what `apply` decided, read by `measure`: the pair of each link, the links drawn item to item, the ones the filter keeps */
  private pairs = new Map<SettLink, Pair>();
  private direct = new Set<SettLink>();
  private kept = new Set<SettLink>();
  private pinned = false;
  private litGroup?: string;
  private mode = '';

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
    this.addEventListener('sett-open', this.onOpen as EventListener);
    this.addEventListener('sett-select', this.onSelect);
    this.addEventListener('click', this.onClick);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    unwatch(this);
    this.observer?.disconnect();
    this.removeEventListener('pointerover', this.onOver);
    this.removeEventListener('pointerleave', this.onLeave);
    this.removeEventListener('sett-light', this.onLight as EventListener);
    this.removeEventListener('sett-open', this.onOpen as EventListener);
    this.removeEventListener('sett-select', this.onSelect);
    this.removeEventListener('click', this.onClick);
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('level') || changed.has('filter') || changed.has('open')) this.apply();
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

  // ── open by hand, pins ──────────────────────────────────────────────────────
  private get opened(): Set<string> { return new Set(this.open.split(/\s+/).filter(Boolean)); }
  private onOpen = (e: CustomEvent<{ from: string; to?: string; open: boolean }>) => {
    const { from, to, open } = e.detail;
    const tokens = this.opened;
    const leaving = () => new Set(Array.from(this.pairs.values()).filter((p) => p.fromKey === from).map((p) => p.id));
    if (!to) {
      for (const id of leaving()) tokens.delete(id);
      if (open) tokens.add(from); else tokens.delete(from);
    } else if (open) tokens.add(`${from}>${to}`);
    else {
      // closing one pair of an area opened whole: the others stay open, by name
      if (tokens.delete(from)) for (const id of leaving()) tokens.add(id);
      tokens.delete(`${from}>${to}`);
    }
    this.open = Array.from(tokens).join(' ');
  };
  /** a click on a line that stands for a pair: a single line opens it, an opened line closes it */
  private onClick = (e: Event) => {
    const link = (e.target as Element).closest?.('sett-link') as SettLink | null;
    const pair = link && this.level !== 'items' ? this.pairs.get(link) : undefined;
    if (!pair || (!pair.open && this.direct.has(link!))) return;
    this.dispatchEvent(new CustomEvent('sett-open', { bubbles: true, composed: true, detail: { from: pair.fromKey, to: pair.toKey, open: !pair.open } }));
  };
  /** a click on an item pins it: its links stay drawn, several items at once */
  private onSelect = (e: Event) => {
    const it = e.target as HTMLElement & { selected?: boolean };
    if (it.tagName === 'SETT-ITEM') it.selected = !it.selected;
  };

  /** lights, selection, level, filter and what was opened by hand, written onto the links and the things they end on */
  private apply() {
    const links = this.links;
    const areas = this.level === 'areas';
    const hoveredKey = this.keyOf(this.hovered ?? null);
    // at the areas level, pointing at an area or a port lights its lines; pointing at an item draws that item's links
    const group = areas && this.hovered?.matches(GROUP) ? hoveredKey : undefined;
    const selected = new Set(Array.from(this.querySelectorAll(`${LIT.split(', ').map((t) => `${t}[selected]`).join(', ')}`)).map((el) => this.keyOf(el)).filter((k): k is string => !!k));
    const keep = this.filter.split(/\s+/).filter(Boolean);
    const opened = this.opened;
    const litEnds = new Set<string>();
    this.pairs.clear(); this.direct.clear(); this.kept.clear();
    for (const l of links) {
      const from = this.endOf(l.from)?.closest(GROUP), to = this.endOf(l.to)?.closest(GROUP);
      const fromKey = this.keyOf(from ?? null), toKey = this.keyOf(to ?? null);
      const inside = !!from && from === to;
      let pair: Pair | undefined;
      if (from && to && fromKey && toKey && !inside && !l.finding) {
        const id = `${fromKey}>${toKey}`;
        pair = { id, from, to, fromKey, toKey, open: opened.has(id) || opened.has(fromKey) };
        this.pairs.set(l, pair);
      }
      const touchesHover = !!hoveredKey && !group && (l.from === hoveredKey || l.to === hoveredKey);
      const lit = touchesHover || l === this.hoveredLink || (!!group && !!pair && (pair.fromKey === group || pair.toKey === group));
      l.lit = lit;
      if (l === this.hoveredLink) { litEnds.add(l.from); litEnds.add(l.to); }
      else if (touchesHover) litEnds.add(l.from === hoveredKey ? l.to : l.from);
      const sel = selected.has(l.from) || selected.has(l.to);
      if (sel) l.anchor = selected.has(l.from) ? 'from' : 'to';
      l.selected = sel;
      const kept = !keep.length || keep.includes(l.kind) || keep.includes(familyOf(l.kind) ?? '');
      if (kept) this.kept.add(l);
      l.far = (selected.size > 0 && !sel) || !kept;
      l.plug = this.level === 'plugs' && !pair?.open;
      // a link is drawn item to item when the level says so, and always when it is a finding, pointed at, pinned or opened by hand
      if (!areas || l.finding || touchesHover || sel || pair?.open || (!pair && !inside)) this.direct.add(l);
      l.style.setProperty('--_cursor', pair && this.level !== 'items' && (pair.open || !this.direct.has(l)) ? 'pointer' : 'default');
    }
    for (const el of this.querySelectorAll(LIT)) {
      const k = this.keyOf(el);
      (el as HTMLElement & { lit?: boolean }).lit = !!k && litEnds.has(k) && k !== hoveredKey;
    }
    this.pinned = selected.size > 0;
    this.litGroup = group;
    this.mode = `${this.level}|${this.open}|${this.filter}|${group ?? ''}|${this.pinned}|${links.map((l) => (this.direct.has(l) ? 1 : 0)).join('')}`;
  }

  // ── the watcher: routes follow the DOM ─────────────────────────────────────
  measure() {
    if (!this.isConnected) return;
    const links = this.links;
    const columns = Array.from(this.querySelectorAll(':scope > sett-column'));
    const exposes = this.querySelector(':scope > sett-rail[side="exposes"]'), needs = this.querySelector(':scope > sett-rail[side="needs"]');
    const bandEls = [exposes, ...columns, needs].filter((e): e is Element => !!e);
    if (!links.length || !bandEls.length) { if (this.seen) { this.seen = ''; links.forEach((l) => { l.route = undefined; }); this.bundles = []; } return; }
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
    if (!this.mode) this.apply();
    const areas = this.level === 'areas';
    const ends = links.map((l) => [resolve(l.from), resolve(l.to)] as const);
    const boxes: Box[] = [...bands];
    const groupBox = new Map<Element, Box>();
    if (areas) for (const p of this.pairs.values()) for (const g of [p.from, p.to]) if (!groupBox.has(g)) { const b = box(g); groupBox.set(g, b); boxes.push(b); }
    const endBoxes = ends.map(([a, b]) => [a && box(a.el), b && box(b.el), a?.hidden && box(a.hidden), b?.hidden && box(b.hidden)] as const);
    for (const eb of endBoxes) for (const b of eb) if (b) boxes.push(b);
    const sig = `${signature(boxes)}|${links.map((l) => `${l.from}>${l.to}:${l.kind}${l.wire ? 'w' : ''}`).join()}|${this.mode}`;
    if (sig === this.seen) return;
    this.seen = sig;

    const channelTop = Math.max(...columns.map((c) => { const b = box(c); return b.y + b.h; })) + SPACING / 2;

    // the areas level: one line per pair of groups, header to header, routed first so its tracks never depend on what is opened
    let tracks: number[] | undefined, lanes0 = 0, reserve = 0;
    const single = new Set<SettLink>();
    if (areas) {
      const header = (g: Element): RouteEnd => {
        const b = groupBox.get(g)!;
        const h = g.tagName === 'SETT-AREA' ? (g.hasAttribute('folded') ? FOLDED : HEADER) : PORT_ROW;
        return { box: { ...b, h: Math.min(b.h, h) }, band: bandOf(g), dock: 0.5 };
      };
      const members = new Map<string, { pair: Pair; links: SettLink[] }>();
      for (const [l, p] of this.pairs) {
        if (!shown(p.from) || !shown(p.to)) continue;
        const m = members.get(p.id) ?? { pair: p, links: [] };
        m.links.push(l); members.set(p.id, m);
      }
      const first = route({ bands, links: Array.from(members.values(), ({ pair }) => ({ id: pair.id, from: header(pair.from), to: header(pair.to), trunk: pair.fromKey })), spacing: SPACING, channelTop });
      tracks = first.tracks; lanes0 = first.lanes;
      const trees = new Map<string, { pair: Pair; links: SettLink[] }[]>();
      for (const m of members.values()) {
        const r = first.routes.get(m.pair.id); if (!r) continue;
        const key = `${m.pair.fromKey}|${r.points[1].x >= r.points[0].x ? 'R' : 'L'}`;
        trees.set(key, [...(trees.get(key) ?? []), m]);
      }
      const bundles: Bundle[] = [];
      for (const [key, tree] of trees) {
        const split = stretches(tree.filter((m) => !m.pair.open).map((m) => ({ id: m.pair.id, points: first.routes.get(m.pair.id)!.points })));
        const branches = tree.map(({ pair, links: ls }): BundleBranch => {
          const r = first.routes.get(pair.id)!;
          const st = split.get(pair.id) ?? { shared: [], own: r.points };
          if (ls.length === 1 && !pair.open && !this.direct.has(ls[0])) {
            single.add(ls[0]);
            ls[0].route = { points: st.own, branches: st.shared.length ? [st.own[0]] : [], backward: r.backward };
            ls[0].backward = r.backward;
          }
          return {
            to: pair.toKey, name: pair.to.getAttribute('name') ?? pair.toKey, count: ls.length, shared: st.shared, own: st.own, open: pair.open, backward: r.backward,
            lit: this.litGroup === pair.fromKey || this.litGroup === pair.toKey, far: !ls.some((l) => this.kept.has(l)),
          };
        });
        if (!branches.some((b) => b.count > 1 || b.shared.length)) continue;
        const from = tree[0].pair.from;
        bundles.push({ key, from: tree[0].pair.fromKey, name: from.getAttribute('name') ?? tree[0].pair.fromKey, origin: originOf(from), far: this.pinned, branches });
      }
      this.bundles = bundles;
      // the lanes one pointed item may need, kept free so the sheet does not resize under the pointer
      const far = new Map<string, Set<string>>();
      links.forEach((l, i) => {
        const [a, b] = ends[i]; if (!a || !b || Math.abs(a.band - b.band) < 2) return;
        for (const k of [l.from, l.to]) far.set(k, (far.get(k) ?? new Set()).add(`${l.from}|${familyOf(l.kind) ?? ''}`));
      });
      for (const set of far.values()) reserve = Math.max(reserve, set.size);
    } else if (this.bundles.length) this.bundles = [];

    const input: RouteLink[] = [];
    const docked: Record<string, { from?: boolean; to?: boolean }> = {};
    links.forEach((l, i) => {
      const [a, b] = ends[i]; const [ab, bb, ah, bh] = endBoxes[i];
      if (l.wire && a && b) {
        const port = a.el.closest('sett-port-row') ?? b.el.closest('sett-port-row');
        const kind = port?.getAttribute('kind');
        if (kind) l.style.setProperty('--_wire', `var(--sett-map-kind-${kind}-color)`);
      }
      if (single.has(l)) return;
      // both ends hidden in the same folded area: nothing to draw until it opens
      if (!this.direct.has(l) || !a || !b || !ab || !bb || (a.hidden && a.hidden === b.hidden)) { l.route = undefined; return; }
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
    });
    // the links drawn item to item run between the tracks of the pair lines, and under their lanes
    const { routes, lanes } = route({ bands, links: input, spacing: SPACING, channelTop: channelTop + lanes0 * SPACING, avoid: tracks });
    links.forEach((l, i) => {
      if (single.has(l)) return;
      const r = routes.get(String(i));
      if (!r) { l.route = undefined; return; }
      l.route = { ...r, docked: docked[String(i)] };
      l.backward = r.backward;
    });
    const total = lanes0 + Math.max(lanes, reserve);
    this.style.setProperty('--_channel', total ? `${(total + 0.5) * SPACING}px` : '0');
  }

  render() {
    // before the slots: a double line paints under the areas and under the links drawn on demand
    return html`${this.bundles.map((b) => html`<sett-bundle .from=${b.from} .name=${b.name} .origin=${b.origin} ?far=${b.far} .branches=${b.branches}></sett-bundle>`)}<slot name="exposes"></slot><slot></slot><slot name="needs"></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sett-sheet': SettSheet }
}
