// shared by the map stories: the three PoC repositories and the lines a node shows
import { html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { Fixture, FixtureArea, FixtureItem, FixtureUnit, Port } from './fixtures.js';
import { insideOf, itemKindOf, linksOf, opKey, opsOf, portKey, sectionOf, unitOf, unitPorts, wiresOf, type FixtureLink } from './fixtures.js';
import { offscreenNeighbours, placeHints } from './hints.js';
import { base, sessionOrder } from '@tau-rs/sett-tokens';
import type { MinimapRect } from './sett-minimap.js';
import type { LinkDelta } from './sett-link.js';
import ripgrepJson from './fixtures/ripgrep.json' with { type: 'json' };
import zero2prodJson from './fixtures/zero2prod.json' with { type: 'json' };
import zedJson from './fixtures/zed.json' with { type: 'json' };
import '../tag/sett-tag.js';
import './sett-node.js';
import './sett-port-row.js';
import './sett-rail.js';
import './sett-op-row.js';
import './sett-item.js';
import './sett-area.js';
import './sett-column.js';
import './sett-sheet.js';
import './sett-link.js';
import './sett-edge.js';
import './sett-hint-chip.js';

export const ripgrep = ripgrepJson as unknown as Fixture;
export const zero2prod = zero2prodJson as unknown as Fixture;
export const zed = zedJson as unknown as Fixture;
/** the three real units every map story leans on */
export const UNITS: [Fixture, string][] = [[ripgrep, 'rg'], [zero2prod, 'api'], [zed, 'gpui']];

export const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
export const metaLines = (u: FixtureUnit) => [
  u.layout === 'hexagon' ? 'entry · hexagon' : 'no entry · layers',
  `${u.crates} crate${u.crates > 1 ? 's' : ''} · ${fmt(u.items)} items`,
];
export const badges = (u: FixtureUnit) => html`
  ${u.findings ? html`<sett-tag slot="badges" kind="bad">${u.findings} findings</sett-tag>` : nothing}`;
/** the fixture counts sessions; the node wants their ids: the first n, in session order */
export const sessionsOf = (u: FixtureUnit) => sessionOrder.slice(0, u.sessions ?? 0).join(' ');

export const portRow = (p: Port, extra: { compact?: boolean; selected?: boolean; slot?: string; format?: string } = {}, ops: unknown = nothing) => html`
  <sett-port-row key=${portKey(p)} slot=${extra.slot ?? p.side} kind=${p.kind} name=${p.name} count=${p.count ?? ''} side=${p.side} format=${extra.format ?? ''} ?compact=${extra.compact} ?selected=${extra.selected}>${ops}</sett-port-row>`;

export const opRow = (o: ReturnType<typeof opsOf>[number], selected = false, key?: string) => html`
  <sett-op-row key=${ifDefined(key)} kind=${o.kind} method=${o.method ?? ''} path=${o.path ?? ''} returns=${o.returns ?? ''} handler=${o.handler ?? ''} ?selected=${selected}>${o.args ?? o.text ?? ''}</sett-op-row>`;

/** a node at a tier, sized by the tier's token, fed from a fixture unit; `who` says which sessions are on it and which are working now */
export const node = (f: Fixture, id: string, tier: 'mini' | 'chip' | 'card' | 'sheet', state: Record<string, boolean> = {}, inside: unknown = nothing, who: { sessions?: string; live?: string } = {}) => {
  const u = unitOf(f, id);
  const { exposes, needs } = unitPorts(f, id);
  const width = tier === 'mini' ? 'var(--sett-map-threshold-mini)' : tier === 'chip' ? 'var(--sett-map-size-node-chip-w)' : tier === 'card' ? 'var(--sett-map-size-card-interface)' : inside === nothing ? 'var(--sett-map-size-card-open)' : 'max-content';
  const height = tier === 'mini' ? 'auto' : tier === 'chip' ? 'var(--sett-map-size-node-chip-h)' : 'auto';
  return html`<sett-node style="width:${width};height:${height}" name=${u.name} kind=${u.kind} tier=${tier} ?selected=${state.selected} ?focused=${state.focused} ?far=${state.far} ?declared=${state.declared || !!u.declared} sessions=${who.sessions ?? sessionsOf(u)} live=${who.live ?? ''}>
    ${metaLines(u).map((m) => html`<span>${m}</span>`)}${badges(u)}
    ${tier === 'card' || (tier === 'sheet' && inside === nothing) ? html`${exposes.map((p) => portRow(p))}${needs.map((p) => portRow(p))}` : nothing}
    ${inside}
  </sett-node>`;
};

/** a rail for one side of a unit, ports in their sections with their contract ops */
export const rail = (f: Fixture, id: string, side: 'exposes' | 'needs', extra: { compact?: boolean; selectedPort?: string; slot?: string } = {}) => {
  const ports = unitPorts(f, id)[side];
  return html`<sett-rail side=${side} slot=${ifDefined(extra.slot)}>
    ${ports.map((p) => portRow(p, { slot: sectionOf(p, f), compact: extra.compact, selected: extra.selectedPort === p.name, format: f.contracts[p.contract]?.format }, (f.contracts[p.contract]?.ops ?? []).map((s, i) => opRow(opsOf(f, p.contract)[i], false, opKey(p.contract, s)))))}
  </sett-rail>`;
};

/** who is on which item in a story: a session touching it, working on it now, a second session, or your selection */
export interface On { session?: string; live?: boolean; also?: string; selected?: boolean; planned?: boolean; group?: string; delta?: 'added' | 'changed' | 'removed' | 'unchanged' }
export type Who = Record<string, On>;

export const itemEl = (it: FixtureItem, on: On = {}) => html`
  <sett-item key=${it.id} kind=${itemKindOf(it)} ?entry=${!!it.entry} ?port=${!!it.port} ?finding=${!!it.finding} family=${ifDefined(it.fam)} session=${ifDefined(on.session)} also=${ifDefined(on.also)} ?live=${on.live} ?selected=${on.selected} ?planned=${on.planned} group=${ifDefined(on.group)} delta=${ifDefined(on.delta)}>${it.name}</sett-item>`;

export const areaEl = (a: FixtureArea, who: Who = {}, folded = !!a.folded) => html`
  <sett-area key=${a.id} name=${a.name} ?folded=${folded}>${a.items.map((it) => itemEl(it, who[it.id]))}</sett-area>`;

/** the columns of a unit with their areas and items, as the fixture has them */
export const columnsOf = (f: Fixture, id: string, who: Who = {}, foldedAreas: string[] = []) =>
  insideOf(f, id).map((c) => html`<sett-column kind=${c.kind} depth=${ifDefined(c.depth)} label=${c.label}>${c.areas.map((a) => areaEl(a, who, !!a.folded || foldedAreas.includes(a.id)))}</sett-column>`);

/** the overlays on one line in a story: the plan will add it, or where it stands against main */
export interface LinkOn { planned?: boolean; delta?: LinkDelta }
/** the overlays on a unit's lines, asked per line (its ends are `from` and `to`) */
export type Lines = (l: FixtureLink) => LinkOn | undefined;

/** one `sett-link` from a fixture link; kinds on fixture links are derived from the items (illustrative) */
export const linkEl = (l: FixtureLink, on: LinkOn = {}) => html`
  <sett-link from=${l.from} to=${l.to} kind=${l.kind} label=${ifDefined(l.label)} ?finding=${l.finding} ?wire=${l.wire} ?planned=${on.planned} delta=${ifDefined(on.delta)}></sett-link>`;
/** the links and port wires of a unit, as `sett-link` children for its sheet */
export const linksEl = (f: Fixture, id: string, wires = true, lines: Lines = () => undefined) =>
  html`${[...linksOf(f, id), ...(wires ? wiresOf(f, id) : [])].map((l) => linkEl(l, lines(l)))}`;

export interface SheetOpts { folded?: boolean; foldedAreas?: string[]; slot?: string; links?: boolean; wires?: boolean; level?: 'items' | 'areas' | 'plugs'; filter?: string; open?: string; focus?: string; lines?: Lines }
/** the inside of a unit: exposes rail · columns · needs rail, and the links between the things inside */
export const sheetOf = (f: Fixture, id: string, who: Who = {}, opts: SheetOpts = {}) => html`
  <sett-sheet slot=${ifDefined(opts.slot)} ?folded=${opts.folded} level=${ifDefined(opts.level)} filter=${ifDefined(opts.filter)} open=${ifDefined(opts.open)} focus=${ifDefined(opts.focus)}>${rail(f, id, 'exposes', { slot: 'exposes' })}${columnsOf(f, id, who, opts.foldedAreas)}${rail(f, id, 'needs', { slot: 'needs' })}${opts.links === false ? nothing : linksEl(f, id, opts.wires !== false, opts.lines)}</sett-sheet>`;

/** the sessions on a unit, read from who is on its items: every session named, and the ones live somewhere */
export const sessionsOn = (who: Who) => {
  const on = Object.values(who);
  const uniq = (ids: (string | undefined)[]) => Array.from(new Set(ids.filter((v): v is string => !!v))).join(' ');
  return { sessions: uniq(on.flatMap((o) => [o.session, o.also])), live: uniq(on.filter((o) => o.live).map((o) => o.session)) };
};

/** an open unit: the node at its sheet tier hosting the inside; its head lists the sessions on its items */
export const openUnit = (f: Fixture, id: string, who: Who = {}, opts: SheetOpts = {}) =>
  node(f, id, 'sheet', { focused: true }, sheetOf(f, id, who, { ...opts, slot: 'inside' }), sessionsOn(who));

const num = (v: string) => parseFloat(v);
const S = base.map.size;
/** the units of a fixture's own repo as the minimap's world: one chip-sized rect per unit, where the board places it */
export const boardRects = (f: Fixture, selected?: string): MinimapRect[] =>
  Object.values(f.repos)[0].units
    .map((u) => ({ key: u.id, x: u.x, y: u.y, w: num(S.nodeChipW), h: num(S.nodeChipH), selected: u.id === selected }));
/** the inside of a unit as the minimap's world: a tinted rect per column, then a rect per area, sized as the sheet lays them out */
export const sheetRects = (f: Fixture, id: string, selected?: string): MinimapRect[] => {
  const pad = num(base.space['2']), head = num(S.areaFolded), row = num(S.itemRow), gap = num(base.space['3']);
  const height = (a: FixtureArea) => (a.folded ? head : num(S.areaHeader) + a.items.length * row + pad);
  const cols = insideOf(f, id);
  const tall = Math.max(...cols.map((c) => head + c.areas.reduce((h, a) => h + height(a) + gap, 0)));
  return cols.flatMap((c, i) => {
    const x = i * (num(S.column) + num(S.columnGutter));
    const tone = c.kind === 'layer' ? (c.depth === 'api' ? 'driving' : c.depth === 'leaf' ? 'driven' : 'domain') : (c.kind as 'driving' | 'domain' | 'driven');
    let y = head;
    const areas = c.areas.map((a) => { const r = { key: a.id, x: x + pad, y, w: num(S.column) - pad * 2, h: height(a), selected: a.id === selected }; y += r.h + gap; return r; });
    return [{ key: `col:${i}`, x, y: 0, w: num(S.column), h: tall, tone }, ...areas];
  });
};

// ---- the board: units where the fixture places them, the edges between them (sett-edge, #56)

/** the port a board edge leaves and the one it reaches: the row that names the other unit or shares its contract, else the first of its kind */
export function edgePorts(f: Fixture, e: { f: string; t: string; kind?: string }): { from: number; to: number } {
  const s = unitPorts(f, e.f), t = unitPorts(f, e.t);
  const first = (x: string) => x.split(' · ')[0].trim();
  const tName = first(unitOf(f, e.t).name);
  let from = s.needs.findIndex((p) => !!p.contract && t.exposes.some((q) => q.contract === p.contract));
  if (from < 0) from = s.needs.findIndex((p) => first(p.name) === tName || first(p.name) === e.t);
  if (from < 0) from = Math.max(0, s.needs.findIndex((p) => p.kind === (e.kind ?? 'crate')));
  let to = t.exposes.findIndex((q) => !!q.contract && q.contract === s.needs[from]?.contract);
  if (to < 0) to = 0;
  return { from, to };
}
/** a port row's key on the board: unique per unit, side and row, so two units' ports never collide */
export const boardPortKey = (unit: string, side: 'exposes' | 'needs', i: number) => `${unit}/${side}/${i}`;

export interface BoardScene {
  tier: 'chip' | 'card';
  /** the unit whose edges are lit, with the flow; unrelated units and edges recede */
  selected?: string;
  /** the edge pointed at: lit (a story's play puts the pointer on it to show its label) */
  point?: [string, string];
  /** the unit pointed at, or its hint pill: its edges are lit */
  pointUnit?: string;
  /** the window onto the board, in board pixels; omitted, the whole board */
  view?: { x: number; y: number; w: number; h: number };
  /** units with an agent working now, by id: session ids */
  live?: Record<string, string>;
}
/** the units of a repository at a tier, with their edges, in one positioned board */
export function boardOf(f: Fixture, repo: string, s: BoardScene, extra: unknown = nothing) {
  if (s.view && extra === nothing && s.tier === 'card') extra = hintsOf(f, repo, s.view, { lit: s.pointUnit, live: s.live });
  const R = f.repos[repo], pad = 60, boxes = boardBoxes(f, repo, s.tier);
  const at = (u: FixtureUnit) => boxes[u.id];
  const near = new Set(s.selected ? [s.selected, ...R.edges.filter((e) => e.f === s.selected || e.t === s.selected).flatMap((e) => [e.f, e.t])] : []);
  const w = Math.max(...R.units.map((u) => at(u).x)) + (s.tier === 'card' ? parseFloat(base.map.size.cardInterface) : parseFloat(base.map.size.nodeChipW)) + pad;
  const h = Math.max(...R.units.map((u) => at(u).y + at(u).h)) + pad;
  const unit = (u: FixtureUnit) => {
    const { exposes, needs } = unitPorts(f, u.id), p = at(u);
    const width = s.tier === 'card' ? 'var(--sett-map-size-card-interface)' : 'var(--sett-map-size-node-chip-w)';
    const height = s.tier === 'card' ? 'auto' : 'var(--sett-map-size-node-chip-h)';
    return html`<sett-node key=${u.id} style=${`position:absolute;left:${p.x}px;top:${p.y}px;width:${width};height:${height}`} name=${u.name} kind=${u.kind} tier=${s.tier}
      ?selected=${u.id === s.selected} ?far=${!!s.selected && !near.has(u.id)} ?declared=${!!u.declared} sessions=${s.live?.[u.id] ?? sessionsOf(u)} live=${s.live?.[u.id] ?? ''}>
      ${metaLines(u).map((m) => html`<span>${m}</span>`)}${badges(u)}
      ${s.tier === 'card' ? html`${exposes.map((q, i) => html`<sett-port-row key=${boardPortKey(u.id, 'exposes', i)} slot="exposes" side="exposes" kind=${q.kind} name=${q.name} count=${q.count ?? ''}></sett-port-row>`)}${needs.map((q, i) => html`<sett-port-row key=${boardPortKey(u.id, 'needs', i)} slot="needs" side="needs" kind=${q.kind} name=${q.name} count=${q.count ?? ''}></sett-port-row>`)}` : nothing}
    </sett-node>`;
  };
  const edge = (e: (typeof R.edges)[number]) => {
    const { from, to } = edgePorts(f, e);
    const mine = !!s.selected && (e.f === s.selected || e.t === s.selected), pointed = (!!s.point && s.point[0] === e.f && s.point[1] === e.t) || (!!s.pointUnit && (e.f === s.pointUnit || e.t === s.pointUnit));
    const label = e.label ?? (e.n ? `${e.n} use${e.n > 1 ? 's' : ''}` : e.how);
    return html`<sett-edge from=${e.f} to=${e.t} from-port=${ifDefined(s.tier === 'card' ? boardPortKey(e.f, 'needs', from) : undefined)} to-port=${ifDefined(s.tier === 'card' ? boardPortKey(e.t, 'exposes', to) : undefined)}
      kind=${e.kind ?? 'crate'} label=${ifDefined(label)} ?selected=${mine} ?lit=${pointed} ?far=${!mine && !pointed && (!!s.selected || !!s.point || !!s.pointUnit)}></sett-edge>`;
  };
  const board = html`<div class="board" style=${`position:relative;width:${w}px;height:${h}px`}>${R.units.map(unit)}${R.edges.map(edge)}${extra}</div>`;
  if (!s.view) return board;
  return html`<div class="window" style=${`position:relative;overflow:hidden;width:${s.view.w}px;height:${s.view.h}px;box-shadow:0 0 0 var(--sett-stroke-hair) var(--sett-color-line)`}>
    <div style=${`position:absolute;left:${-s.view.x}px;top:${-s.view.y}px`}>${board}</div></div>`;
}

/** where a repository's units sit on the board at a tier, as boxes (a card's height estimated from its port rows) */
export function boardBoxes(f: Fixture, repo: string, tier: 'chip' | 'card') {
  const R = f.repos[repo], K = tier === 'card' ? parseFloat(base.map.size.cardInterface) / parseFloat(base.map.size.nodeChipW) : 1, pad = 60;
  const minx = Math.min(...R.units.map((u) => u.x)), miny = Math.min(...R.units.map((u) => u.y));
  const row = parseFloat(base.map.size.portRow);
  return Object.fromEntries(R.units.map((u) => {
    const { exposes, needs } = unitPorts(f, u.id);
    const w = tier === 'card' ? parseFloat(base.map.size.cardInterface) : parseFloat(base.map.size.nodeChipW);
    const h = tier === 'card' ? 70 + Math.max(exposes.length, needs.length) * row + 24 : parseFloat(base.map.size.nodeChipH);
    return [u.id, { x: Math.round((u.x - minx) * K + pad), y: Math.round((u.y - miny) * K + pad), w, h }];
  }));
}
/** put the pointer on the edge from `f` to `t` in a story, to show its label */
export async function pointAt(root: HTMLElement, f: string, t: string) {
  const el = root.querySelector(`sett-edge[from="${f}"][to="${t}"]`) as (HTMLElement & { updateComplete: Promise<unknown> }) | null;
  if (!el) return;
  for (let k = 0; k < 20 && !el.shadowRoot?.querySelector('.hit'); k++) await new Promise((r) => setTimeout(r, 50));
  el.shadowRoot?.querySelector('.hit')?.dispatchEvent(new Event('pointerenter'));
}
/** the hint pills of a window onto the board: one per off-screen neighbour, merged when they would touch */
export function hintsOf(f: Fixture, repo: string, view: { x: number; y: number; w: number; h: number }, opts: { lit?: string; live?: Record<string, string> } = {}) {
  const boxes = boardBoxes(f, repo, 'card'), R = f.repos[repo];
  const nameOf = (k: string) => unitOf(f, k).name;
  const keys = offscreenNeighbours({ view, boxes, edges: R.edges });
  const cards = Object.entries(boxes).filter(([, b]) => b.x < view.x + view.w && b.x + b.w > view.x && b.y < view.y + view.h && b.y + b.h > view.y).map(([, b]) => b);
  const size = (ks: string[]) => ({ w: Math.round((ks.length > 1 ? `${ks.length} neighbours · ${ks.slice(0, 2).map(nameOf).join(', ')}` : nameOf(ks[0])).length * 6.8 + 2 * parseFloat(base.space['3'])), h: 2 * parseFloat(base.map.radius.hint) });
  return placeHints({ view, units: keys.map((k) => ({ key: k, box: boxes[k] })), cards, size }).map((h) => {
    const sessions = h.keys.map((k) => opts.live?.[k]).filter(Boolean).join(' ');
    return html`<sett-hint-chip style=${`left:${h.anchor.x}px;top:${h.anchor.y}px`} keys=${h.keys.join(' ')} names=${h.keys.map(nameOf).join(', ')} side=${h.side}
      ?lit=${!!opts.lit && h.keys.includes(opts.lit)} sessions=${sessions} live=${sessions}></sett-hint-chip>`;
  });
}
