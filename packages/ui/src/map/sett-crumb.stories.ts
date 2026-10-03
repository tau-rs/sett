import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-crumb.js';

const PATHS: Record<string, string[]> = {
  ripgrep: ['ripgrep', 'rg', 'flags', 'parse()'],
  zero2prod: ['zero2prod', 'api', 'routes · public', 'subscribe()'],
  zed: ['zed', 'gpui', 'elements', 'Render · trait'],
};

const meta: Meta = {
  title: 'map/crumb',
  component: 'sett-crumb',
  args: { steps: PATHS.zero2prod },
  render: ({ steps }) => html`<sett-crumb .steps=${steps}></sett-crumb>`,
};
export default meta;
type Story = StoryObj;

const line = (steps: string[], label: string) => html`<div class="sett-row"><span class="sett-sep" style="width:calc(var(--sett-map-size-minimap-h));font-size:var(--sett-font-size-xs)">${label}</span><sett-crumb .steps=${steps}></sett-crumb></div>`;
const stack = (...rows: unknown[]) => html`<div style="display:flex;flex-direction:column;gap:var(--sett-space-2)">${rows}</div>`;

export const Default: Story = {};
export const Levels: Story = {
  name: 'one step per level · board, unit, area, item · zero2prod',
  render: () => stack(...[1, 2, 3, 4].map((n) => line(PATHS.zero2prod.slice(0, n), ['board', 'unit', 'area', 'item'][n - 1]))),
};
export const Fixtures: Story = {
  name: 'ripgrep · zero2prod · zed · down to an item',
  render: () => stack(...Object.entries(PATHS).map(([name, steps]) => line(steps, name))),
};
export const NoRoom: Story = {
  name: 'no room · the earlier steps end in an ellipsis, where you are stays whole',
  render: () => html`<div class="sett-paper" style="width:var(--sett-map-size-column)"><sett-crumb .steps=${['zed', 'language_models', 'providers · anthropic', 'stream()']}></sett-crumb></div>`,
};
