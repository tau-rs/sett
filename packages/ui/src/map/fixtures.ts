/**
 * Readers for the PoC fixtures (`./fixtures/*.json`, three real repositories).
 * Stories feed the map elements from these; nothing here renders.
 */
import type { OpKind } from './sett-op-row.js';
import type { PortKind, PortSide } from './sett-port-row.js';
import type { RailSection } from './sett-rail.js';
import type { ColumnDepth, ColumnKind } from './sett-column.js';
import type { ItemKind } from './sett-item.js';
import type { LinkKind } from './link-kinds.js';

/** `[kind, "name · count", area, contract]` as the PoC stores a port */
export type FixturePort = [string, string, string, string];

export interface FixtureUnit {
  id: string; name: string; kind: string; x: number; y: number; layout: 'hexagon' | 'layers';
  crates: number; items: number; areas: number; findings?: number; sessions?: number; meta?: string; declared?: boolean;
  /** absent on a unit only drawn as a neighbour (zed's `ext` and `cloud` repos): no ports */
  exposes?: FixturePort[]; needs?: FixturePort[];
}
export interface FixtureContract {
  kind: string; name: string; owner: string; format?: string; witness?: string; ops?: string[];
  handlers?: Record<string, string>; schema?: string; used?: [string, string][]; notes?: string;
}
/** `[n, text, state?]`: a line of code; `hl` is the item's own span, `bad` the line a finding points at */
export type FixtureCodeLine = [number, string, ('hl' | 'bad')?];
/** the code of an item: where it is, who calls it, what it calls (`[item id, label]`), and its lines */
export interface FixtureCode { file: string; line: number; unit: string; callers: [string, string][]; calls: [string, string][]; lines: FixtureCodeLine[] }
export interface FixtureItem { id: string; name: string; k: string; entry?: number; port?: number; finding?: number; session?: number; fam?: string; ext?: number }
export interface FixtureArea { id: string; col: number; name: string; folded?: number; items: FixtureItem[] }
/** `[from, to, { impl?, smell?, label? }]` as the PoC stores a link; a layered unit stores leaf → public */
export type FixtureLinkRow = [string, string, { impl?: number; smell?: number; label?: string }?];
export interface FixtureInside { layout: 'hexagon' | 'layers'; columns: [string, string][]; areas: FixtureArea[]; links?: FixtureLinkRow[] }
export interface Fixture {
  units: Record<string, FixtureInside>;
  name: string; tagline: string; system: unknown;
  repos: Record<string, { units: FixtureUnit[] }>;
  contracts: Record<string, FixtureContract>;
  code: Record<string, FixtureCode>;
}

export interface Port { kind: PortKind; name: string; count?: string; area: string; contract: string; side: PortSide }
export interface Op { kind: OpKind; method?: string; path?: string; returns?: string; handler?: string; text?: string; args?: string }

const KINDS: PortKind[] = ['rpc', 'http', 'cli', 'topic', 'crate', 'sql', 'pub', 'redis', 'fs', 'tty', 'declared'];
const asKind = (k: string): PortKind => (KINDS.includes(k as PortKind) ? (k as PortKind) : 'crate');

/** `"postgres · 6 tables"` → name `postgres`, count `6 tables`; a tail that does not start with a digit stays in the name */
export function splitLabel(label: string): { name: string; count?: string } {
  const i = label.lastIndexOf(' · ');
  if (i < 0) return { name: label };
  const tail = label.slice(i + 3);
  return /^\d/.test(tail) ? { name: label.slice(0, i), count: tail } : { name: label };
}

export const portOf = (t: FixturePort, side: PortSide): Port => ({ kind: asKind(t[0]), ...splitLabel(t[1]), area: t[2], contract: t[3], side });

export function unitOf(f: Fixture, id: string): FixtureUnit {
  for (const r of Object.values(f.repos)) for (const u of r.units) if (u.id === id) return u;
  throw new Error(`no unit ${id} in ${f.name}`);
}
export const unitPorts = (f: Fixture, id: string) => {
  const u = unitOf(f, id);
  return { exposes: (u.exposes ?? []).map((p) => portOf(p, 'exposes')), needs: (u.needs ?? []).map((p) => portOf(p, 'needs')) };
};

