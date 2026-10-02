// shared by the map stories: the three PoC repositories and the lines a node shows
import { html, nothing } from 'lit';
import type { Fixture, FixtureUnit, Port } from './fixtures.js';
import { opsOf, sectionOf, unitOf, unitPorts } from './fixtures.js';
import ripgrepJson from './fixtures/ripgrep.json' with { type: 'json' };
import zero2prodJson from './fixtures/zero2prod.json' with { type: 'json' };
import zedJson from './fixtures/zed.json' with { type: 'json' };
import '../tag/sett-tag.js';
import './sett-node.js';
import './sett-port-row.js';
import './sett-rail.js';
import './sett-op-row.js';

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
  ${u.findings ? html`<sett-tag slot="badges" kind="bad">${u.findings} findings</sett-tag>` : nothing}
  ${u.sessions ? html`<sett-tag slot="badges" kind="session">${u.sessions} session${u.sessions > 1 ? 's' : ''}</sett-tag>` : nothing}`;

export const portRow = (p: Port, extra: { compact?: boolean; selected?: boolean; slot?: string; format?: string } = {}, ops: unknown = nothing) => html`
  <sett-port-row slot=${extra.slot ?? p.side} kind=${p.kind} name=${p.name} count=${p.count ?? ''} side=${p.side} format=${extra.format ?? ''} ?compact=${extra.compact} ?selected=${extra.selected}>${ops}</sett-port-row>`;

export const opRow = (o: ReturnType<typeof opsOf>[number], selected = false) => html`
  <sett-op-row kind=${o.kind} method=${o.method ?? ''} path=${o.path ?? ''} returns=${o.returns ?? ''} handler=${o.handler ?? ''} ?selected=${selected}>${o.args ?? o.text ?? ''}</sett-op-row>`;

/** a node at a tier, sized by the tier's token, fed from a fixture unit */
export const node = (f: Fixture, id: string, tier: 'mini' | 'chip' | 'card' | 'sheet', state: Record<string, boolean> = {}, inside: unknown = nothing) => {
  const u = unitOf(f, id);
  const { exposes, needs } = unitPorts(f, id);
  const width = tier === 'mini' ? 'var(--sett-map-threshold-mini)' : tier === 'chip' ? 'var(--sett-map-size-node-chip-w)' : tier === 'card' ? 'var(--sett-map-size-card-interface)' : 'var(--sett-map-size-card-open)';
  const height = tier === 'mini' ? 'auto' : tier === 'chip' ? 'var(--sett-map-size-node-chip-h)' : 'auto';
  return html`<sett-node style="width:${width};height:${height}" name=${u.name} kind=${u.kind} tier=${tier} ?selected=${state.selected} ?focused=${state.focused} ?far=${state.far} ?declared=${state.declared || !!u.declared}>
    ${metaLines(u).map((m) => html`<span>${m}</span>`)}${badges(u)}
    ${tier === 'card' || tier === 'sheet' ? html`${exposes.map((p) => portRow(p))}${needs.map((p) => portRow(p))}` : nothing}
    ${inside}
  </sett-node>`;
};

/** a rail for one side of a unit, ports in their sections with their contract ops */
export const rail = (f: Fixture, id: string, side: 'exposes' | 'needs', extra: { compact?: boolean; selectedPort?: string } = {}) => {
  const ports = unitPorts(f, id)[side];
  return html`<sett-rail side=${side}>
    ${ports.map((p) => portRow(p, { slot: sectionOf(p, f), compact: extra.compact, selected: extra.selectedPort === p.name, format: f.contracts[p.contract]?.format }, opsOf(f, p.contract).map((o) => opRow(o))))}
  </sett-rail>`;
};
