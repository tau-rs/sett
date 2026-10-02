import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { COLUMN_DEPTHS, COLUMN_KINDS } from './sett-column.js';
import { columnsOf, ripgrep, zed, zero2prod } from './map-fixtures.stories-helpers.js';

const meta: Meta = {
  title: 'map/column',
  component: 'sett-column',
  args: { kind: 'driving', depth: 'internal', label: 'routes · driving' },
  argTypes: { kind: { control: 'select', options: COLUMN_KINDS }, depth: { control: 'select', options: COLUMN_DEPTHS } },
  render: ({ kind, depth, label }) => html`<sett-column kind=${kind} depth=${depth} label=${label}><sett-area name="routes · public"><sett-item entry>health_check()</sett-item><sett-item entry>subscribe()</sett-item></sett-area><sett-area name="middleware" folded><sett-item>reject_anonymous_users()</sett-item></sett-area></sett-column>`,
};
export default meta;
type Story = StoryObj;

const row = (cols: unknown) => html`<div style="display:flex;align-items:flex-start;gap:var(--sett-map-size-column-gutter)">${cols}</div>`;
export const Default: Story = {};
export const Hexagon: Story = { name: 'driving · domain · driven · api', render: () => row(columnsOf(zero2prod, 'api')) };
export const HexagonRg: Story = { name: 'driving · domain · driven · rg', render: () => row(columnsOf(ripgrep, 'rg')) };
export const Layers: Story = { name: 'layers · public api left, leaves right · five layers · gpui', render: () => row(columnsOf(zed, 'gpui')) };
export const LayersRg: Story = { name: 'layers · public api left, leaves right · four layers · grep-searcher', render: () => row(columnsOf(ripgrep, 'grep-searcher')) };
export const LayerDepths: Story = {
  name: 'layer · tint by depth: api (driving tint) · internal (domain tint) · leaf (driven tint)',
  render: () => row(COLUMN_DEPTHS.map((d) => html`<sett-column kind="layer" depth=${d} label=${{ api: 'L2 · public', internal: 'L1 · matcher', leaf: 'L0 · config' }[d]}><sett-area name=${d}><sett-item>${{ api: 'RegexMatcher', internal: 'RegexMatcherBuilder', leaf: 'Config' }[d]}</sett-item></sett-area></sett-column>`)),
};
export const LayerAlone: Story = { name: 'layers · a single layer is the public api · grep', render: () => row(columnsOf(ripgrep, 'grep')) };
export const KindSaid: Story = {
  name: 'header · the kind is said only when the label does not',
  render: () => row(html`<sett-column kind="driving" label="routes · driving"></sett-column><sett-column kind="driven" label="sinks"></sett-column><sett-column kind="layer" label="L1 · platform"></sett-column>`),
};
