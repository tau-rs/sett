import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { openUnit, ripgrep, sheetOf, zed, zero2prod } from './map-fixtures.stories-helpers.js';

const meta: Meta = { title: 'map/sheet', component: 'sett-sheet', render: () => sheetOf(zero2prod, 'api') };
export default meta;
type Story = StoryObj;

const note = (text: string, body: unknown) => html`<p style="margin:0 0 var(--sett-space-3);max-width:70ch;color:var(--sett-color-ink2);font-family:var(--sett-font-sans)">${text}</p>${body}`;

export const Default: Story = { name: 'the inside of a unit · rail · columns · rail · the areas level at rest' };
export const Areas: Story = {
  name: 'areas · api · at rest · one line per area, double where it carries several links',
  render: () => note('The default level. Every area and every port has one line leaving its header; a stretch that carries two or more links is a double line whose inside takes the hue of the column it leaves, and a pair with exactly one link leaves it as a single line with a small dot. The red finding stays item to item. Point at an item to see its links; click an item to pin them; click an arrow end to open that pair, a shared stretch to open everything leaving the area, an opened line to close it.', openUnit(zero2prod, 'api')),
};
export const AreasRg: Story = { name: 'areas · rg · at rest', render: () => openUnit(ripgrep, 'rg') };
export const AreasGpui: Story = { name: 'areas · gpui · at rest · layers tint by depth', render: () => openUnit(zed, 'gpui') };
export const AreasOpenPair: Story = {
  name: 'areas · a pair opened by hand · its links are drawn, every other line keeps its track',
  render: () => note('open="routes>domain": the arrow end of that double line was clicked. Click one of its links to close it.', openUnit(zero2prod, 'api', {}, { open: 'routes>domain' })),
};
export const AreasOpenArea: Story = {
  name: 'areas · everything leaving an area opened by hand',
  render: () => note('open="routes": the shared stretch leaving routes was clicked.', openUnit(zero2prod, 'api', {}, { open: 'routes' })),
};
export const AreasPins: Story = {
  name: 'areas · pins · two items pinned, their links drawn, the rest recedes',
  render: () => openUnit(zero2prod, 'api', { subscribe: { selected: true }, publish: { selected: true } }),
};
export const AreasFiltered: Story = { name: 'areas · filter="knows" · lines that carry none of it recede', render: () => openUnit(zero2prod, 'api', {}, { filter: 'knows' }) };
export const AreasNoWires: Story = { name: 'areas · without the port wires', render: () => sheetOf(zero2prod, 'api', {}, { wires: false }) };
export const Links: Story = {
  name: 'items · api · every link at rest · 30 links and 10 port wires, one trunk per source and family',
  render: () => note('level="items". Square lines on tracks in the gutters, one trunk per source item and family with a dot at each branch; a link skipping a column takes a lane in the channel under the columns; one inside a column runs beside it. Kinds are derived from the items (illustrative). Point at an item or a line; click an item to pin it.', sheetOf(zero2prod, 'api', {}, { level: 'items' })),
};
export const Plugs: Story = { name: 'plugs · a dot beside each connected item, lines on demand', render: () => sheetOf(zero2prod, 'api', {}, { level: 'plugs' }) };
export const PlugsOpen: Story = { name: 'plugs · a pair opened by hand keeps its lines', render: () => sheetOf(zero2prod, 'api', {}, { level: 'plugs', open: 'routes>domain' }) };
export const Filtered: Story = { name: 'items · filter="knows" · one family kept, the rest recedes', render: () => sheetOf(zero2prod, 'api', {}, { level: 'items', filter: 'knows' }) };
export const Selected: Story = { name: 'items · a selection · drawn outward, the flow on it alone, the rest recedes', render: () => openUnit(zero2prod, 'api', { subscribe: { selected: true } }, { level: 'items' }) };
export const SelectedHidden: Story = { name: 'items · the selection is inside a folded area · the link rides the edge, a blue dock dot lands', render: () => openUnit(zero2prod, 'api', { validate: { selected: true } }, { level: 'items', foldedAreas: ['auth'] }) };
export const NoWires: Story = { name: 'items · without the port wires', render: () => sheetOf(zero2prod, 'api', {}, { level: 'items', wires: false }) };
export const OpenApi: Story = { name: 'items · in context · api open in its node', render: () => openUnit(zero2prod, 'api', {}, { level: 'items' }) };
export const OpenRg: Story = { name: 'items · in context · rg open in its node', render: () => openUnit(ripgrep, 'rg', {}, { level: 'items' }) };
export const OpenGpui: Story = { name: 'items · in context · gpui open · five layers', render: () => openUnit(zed, 'gpui', {}, { level: 'items' }) };
export const AreasFolded: Story = { name: 'folded · every area at once', render: () => openUnit(zero2prod, 'api', {}, { folded: true }) };
export const AgentsAtWork: Story = {
  name: 'agents at work · two live, one touched, one folded area, a selection',
  render: () => openUnit(zero2prod, 'api', { subscribe: { session: 'yk', live: true }, confirm: { session: 'tl' }, publish: { session: 'tl', live: true }, newsub: { selected: true }, validate: { session: 'mg', live: true } }, { foldedAreas: ['auth'] }),
};
