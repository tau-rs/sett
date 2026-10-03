// shared by the map stories: the three PoC repositories and the lines a node shows
import { html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { Fixture, FixtureArea, FixtureItem, FixtureUnit, Port } from './fixtures.js';
import { insideOf, itemKindOf, linksOf, opKey, opsOf, portKey, sectionOf, unitOf, unitPorts, wiresOf, type FixtureLink } from './fixtures.js';
import { base, sessionOrder } from '@tau-rs/sett-tokens';
import type { MinimapRect } from './sett-minimap.js';
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
export interface On { session?: string; live?: boolean; also?: string; selected?: boolean }
export type Who = Record<string, On>;

export const itemEl = (it: FixtureItem, on: On = {}) => html`
  <sett-item key=${it.id} kind=${itemKindOf(it)} ?entry=${!!it.entry} ?port=${!!it.port} ?finding=${!!it.finding} family=${ifDefined(it.fam)} session=${ifDefined(on.session)} also=${ifDefined(on.also)} ?live=${on.live} ?selected=${on.selected}>${it.name}</sett-item>`;

export const areaEl = (a: FixtureArea, who: Who = {}, folded = !!a.folded) => html`
  <sett-area key=${a.id} name=${a.name} ?folded=${folded}>${a.items.map((it) => itemEl(it, who[it.id]))}</sett-area>`;

/** the columns of a unit with their areas and items, as the fixture has them */
export const columnsOf = (f: Fixture, id: string, who: Who = {}, foldedAreas: string[] = []) =>
  insideOf(f, id).map((c) => html`<sett-column kind=${c.kind} depth=${ifDefined(c.depth)} label=${c.label}>${c.areas.map((a) => areaEl(a, who, !!a.folded || foldedAreas.includes(a.id)))}</sett-column>`);

/** one `sett-link` from a fixture link; kinds on fixture links are derived from the items (illustrative) */
export const linkEl = (l: FixtureLink) => html`
  <sett-link from=${l.from} to=${l.to} kind=${l.kind} label=${ifDefined(l.label)} ?finding=${l.finding} ?wire=${l.wire}></sett-link>`;
/** the links and port wires of a unit, as `sett-link` children for its sheet */
export const linksEl = (f: Fixture, id: string, wires = true) => html`${linksOf(f, id).map(linkEl)}${wires ? wiresOf(f, id).map(linkEl) : nothing}`;

export interface SheetOpts { folded?: boolean; foldedAreas?: string[]; slot?: string; links?: boolean; wires?: boolean; level?: 'items' | 'areas' | 'plugs'; filter?: string; open?: string; focus?: string }
/** the inside of a unit: exposes rail · columns · needs rail, and the links between the things inside */
export const sheetOf = (f: Fixture, id: string, who: Who = {}, opts: SheetOpts = {}) => html`
  <sett-sheet slot=${ifDefined(opts.slot)} ?folded=${opts.folded} level=${ifDefined(opts.level)} filter=${ifDefined(opts.filter)} open=${ifDefined(opts.open)} focus=${ifDefined(opts.focus)}>${rail(f, id, 'exposes', { slot: 'exposes' })}${columnsOf(f, id, who, opts.foldedAreas)}${rail(f, id, 'needs', { slot: 'needs' })}${opts.links === false ? nothing : linksEl(f, id, opts.wires !== false)}</sett-sheet>`;

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