const ROUTE = /^(GET|POST|PUT|PATCH|DELETE)\s+(\S+)(?:\s*→\s*(.+))?$/;
const FLAG = /^(-\S+)\s+(.*)$/;
const RPC = /^([\w:]+(?:::\w+)*)\((.*?)\)(?:\s*→\s*(.+))?$/;

/** one contract op string → op-row props; the contract's `handlers` map wires a route to the item that handles it */
export function opOf(s: string, c: FixtureContract): Op {
  let m = s.match(ROUTE);
  if (m) return { kind: 'route', method: m[1], path: m[2], returns: m[3], handler: c.handlers?.[`${m[1]} ${m[2]}`] ?? c.handlers?.[m[2]] };
  if (c.kind === 'cli' && (m = s.match(FLAG))) return { kind: 'flag', method: m[1].split('/')[0], path: m[2] };
  if ((c.kind === 'pub' || c.kind === 'rpc') && (m = s.match(RPC))) return { kind: 'rpc', path: m[1], args: m[2], returns: m[3] };
  if (c.kind === 'sql' && !/\s/.test(s)) return { kind: 'table', text: s };
  if (c.kind === 'sql') return { kind: 'schema', text: s };
  return { kind: 'text', text: s };
}
export const opsOf = (f: Fixture, contract: string): Op[] => (f.contracts[contract]?.ops ?? []).map((s) => opOf(s, f.contracts[contract]));

/**
 * The rail section a port belongs to, in the PoC's categorisation. A service
 * is ours or a third party's by its contract's owner; one we need whose
 * contract names no owner can be neither, and is unresolved (rule 6).
 */
export function sectionOf(p: Port, f: Fixture): RailSection {
  const c = f.contracts[p.contract];
  switch (p.kind) {
    case 'http': case 'rpc': case 'cli':
      if (!c?.owner && p.side === 'needs') return 'unresolved';
      return c && c.owner !== f.name ? 'third-party' : 'services';
    case 'topic': return 'events';
    case 'sql': case 'redis': return 'data';
    case 'fs': case 'tty': return 'system';
    default: return 'crates';
  }
}

const ITEM_KINDS: ItemKind[] = ['fn', 'struct', 'enum', 'trait', 'impl', 'mod', 'macro', 'external', 'const', 'static', 'type-alias', 'union'];
/** the item kind for a fixture item; an item of an outbound column is external */
export const itemKindOf = (it: FixtureItem): ItemKind => (it.ext ? 'external' : ITEM_KINDS.includes(it.k as ItemKind) ? (it.k as ItemKind) : 'fn');

export interface InsideColumn { kind: ColumnKind; depth?: ColumnDepth; label: string; areas: FixtureArea[] }
/**
 * The columns of an open unit with their areas. An `outbound` column is left
 * out on purpose: externals are an interface, not a column (rule 6); they are
 * ports on the needs rail. The fixtures list a layered unit leaf first; it is
 * read public API first, so "uses" points left to right as in a hexagon
 * (rule 11), and each layer says its depth for the tint.
 */
export function insideOf(f: Fixture, id: string): InsideColumn[] {
  const u = f.units[id];
  if (!u) throw new Error(`no inside for unit ${id} in ${f.name}`);
  const cols = u.columns
    .map(([kind, label], i) => ({ kind, label, areas: u.areas.filter((a) => a.col === i) }))
    .filter((c) => c.kind !== 'outbound')
    .map((c): InsideColumn => ({ ...c, kind: (['driving', 'domain', 'driven'].includes(c.kind) ? c.kind : 'layer') as ColumnKind }));
  if (u.layout !== 'layers') return cols;
  return cols.reverse().map((c, i) => ({ ...c, depth: i === 0 ? 'api' : i === cols.length - 1 ? 'leaf' : 'internal' }));
}

/** one line inside a unit, ready for `sett-link`: ends by key, a kind, the finding overlay, and whether it is a port wire */
export interface FixtureLink { from: string; to: string; kind: LinkKind; finding?: boolean; label?: string; wire?: boolean }

