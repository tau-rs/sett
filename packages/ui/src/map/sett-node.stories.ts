import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { UNITS, node, zed } from './map-fixtures.stories-helpers.js';

const TIERS = ['mini', 'chip', 'card', 'sheet'] as const;
const STATES = ['plain', 'selected', 'focused', 'far', 'declared'] as const;
const stateOf = (s: string) => (s === 'plain' ? {} : { [s]: true });

const meta: Meta = {
  title: 'map/node',
  component: 'sett-node',
  args: { tier: 'chip', state: 'plain' },
  argTypes: { tier: { control: 'select', options: TIERS }, state: { control: 'select', options: STATES } },
  render: ({ tier, state }) => html`<div class="sett-row">${UNITS.map(([f, id]) => node(f, id, tier, stateOf(state)))}</div>`,
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
const perTier = (tier: (typeof TIERS)[number]): Story => ({
  name: `tier · ${tier} · five states · rg, api, gpui`,
  render: () => html`${STATES.map((s) => html`<div class="sett-row" style="margin-bottom:var(--sett-space-3)"><span class="sett-sep" style="width:var(--sett-map-size-panel);font-family:var(--sett-font-mono)">${s}</span>${UNITS.map(([f, id]) => node(f, id, tier, stateOf(s)))}</div>`)}`,
});
export const Mini = perTier('mini');
export const Chip = perTier('chip');
export const Card = perTier('card');
export const Sheet: Story = {
  name: 'tier · sheet · hosts the inside (lanes 3+)',
  render: () => html`${node(zed, 'gpui', 'sheet', { focused: true }, html`<div slot="inside" style="color:var(--sett-color-mute);font-size:var(--sett-font-size-sm)">columns · areas · items land here (sett-column, sett-area, sett-item)</div>`)}`,
};
export const OnTheBoard: Story = {
  name: 'in context · a board: one focused card, chips, a far chip',
  render: () => html`<div style="position:relative;height:calc(var(--sett-map-size-card-interface) * 0.8);background:var(--sett-color-bg);border-radius:var(--sett-radius-card);overflow:hidden">
    <div style="position:absolute;left:var(--sett-space-4);top:var(--sett-space-4)">${node(zed, 'gpui', 'card', { focused: true })}</div>
    <div style="position:absolute;left:calc(var(--sett-map-size-card-interface) + var(--sett-space-6) * 2);top:var(--sett-space-4)">${node(zed, 'editor', 'chip', { selected: true })}</div>
    <div style="position:absolute;left:calc(var(--sett-map-size-card-interface) + var(--sett-space-6) * 2);top:calc(var(--sett-map-size-node-chip-h) + var(--sett-space-6))">${node(zed, 'project', 'chip')}</div>
    <div style="position:absolute;left:calc(var(--sett-map-size-card-interface) + var(--sett-map-size-node-chip-w) + var(--sett-space-6) * 3);top:var(--sett-space-4)">${node(zed, 'tools', 'chip', { far: true })}</div>
  </div>`,
};
