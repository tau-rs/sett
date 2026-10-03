import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-position.js';
import type { SettPositionRow } from './sett-position.js';

type Place = [name: string, level: string];
const TRAILS: Record<string, Place[]> = {
  ripgrep: [['ripgrep', 'board'], ['rg', 'unit'], ['flags', 'area'], ['parse()', 'item']],
  zero2prod: [['zero2prod', 'board'], ['zero2prod · api', 'unit'], ['routes · public', 'area'], ['subscribe()', 'item']],
  zed: [['zed', 'board'], ['gpui', 'unit'], ['elements', 'area'], ['Render · trait', 'item']],
};

const meta: Meta = {
  title: 'map/position',
  component: 'sett-position',
  args: { at: 3 },
  argTypes: { at: { control: { type: 'number', min: 1, max: 4 } } },
  render: ({ at }) => holder(trail(TRAILS.zero2prod, at)),
};
export default meta;
type Story = StoryObj;

const holder = (p: unknown, label = '') => html`<div style="width:var(--sett-map-size-panel)">${label ? html`<div style="font-size:var(--sett-font-size-xs);color:var(--sett-color-mute);margin-bottom:var(--sett-space-1)">${label}</div>` : ''}<div class="sett-paper" style="padding:0">${p}</div></div>`;
const row = (...cols: unknown[]) => html`<div class="sett-row" style="align-items:flex-start;gap:var(--sett-space-4)">${cols}</div>`;
/** the story plays the host: a click on a row makes it the current one, the rows after it become future */
const go = (e: Event) => {
  const rows = Array.from((e.currentTarget as HTMLElement).querySelectorAll('sett-position-row')) as SettPositionRow[];
  const n = (e as CustomEvent<{ n: number }>).detail.n;
  rows.forEach((r, i) => { r.current = i + 1 === n; r.future = i + 1 > n; });
};
const trail = (places: Place[], at = places.length) => html`<sett-position @sett-go=${go}>${places.map(([name, level], i) => html`<sett-position-row key=${name} level=${level} ?current=${i + 1 === at} ?future=${i + 1 > at}>${name}</sett-position-row>`)}</sett-position>`;

export const Default: Story = {};
export const Current: Story = {
  name: 'current · the trail ends where you are · ripgrep, zero2prod, zed',
  render: () => row(...Object.entries(TRAILS).map(([name, places]) => holder(trail(places), name))),
};
export const Future: Story = {
  name: 'future · after going back, the places ahead stay listed, lighter',
  render: () => row(...Object.entries(TRAILS).map(([name, places], i) => holder(trail(places, i + 1), `${name} · back to ${i + 1}`))),
};
export const Levels: Story = {
  name: 'one row per level reached · board only, then a unit, then an area',
  render: () => row(holder(trail(TRAILS.zed.slice(0, 1)), 'board'), holder(trail(TRAILS.zed.slice(0, 2)), 'unit'), holder(trail(TRAILS.zed.slice(0, 3)), 'area')),
};
export const LongName: Story = {
  name: 'a name too long ends in an ellipsis · the number and the level stay',
  render: () => holder(trail([['zed', 'board'], ['language_models · providers · anthropic', 'unit'], ['AnthropicLanguageModelProvider::stream_completion()', 'item']])),
};
