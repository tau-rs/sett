/**
 * Readers for the PoC fixtures (`./fixtures/*.json`, three real repositories).
 * Stories feed the map elements from these; nothing here renders.
 */
import type { OpKind } from './sett-op-row.js';
import type { PortKind, PortSide } from './sett-port-row.js';
import type { RailSection } from './sett-rail.js';
import type { ColumnDepth, ColumnKind } from './sett-column.js';
import type { ItemKind } from './sett-item.js';

/** `[kind, "name · count", area, contract]` as the PoC stores a port */
export type FixturePort = [string, string, string, string];

export interface FixtureUnit {
  id: string; name: string; kind: string; x: number; y: number; layout: 'hexagon' | 'layers';
  crates: number; items: number; areas: number; findings?: number; sessions?: number; meta?: string; declared?: boolean;
  exposes: FixturePort[]; needs: FixturePort[];
}
export interface FixtureContract {
  kind: string; name: string; owner: string; format?: string; witness?: string; ops?: string[];
  handlers?: Record<string, string>; schema?: string[]; used?: string[]; notes?: string;
}
export interface FixtureItem { id: string; name: string; k: string; entry?: number; port?: number; finding?: number; session?: number; fam?: string; ext?: number }
export interface FixtureArea { id: string; col: number; name: string; folded?: number; items: FixtureItem[] }
export interface FixtureInside { layout: 'hexagon' | 'layers'; columns: [string, string][]; areas: FixtureArea[] }
export interface Fixture {
  units: Record<string, FixtureInside>;
  name: string; tagline: string; system: unknown;
  repos: Record<string, { units: FixtureUnit[] }>;
  contracts: Record<string, FixtureContract>;
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
  return { exposes: u.exposes.map((p) => portOf(p, 'exposes')), needs: u.needs.map((p) => portOf(p, 'needs')) };
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

const ITEM_KINDS: ItemKind[] = ['fn', 'struct', 'enum', 'trait', 'impl', 'mod', 'macro', 'external'];
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
