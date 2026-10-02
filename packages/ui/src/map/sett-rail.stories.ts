import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { RAIL_SECTIONS } from './sett-rail.js';
import { UNITS, rail, ripgrep, zed, zero2prod } from './map-fixtures.stories-helpers.js';

const meta: Meta = {
  title: 'map/rail',
  component: 'sett-rail',
  args: { side: 'needs' },
  argTypes: { side: { control: 'select', options: ['exposes', 'needs'] } },
  render: ({ side }) => html`<div class="sett-row" style="align-items:flex-start">${UNITS.map(([f, id]) => rail(f, id, side))}</div>`,
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const Exposes: Story = { name: 'exposes · rg, api, gpui', render: () => html`<div class="sett-row" style="align-items:flex-start">${UNITS.map(([f, id]) => rail(f, id, 'exposes'))}</div>` };
export const Needs: Story = { name: 'needs · rg, api, gpui', render: () => html`<div class="sett-row" style="align-items:flex-start">${UNITS.map(([f, id]) => rail(f, id, 'needs'))}</div>` };
export const EverySection: Story = {
  name: 'every section · fixed order, unresolved last, lowercase headers',
  render: () => html`<sett-rail side="needs">
    ${RAIL_SECTIONS.map((s, i) => html`<sett-port-row slot=${s} kind=${(['http', 'rpc', 'topic', 'sql', 'fs', 'crate', 'http'] as const)[i]} name=${`a ${s} port`} count="1" side="needs"></sett-port-row>`)}
  </sett-rail>`,
};
export const Unresolved: Story = {
  name: 'unresolved · externals without an owner, last, on their own tint · zed agent, collab · beside api, where every owner is known',
  render: () => html`<div class="sett-row" style="align-items:flex-start">${rail(zed, 'agent', 'needs')}${rail(zed, 'collab', 'needs')}${rail(zero2prod, 'api', 'needs')}</div>`,
};
export const UnresolvedStates: Story = {
  name: 'unresolved · a selected port · compact density · nothing else needed',
  render: () => html`<div class="sett-row" style="align-items:flex-start">${rail(zed, 'collab', 'needs', { selectedPort: 'livekit' })}${rail(zed, 'collab', 'needs', { compact: true })}<sett-rail side="needs"><sett-port-row slot="unresolved" kind="http" name="livekit" side="needs"></sett-port-row></sett-rail></div>`,
};
export const SelectedAndCompact: Story = {
  name: 'states · a selected port · compact density',
  render: () => html`<div class="sett-row" style="align-items:flex-start">${rail(zero2prod, 'api', 'needs', { selectedPort: 'postgres' })}${rail(zero2prod, 'api', 'needs', { compact: true })}</div>`,
};
export const Empty: Story = { name: 'empty · a worker exposes nothing', render: () => rail(zero2prod, 'worker', 'exposes') };
export const OnTheFlatSides: Story = {
  name: 'in context · both rails on a unit, ports docked on the outer borders',
  render: () => html`<div class="sett-row" style="align-items:flex-start;gap:var(--sett-space-6)">${rail(zed, 'gpui', 'exposes')}<div style="width:var(--sett-map-size-column);align-self:stretch;border:var(--sett-stroke-hair) dashed var(--sett-color-line);border-radius:var(--sett-map-radius-area);color:var(--sett-color-mute);font-size:var(--sett-font-size-sm);padding:var(--sett-space-2)">areas live between the rails (lane 3)</div>${rail(ripgrep, 'rg', 'needs')}</div>`,
};
