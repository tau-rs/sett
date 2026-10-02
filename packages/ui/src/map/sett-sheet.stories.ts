import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { openUnit, ripgrep, sheetOf, zed, zero2prod } from './map-fixtures.stories-helpers.js';

const meta: Meta = { title: 'map/sheet', component: 'sett-sheet', render: () => sheetOf(zero2prod, 'api') };
export default meta;
type Story = StoryObj;

export const Default: Story = { name: 'the inside of a unit · rail · columns · rail' };
export const OpenApi: Story = { name: 'in context · api open in its node', render: () => openUnit(zero2prod, 'api') };
export const OpenRg: Story = { name: 'in context · rg open in its node', render: () => openUnit(ripgrep, 'rg') };
export const OpenGpui: Story = { name: 'in context · gpui open · five layers', render: () => openUnit(zed, 'gpui') };
export const AreasFolded: Story = { name: 'folded · every area at once', render: () => openUnit(zero2prod, 'api', {}, { folded: true }) };
export const AgentsAtWork: Story = {
  name: 'agents at work · two live, one touched, one folded area, a selection',
  render: () => openUnit(zero2prod, 'api', { subscribe: { session: 'yk', live: true }, confirm: { session: 'tl' }, publish: { session: 'tl', live: true }, newsub: { selected: true }, validate: { session: 'mg', live: true } }, { foldedAreas: ['auth'] }),
};
