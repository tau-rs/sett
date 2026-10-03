import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { boardRects, ripgrep, sheetRects, zed, zero2prod } from './map-fixtures.stories-helpers.js';
import './sett-minimap.js';
import type { MinimapBox, MinimapRect, SettMinimap } from './sett-minimap.js';

const meta: Meta = {
  title: 'map/minimap',
  component: 'sett-minimap',
  args: { mode: 'board' },
  argTypes: { mode: { control: 'select', options: ['board', 'sheet'] } },
  render: ({ mode }) => holder(mode === 'sheet' ? mini('sheet', 'gpui', sheetRects(zed, 'gpui'), SHEET_VIEW) : mini('board', 'zed', boardRects(zed), BOARD_VIEW)),
};
export default meta;
type Story = StoryObj;

const BOARD_VIEW: MinimapBox = { x: 280, y: 80, w: 620, h: 340 };
const SHEET_VIEW: MinimapBox = { x: 0, y: 0, w: 560, h: 300 };
const holder = (m: unknown, label = '') => html`<div style="width:var(--sett-map-size-panel)">${label ? html`<div style="font-size:var(--sett-font-size-xs);color:var(--sett-color-mute);margin-bottom:var(--sett-space-1)">${label}</div>` : ''}<div class="sett-paper" style="padding:0">${m}</div></div>`;
const row = (...cols: unknown[]) => html`<div class="sett-row" style="align-items:flex-start;gap:var(--sett-space-4)">${cols}</div>`;
/** the story plays the host: the camera centres where the minimap says */
const pan = (e: Event) => {
  const m = e.currentTarget as SettMinimap; const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
  if (m.view) m.view = { ...m.view, x: x - m.view.w / 2, y: y - m.view.h / 2 };
};
const mini = (mode: 'board' | 'sheet', name: string, rects: MinimapRect[], view?: MinimapBox) => html`<sett-minimap mode=${mode} .rects=${rects} .view=${view} @sett-pan=${pan}>${name}</sett-minimap>`;

export const Default: Story = {};
export const Board: Story = {
  name: 'board · the units and the viewport rect · ripgrep, zed',
  render: () => row(holder(mini('board', 'ripgrep', boardRects(ripgrep), { x: 40, y: 60, w: 700, h: 380 }), 'ripgrep · 11 units'), holder(mini('board', 'zed', boardRects(zed), BOARD_VIEW), 'zed · 9 units')),
};
export const Sheet: Story = {
  name: 'sheet · the columns in their tints and the areas · rg, api, gpui',
  render: () => row(
    holder(mini('sheet', 'rg', sheetRects(ripgrep, 'rg'), SHEET_VIEW), 'ripgrep · rg · hexagon'),
    holder(mini('sheet', 'api', sheetRects(zero2prod, 'api'), SHEET_VIEW), 'zero2prod · api · hexagon'),
    holder(mini('sheet', 'gpui', sheetRects(zed, 'gpui'), SHEET_VIEW), 'zed · gpui · layers'),
  ),
};
export const Selected: Story = {
  name: 'selected · your selection keeps its blue border on the minimap',
  render: () => row(holder(mini('board', 'zed', boardRects(zed, 'gpui'), BOARD_VIEW), 'board · gpui selected'), holder(mini('sheet', 'api', sheetRects(zero2prod, 'api', 'routes'), SHEET_VIEW), 'sheet · routes selected')),
};
export const ClickPans: Story = {
  name: 'click or drag pans · the viewport rect follows the camera, at once',
  render: () => holder(mini('board', 'ripgrep', boardRects(ripgrep), { x: 40, y: 60, w: 500, h: 280 }), 'click, drag, or focus it and use the arrows'),
};
export const NoView: Story = {
  name: 'no view · the world alone, before the camera reports',
  render: () => holder(mini('board', 'zero2prod', boardRects(zero2prod))),
};
