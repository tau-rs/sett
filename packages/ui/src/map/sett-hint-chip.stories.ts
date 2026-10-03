import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { boardOf, ripgrep, zed } from './map-fixtures.stories-helpers.js';
import './sett-hint-chip.js';

/**
 * The pill on the window's border for a neighbour that is off-screen. One per
 * neighbour, toward its unit, kept clear of the corners; pills that would
 * touch merge into "n neighbours · two names". The lines to an off-screen
 * unit end on its pill (#56). An agent working in an off-screen unit breathes
 * on its pill.
 */
const meta: Meta = { title: 'map/hint-chip', component: 'sett-hint-chip' };
export default meta;
type Story = StoryObj;

const note = (text: string) => html`<p style="margin:0 0 var(--sett-space-3);max-width:72ch;color:var(--sett-color-ink2);font-family:var(--sett-font-sans);font-size:var(--sett-font-size-base)">${text}</p>`;
const RG = { x: -40, y: 492, w: 1400, h: 1100 };

export const Anatomy: Story = {
  name: 'anatomy · one neighbour, merged neighbours, an agent inside, pointed at',
  render: () => html`${note('Each pill hangs from its anchor on the border by its side. Left to right: one neighbour · two merged (double border) · an agent working inside (its dot breathes) · pointed at (blue).')}
    <div style="display:flex;gap:var(--sett-space-6)">
      ${[
        html`<sett-hint-chip keys="grep-searcher" names="grep-searcher" side="left"></sett-hint-chip>`,
        html`<sett-hint-chip keys="globset grep-cli" names="globset, grep-cli" side="left"></sett-hint-chip>`,
        html`<sett-hint-chip keys="grep-cli" names="grep-cli" side="left" sessions="mg" live="mg"></sett-hint-chip>`,
        html`<sett-hint-chip keys="grep-regex" names="grep-regex" side="left" lit></sett-hint-chip>`,
      ].map((p) => html`<div style="position:relative;width:300px;height:var(--sett-space-6)"><div style="position:absolute;left:0;top:50%">${p}</div></div>`)}
    </div>`,
};
export const RipgrepWindow: Story = {
  name: 'ripgrep · a window at card zoom · the lines end on the pills',
  render: () => html`${note('rg, grep and ignore are in view; seven neighbours are not. Each line to an off-screen unit ends on its pill; lines to one pill join before it. globset and grep-cli would touch, so they merge.')}${boardOf(ripgrep, 'ripgrep', { tier: 'card', view: RG })}`,
};
export const RipgrepAgents: Story = {
  name: 'ripgrep · agents working in two off-screen units',
  render: () => html`${note('An agent in grep-searcher, another in grep-cli: the pill is the nearest thing you can see, so their dots breathe there.')}${boardOf(ripgrep, 'ripgrep', { tier: 'card', view: RG, live: { 'grep-searcher': 'tl', 'grep-cli': 'mg' } })}`,
};
export const RipgrepPointed: Story = {
  name: 'ripgrep · pointing at the pill grep-searcher lights its lines',
  render: () => html`${note('The pill and the lines that end on it turn blue; the other lines recede to map.far.')}${boardOf(ripgrep, 'ripgrep', { tier: 'card', view: RG, pointUnit: 'grep-searcher', live: { 'grep-searcher': 'tl' } })}`,
};
export const ClearOfCards: Story = {
  name: 'ripgrep · a pill that would land on a card slides along the border',
  render: () => html`${note('Here the merged pill for globset and grep-cli belongs where the card ignore meets the right border: it slides along the border to the nearest clear spot.')}${boardOf(ripgrep, 'ripgrep', { tier: 'card', view: { x: 0, y: 540, w: 1360, h: 1140 } })}`,
};
export const ZedWindow: Story = {
  name: 'zed · around the hub gpui',
  render: () => html`${note('cli on the left, editor above, project, agent, collab and tools on the right; the lines to gpui from them come in through their pills.')}${boardOf(zed, 'zed', { tier: 'card', view: { x: 700, y: 300, w: 1392, h: 1140 } })}`,
};
