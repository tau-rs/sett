import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { COLUMN_KINDS } from './sett-column.js';
import { columnsOf, ripgrep, zed, zero2prod } from './map-fixtures.stories-helpers.js';

const meta: Meta = {
  title: 'map/column',
  component: 'sett-column',
  args: { kind: 'driving', label: 'routes · driving' },
  argTypes: { kind: { control: 'select', options: COLUMN_KINDS } },
  render: ({ kind, label }) => html`<sett-column kind=${kind} label=${label}><sett-area name="routes · public"><sett-item entry>health_check()</sett-item><sett-item entry>subscribe()</sett-item></sett-area><sett-area name="middleware" folded><sett-item>reject_anonymous_users()</sett-item></sett-area></sett-column>`,
};
export default meta;
type Story = StoryObj;

const row = (cols: unknown) => html`<div style="display:flex;align-items:flex-start;gap:var(--sett-map-size-column-gutter)">${cols}</div>`;
export const Default: Story = {};
export const Hexagon: Story = { name: 'driving · domain · driven · api', render: () => row(columnsOf(zero2prod, 'api')) };
export const HexagonRg: Story = { name: 'driving · domain · driven · rg', render: () => row(columnsOf(ripgrep, 'rg')) };
export const Layers: Story = { name: 'layer · five layers · gpui', render: () => row(columnsOf(zed, 'gpui')) };
export const KindSaid: Story = {
  name: 'header · the kind is said only when the label does not',
  render: () => row(html`<sett-column kind="driving" label="routes · driving"></sett-column><sett-column kind="driven" label="sinks"></sett-column><sett-column kind="layer" label="L1 · platform"></sett-column>`),
};
