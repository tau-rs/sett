import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { openUnit, ripgrep, sheetOf, zed, zero2prod } from './map-fixtures.stories-helpers.js';

const meta: Meta = { title: 'map/sheet', component: 'sett-sheet', render: () => sheetOf(zero2prod, 'api') };
export default meta;
type Story = StoryObj;

export const Default: Story = { name: 'the inside of a unit · rail · columns · rail · links' };
export const Links: Story = {
  name: 'links · api · every link at rest · 30 links and 10 port wires, one trunk per source and family',
  render: () => html`<p style="margin:0 0 var(--sett-space-3);max-width:70ch;color:var(--sett-color-ink2);font-family:var(--sett-font-sans)">Square lines on tracks in the gutters, one trunk per source item and family with a dot at each branch; a link skipping a column takes a lane in the channel under the columns; one inside a column runs beside it. Kinds are derived from the items (illustrative). Point at an item or a line; click an item to select it.</p>${sheetOf(zero2prod, 'api')}`,
};
export const Plugs: Story = { name: 'links · plugs level · a dot beside each connected item, lines on demand', render: () => sheetOf(zero2prod, 'api', {}, { level: 'plugs' }) };
export const Filtered: Story = { name: 'links · filter="knows" · one family kept, the rest recedes', render: () => sheetOf(zero2prod, 'api', {}, { filter: 'knows' }) };
export const Selected: Story = { name: 'links · a selection · drawn outward, the flow on it alone, the rest recedes', render: () => openUnit(zero2prod, 'api', { subscribe: { selected: true } }) };
export const SelectedHidden: Story = { name: 'links · the selection is inside a folded area · the link rides the edge, a blue dock dot lands', render: () => openUnit(zero2prod, 'api', { validate: { selected: true } }, { foldedAreas: ['auth'] }) };
export const NoWires: Story = { name: 'links · without the port wires', render: () => sheetOf(zero2prod, 'api', {}, { wires: false }) };
export const OpenApi: Story = { name: 'in context · api open in its node', render: () => openUnit(zero2prod, 'api') };
export const OpenRg: Story = { name: 'in context · rg open in its node', render: () => openUnit(ripgrep, 'rg') };
export const OpenGpui: Story = { name: 'in context · gpui open · five layers', render: () => openUnit(zed, 'gpui') };
export const AreasFolded: Story = { name: 'folded · every area at once', render: () => openUnit(zero2prod, 'api', {}, { folded: true }) };
export const AgentsAtWork: Story = {
  name: 'agents at work · two live, one touched, one folded area, a selection',
  render: () => openUnit(zero2prod, 'api', { subscribe: { session: 'yk', live: true }, confirm: { session: 'tl' }, publish: { session: 'tl', live: true }, newsub: { selected: true }, validate: { session: 'mg', live: true } }, { foldedAreas: ['auth'] }),
};
