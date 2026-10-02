import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { UNITS, node, openUnit, zed, zero2prod } from './map-fixtures.stories-helpers.js';
import type { SettNode } from './sett-node.js';

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
  name: `tier · ${tier} · five states, no foot (a closed node opens by double-click or ↩) · rg, api, gpui`,
  render: () => html`${STATES.map((s) => html`<div class="sett-row" style="margin-bottom:var(--sett-space-3)"><span class="sett-sep" style="width:var(--sett-map-size-panel);font-family:var(--sett-font-mono)">${s}</span>${UNITS.map(([f, id]) => node(f, id, tier, stateOf(s)))}</div>`)}`,
});
export const Mini = perTier('mini');
export const Chip = perTier('chip');
export const Card = perTier('card');
export const Sheet: Story = {
  name: 'tier · sheet · hosts the inside and keeps one link, ▴ close',
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

// DESIGN.md § Motion, "where it lands": closed, the unit's box and its badge carry the agent's mark
const scene = (body: unknown, note: string, actions: unknown = '') => html`
  <div data-scene style="display:flex;flex-direction:column;gap:var(--sett-space-3);align-items:flex-start">
    <p style="margin:0;max-width:60ch;color:var(--sett-color-ink2)">${note}</p>
    <div style="display:flex;gap:var(--sett-space-2)">${actions}</div>
    <div class="sett-row" style="align-items:flex-start;gap:var(--sett-space-6);padding:var(--sett-space-4)">${body}</div>
  </div>`;
const act = (label: string, run: (root: HTMLElement) => void) => html`<button style="font:inherit;color:var(--sett-color-sel);background:var(--sett-color-paper);border:var(--sett-stroke-hair) solid var(--sett-color-line);border-radius:var(--sett-radius-chip);padding:var(--sett-space-1) var(--sett-space-2);cursor:pointer" @click=${(e: Event) => run((e.currentTarget as HTMLElement).closest('[data-scene]') as HTMLElement)}>${label}</button>`;
const labelled = (label: string, body: unknown) => html`<div style="display:flex;flex-direction:column;gap:var(--sett-space-1)"><span style="font-size:var(--sett-font-size-xs);color:var(--sett-color-mute)">${label}</span>${body}</div>`;
const theNode = (root: HTMLElement) => root.querySelector('sett-node') as SettNode;

export const AnAgentInside: Story = {
  name: 'presence · closed, an agent inside · the badge breathes · mini, chip, card',
  render: () => scene(html`
    ${labelled('mini', node(zero2prod, 'api', 'mini', {}, undefined, { sessions: 'yk tl', live: 'yk' }))}
    ${labelled('chip', node(zero2prod, 'api', 'chip', {}, undefined, { sessions: 'yk tl', live: 'yk' }))}
    ${labelled('card', node(zero2prod, 'api', 'card', {}, undefined, { sessions: 'yk tl', live: 'yk' }))}`,
    'The unit is closed, so its box is the nearest thing you can see: Yokohama is working inside, and her dot breathes on the head. Taipei touched the unit earlier: a still dot. The name never moves.'),
};
export const ClosedAndOpen: Story = {
  name: 'presence · the same unit closed and open · open, the item carries the life and the dot is still',
  render: () => scene(html`
    ${labelled('closed · the badge breathes', node(zero2prod, 'api', 'card', {}, undefined, { sessions: 'yk tl', live: 'yk' }))}
    ${labelled('open · the item breathes, the badge is still', openUnit(zero2prod, 'api', { subscribe: { session: 'yk', live: true }, confirm: { session: 'tl' } }))}`,
    'One living mark per agent. Open, Yokohama\'s item is on screen and takes the breath and the sheen; the dot on the head stays still.'),
};
export const Arrival: Story = {
  name: 'event · an agent arrives on a closed unit · the box blooms, two waves, the badge ignites',
  render: () => scene(node(zero2prod, 'api', 'chip', {}, undefined, { sessions: 'tl' }),
    'Taipei was here earlier. Press the button: she arrives. The box blooms in her colour, two waves in its own shape roll outward (the larger wave, map.size.waveNode), her dot ignites, then breathes.',
    act('Taipei arrives', (r) => { theNode(r).live = 'tl'; })),
};
export const Departure: Story = {
  name: 'event · an agent leaves a closed unit · one wave closes in, the badge goes still',
  render: () => scene(node(zero2prod, 'api', 'chip', {}, undefined, { sessions: 'yk tl', live: 'yk' }),
    'Yokohama is working inside. Press the button: she moves on. One wave closes in on the box and is swallowed; her dot stops breathing but stays, she touched this unit.',
    act('Yokohama leaves', (r) => { theNode(r).live = ''; })),
};
export const ThreeAgents: Story = {
  name: 'presence · three agents on one closed unit · each on its own beat',
  render: () => scene(html`
    ${labelled('chip', node(zed, 'gpui', 'chip', {}, undefined, { sessions: 'yk tl mg', live: 'yk tl mg' }))}
    ${labelled('card', node(zed, 'gpui', 'card', {}, undefined, { sessions: 'yk tl mg', live: 'yk tl mg' }))}`,
    'Three dots, three beats: each session is offset so they read as three agents and not as one blinking block.'),
};
export const ReducedMotion: Story = {
  name: 'reduced motion · the still twin · nothing moves, the dots stay',
  render: () => scene(html`
    ${labelled('an agent inside', node(zero2prod, 'api', 'chip', {}, undefined, { sessions: 'yk tl', live: 'yk' }))}
    ${labelled('three agents', node(zed, 'gpui', 'chip', {}, undefined, { sessions: 'yk tl mg', live: 'yk tl mg' }))}`,
    'With prefers-reduced-motion on, the same scenes: the dots neither breathe nor ignite, and an arrival or departure skips the wave and the bloom. Press the button under reduced motion: nothing moves, Taipei\'s dot simply appears live.',
    act('Taipei arrives', (r) => { theNode(r).live = 'yk tl'; })),
};
