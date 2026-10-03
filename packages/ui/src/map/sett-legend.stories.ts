import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import type { Fixture } from './fixtures.js';
import { openUnit, ripgrep, zed, zero2prod } from './map-fixtures.stories-helpers.js';
import './sett-legend.js';
import './sett-panel.js';
import './sett-position.js';
import type { SettLegend } from './sett-legend.js';
import type { SettSheet } from './sett-sheet.js';

/**
 * The key to the map, and the control that filters its links. On demand
 * (map rule 8): a section of the map's panel, folded to one row. The story
 * plays the host: it copies `sett-filter` back onto the legend, and onto the
 * `sett-sheet` when there is one.
 */
const meta: Meta = {
  title: 'map/legend',
  component: 'sett-legend',
  args: { filter: '', open: true, expanded: 'does' },
  render: ({ filter, open, expanded }) => holder(legend({ filter, open, expanded })),
};
export default meta;
type Story = StoryObj;

interface Opts { filter?: string; open?: boolean; expanded?: string }
const host = (e: Event) => {
  const filter = (e as CustomEvent<{ filter: string }>).detail.filter;
  (e.target as SettLegend).filter = filter;
  const sheet = (e.currentTarget as HTMLElement).closest('[data-scene]')?.querySelector('sett-sheet') as SettSheet | null;
  if (sheet) sheet.filter = filter;
};
const legend = (o: Opts = {}) => html`<sett-legend filter=${o.filter ?? ''} ?open=${o.open ?? true} expanded=${o.expanded ?? ''} @sett-filter=${host}></sett-legend>`;
const holder = (p: unknown, label = '') => html`<div style="width:var(--sett-map-size-panel)">${label ? html`<div style="font-size:var(--sett-font-size-xs);color:var(--sett-color-mute);margin-bottom:var(--sett-space-1)">${label}</div>` : ''}<div class="sett-paper" style="padding:0">${p}</div></div>`;
const row = (...cols: unknown[]) => html`<div class="sett-row" style="align-items:flex-start;gap:var(--sett-space-4)">${cols}</div>`;

export const Default: Story = {};
export const OnDemand: Story = {
  name: 'on demand · folded to one row; with a filter on, the row says how much is shown',
  render: () => row(holder(legend({ open: false }), 'at rest'), holder(legend({ open: false, filter: 'does promises around' }), 'a family is off'), holder(legend({ open: false, filter: 'none' }), 'nothing is shown')),
};
export const Open: Story = { name: 'open · four families, the fallback, the finding, the port kinds', render: () => holder(legend()) };
export const Families: Story = {
  name: 'families · a toggle each: all on, one off, nothing shown',
  render: () => row(holder(legend(), 'all on'), holder(legend({ filter: 'does promises around refers-to' }), 'knows is off'), holder(legend({ filter: 'none' }), 'nothing shown')),
};
export const Kinds: Story = {
  name: 'kinds · every family listed: one toggle per kind, the swatch is the family\'s line and the kind\'s head',
  render: () => row(holder(legend({ expanded: 'does promises' }), 'does · promises'), holder(legend({ expanded: 'knows around' }), 'knows · around')),
};
export const KindOff: Story = {
  name: 'a kind off · its family is partly on (mixed)',
  render: () => holder(legend({ expanded: 'does', filter: 'calls calls-port hands-off wires calls-out listens-to promises knows around refers-to' })),
};
export const OnlyOneKind: Story = {
  name: 'only one kind kept · implements',
  render: () => holder(legend({ expanded: 'promises', filter: 'implements' })),
};

const scene = (f: Fixture, id: string, o: Opts) => html`
  <div data-scene style="display:flex;height:calc(var(--sett-map-size-minimap-h) * 5);border:var(--sett-stroke-hair) solid var(--sett-color-line2)">
    <div style="flex:1;min-width:0;overflow:auto;padding:var(--sett-space-4)">${openUnit(f, id, {}, { filter: o.filter, level: 'items' })}</div>
    <sett-panel>
      <sett-position><sett-position-row key=${f.name} level="board">${f.name}</sett-position-row><sett-position-row key=${id} level="unit" current>${id}</sett-position-row></sett-position>
      ${legend(o)}
    </sett-panel>
  </div>`;
const full = { layout: 'fullscreen' } as const;
export const InThePanel: Story = {
  name: 'zero2prod · in the panel, under the position: knows is off and its lines recede on the sheet',
  parameters: full,
  render: () => scene(zero2prod, 'api', { filter: 'does promises around refers-to' }),
};
export const InThePanelRipgrep: Story = {
  name: 'ripgrep · in the panel: only the promises family is kept',
  parameters: full,
  render: () => scene(ripgrep, 'rg', { filter: 'promises', expanded: 'promises' }),
};
export const InThePanelZed: Story = {
  name: 'zed · in the panel: folded, everything shown',
  parameters: full,
  render: () => scene(zed, 'gpui', { open: false }),
};