/** the key of a port row in a story: side and contract, unique inside a unit */
export const portKey = (p: Port): string => `${p.side}:${p.contract}`;
/** the key of an op row in a story: its contract and the op as written */
export const opKey = (contract: string, op: string): string => `${contract}:${op}`;

/**
 * The kind of a fixture link, derived from the two items (illustrative: the
 * fixtures carry `impl` and `smell` only; the analyser will emit a kind per
 * link, #58). A smell is the finding overlay, not a kind. A const or a static
 * is read, a union holds like a struct, an alias is a type in use, as
 * arch-analyze derives them; none of the three datasets has such an item yet.
 */
export function linkKindOf(from: FixtureItem, to: FixtureItem, opts: FixtureLinkRow[2] = {}): LinkKind {
  if (to.ext) return 'calls-out';
  if (opts.impl) return 'implements';
  if (to.k === 'macro') return 'expands';
  if (from.k === 'mod') return from.name.startsWith('pub use') ? 're-exports' : 'calls';
  if (to.k === 'const' || to.k === 'static') return 'reads';
  if (to.k === 'trait') {
    if (from.k === 'impl' || from.k === 'struct' || from.k === 'enum') return 'implements';
    if (from.k === 'trait') return 'refines';
    return to.port ? 'calls-port' : 'uses-type';
  }
  switch (from.k) {
    case 'fn':
    case 'impl':
      if (to.k === 'fn') return 'calls';
      if (to.k === 'enum') return 'matches-on';
      if (to.k === 'struct' || to.k === 'union') return /::(parse|new|build|from)\b/.test(to.name) ? 'constructs' : 'uses-type';
      if (to.k === 'type-alias') return 'uses-type';
      return 'refers-to';
    case 'struct':
    case 'union':
      if (to.k === 'fn') return 'calls';
      if (to.k === 'struct' || to.k === 'enum' || to.k === 'union') return 'holds';
      return 'uses-type';
    case 'enum':
    case 'trait':
      return to.k === 'fn' ? 'calls' : 'uses-type';
    default:
      return 'refers-to';
  }
}

/** every item of a unit by id */
export const itemsOf = (f: Fixture, id: string): Record<string, FixtureItem> => {
  const u = f.units[id];
  if (!u) throw new Error(`no inside for unit ${id} in ${f.name}`);
  return Object.fromEntries(u.areas.flatMap((a) => a.items.map((it) => [it.id, it])));
};

/**
 * The links of a unit, from the dependent to what it depends on. A layered
 * unit stores its pairs leaf → public (lane F); they are flipped here so
 * "uses" points left to right under both column rules (rule 11).
 */
export function linksOf(f: Fixture, id: string): FixtureLink[] {
  const u = f.units[id];
  const items = itemsOf(f, id);
  return (u.links ?? []).map(([a, b, opts = {}]) => {
    const [from, to] = u.layout === 'layers' ? [b, a] : [a, b];
    const l: FixtureLink = { from, to, kind: linkKindOf(items[from], items[to], opts) };
    if (opts.smell) l.finding = true;
    if (opts.label) l.label = opts.label;
    return l;
  });
}

/**
 * The port wires of a unit: a route with a handler wires its op row to that
 * item; a port without handlers wires to its area, into the unit on the
 * exposes side and out of it on the needs side.
 */
export function wiresOf(f: Fixture, id: string): FixtureLink[] {
  const { exposes, needs } = unitPorts(f, id);
  const out: FixtureLink[] = [];
  for (const p of exposes) {
    const c = f.contracts[p.contract];
    const handled = (c?.ops ?? []).filter((op) => opOf(op, c).handler);
    if (handled.length) for (const op of handled) out.push({ from: opKey(p.contract, op), to: opOf(op, c).handler!, kind: 'calls', wire: true });
    else out.push({ from: portKey(p), to: p.area, kind: 'calls', wire: true });
  }
  for (const p of needs) out.push({ from: p.area, to: portKey(p), kind: 'calls-out', wire: true });
  return out;
}
