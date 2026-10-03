import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { PORT_KINDS, type PortKind } from './sett-port-row.js';
import './sett-port-row.js';
import './sett-contract-card.js';
import './sett-legend.js';

/**
 * The kind table, drawn every way a kind shows on the map: the port row's
 * dot, the edge's colour and stroke (`map.kind.<kind>`), and the contract
 * card's chip. One table, three drawings: a kind never has a second colour.
 * The edge here is the token itself; `sett-edge` (#56) will draw the same.
 */
const meta: Meta = { title: 'map/kinds' };
export default meta;
type Story = StoryObj;

const NAME: Record<PortKind, string> = { rpc: 'zed.proto', http: 'zero2prod · HTTP API', cli: 'rg · command line', topic: 'subscriber.confirmed', crate: 'zed_extension_api', sql: 'postgres', pub: 'Sink', redis: 'session store', fs: 'haystack files', tty: 'stdout', declared: 'zed.dev' };
const edge = (k: PortKind) => html`<svg width="100%" height="12" role="img" aria-label=${`${k} edge`} style="display:block;overflow:visible"><line x1="0" y1="6" x2="100%" y2="6" style=${`stroke:var(--sett-map-kind-${k}-color);stroke-width:var(--sett-stroke-lit);stroke-dasharray:var(--sett-map-kind-${k}-stroke)`} /></svg>`;

export const Kinds: Story = {
  name: 'kinds · the kind table as ports, edges and chips, side by side',
  render: () => html`
    <style>
      .kinds { display: grid; grid-template-columns: var(--sett-map-size-rail) calc(var(--sett-map-size-column) / 2) var(--sett-map-size-panel); gap: var(--sett-space-2) var(--sett-space-5); align-items: center; }
      .kinds h4 { margin: 0; font-family: var(--sett-font-sans); font-size: var(--sett-font-size-xs); font-weight: var(--sett-font-weight-normal); color: var(--sett-color-mute); }
    </style>
    <div class="kinds">
      <h4>port</h4><h4>edge</h4><h4>chip</h4>
      ${PORT_KINDS.map((k) => html`
        <div class="sett-paper"><sett-port-row kind=${k} name=${NAME[k]} count="3"></sett-port-row></div>
        ${edge(k)}
        <sett-contract-card kind=${k} name=${NAME[k]} witness=${k === 'declared' ? '' : 'src/lib.rs:1'}></sett-contract-card>`)}
    </div>`,
};
export const WithTheLegend: Story = {
  name: 'the legend beside the table · the same dots, from the same list',
  render: () => html`<div class="sett-row" style="align-items:flex-start;gap:var(--sett-space-5)">
    <div class="sett-paper" style="width:var(--sett-map-size-rail)">${PORT_KINDS.map((k) => html`<sett-port-row kind=${k} name=${NAME[k]} count="3"></sett-port-row>`)}</div>
    <div class="sett-paper" style="width:var(--sett-map-size-panel);padding:0"><sett-legend open></sett-legend></div>
  </div>`,
};
