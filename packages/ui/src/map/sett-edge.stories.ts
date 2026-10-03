import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { PORT_KINDS } from './sett-port-row.js';
import { boardOf, pointAt, ripgrep, zed, zero2prod, type BoardScene } from './map-fixtures.stories-helpers.js';
import type { Fixture } from './fixtures.js';
import './sett-edge.js';

/**
 * The lines between units on the board. Each `sett-edge` names its ends by
 * `key`; the edges under one parent are routed together: square lines in the
 * gaps between the boxes, one trunk per source with a dot where it branches,
 * lines into one dock joining before it, a line going back around the near
 * end of its own card. At chip zoom a line leaves the middle of a side; at
 * card zoom it docks on the port dots. Nothing is written on a line at rest.
 */
const meta: Meta = { title: 'map/edge', component: 'sett-edge' };
export default meta;
type Story = StoryObj;

const note = (text: string) => html`<p style="margin:0 0 var(--sett-space-3);max-width:72ch;color:var(--sett-color-ink2);font-family:var(--sett-font-sans);font-size:var(--sett-font-size-base)">${text}</p>`;
const scene = (f: Fixture, repo: string, s: BoardScene, text: string) => html`${note(text)}${boardOf(f, repo, s)}`;

export const RipgrepAtRest: Story = {
  name: 'ripgrep · chips · at rest',
  render: () => scene(ripgrep, 'ripgrep', { tier: 'chip' }, 'Eleven units, sixteen lines. What leaves a unit shares one trunk from the middle of a side, with a dot where it branches; arrivals spread along the side they reach. No label at rest.'),
};
export const RipgrepSelected: Story = {
  name: 'ripgrep · chips · grep-searcher selected, grep-printer → grep-matcher pointed at',
  render: () => scene(ripgrep, 'ripgrep', { tier: 'chip', selected: 'grep-searcher', point: ['grep-printer', 'grep-matcher'] }, 'The selected unit\'s lines turn blue and carry the flow (a dotted kind\'s own dots march); the line under the pointer is blue with its label; every other line recedes to map.far and unrelated units recede by colour.'),
  play: ({ canvasElement }) => pointAt(canvasElement, 'grep-printer', 'grep-matcher'),
};
export const ZedHub: Story = {
  name: 'zed · chips · the hub gpui selected',
  render: () => scene(zed, 'zed', { tier: 'chip', selected: 'gpui' }, 'Eight units use gpui: their lines join before the side they reach.'),
};
export const Zero2prodPointed: Story = {
  name: 'zero2prod · chips · the queue line pointed at',
  render: () => scene(zero2prod, 'z2p', { tier: 'chip', point: ['api', 'worker'] }, 'A sql edge (dotted, the kind\'s colour): api enqueues rows the worker dequeues. Its label shows only under the pointer.'),
  play: ({ canvasElement }) => pointAt(canvasElement, 'api', 'worker'),
};
export const ZedCards: Story = {
  name: 'zed · cards · lines going back to the hub',
  render: () => scene(zed, 'zed', { tier: 'card', view: { x: 700, y: 300, w: 1400, h: 1180 } }, 'At card zoom a line leaves the dot of the port that uses (right border) and lands on the dot of the port that is used (left border). Lines to gpui, which sits left of most of its users, go back: each takes the shortest free way around the near end of its own card.'),
};
export const ZedCardsSelected: Story = {
  name: 'zed · cards · gpui selected',
  render: () => scene(zed, 'zed', { tier: 'card', selected: 'gpui', view: { x: 700, y: 300, w: 1400, h: 1180 } }, 'The selection lights gpui\'s lines; the flow runs on them alone.'),
};
export const RipgrepCards: Story = {
  name: 'ripgrep · cards · one port, six lines; one line back',
  render: () => scene(ripgrep, 'ripgrep', { tier: 'card', view: { x: 680, y: 300, w: 1440, h: 1200 } }, 'grep\'s one port feeds six crates: one trunk, a dot at each branch. grep-printer uses grep-searcher, just above it: that line goes back through the gap between the two cards.'),
};

/** one line per port kind, to check every colour and dash in both themes */
export const Kinds: Story = {
  name: 'kinds · one line per port kind, at rest and lit',
  render: () => html`${note('Colour and dash are the kind (map.kind.*), as on the port rows. Left: at rest; right: lit (an end pointed at), the dash kept.')}
    <div style="display:grid;grid-template-columns:repeat(2, max-content);gap:var(--sett-space-3) var(--sett-space-6)">
      ${PORT_KINDS.flatMap((k) => [false, true].map((lit) => html`
        <div style="position:relative;width:520px;height:64px">
          <sett-node key=${`${k}-${lit}-a`} style="position:absolute;left:0;top:8px;width:160px;height:48px" name=${k} kind="uses" tier="mini"></sett-node>
          <sett-node key=${`${k}-${lit}-b`} style="position:absolute;left:340px;top:8px;width:160px;height:48px" name=${`${k} · used`} kind="" tier="mini"></sett-node>
          <sett-edge from=${`${k}-${lit}-a`} to=${`${k}-${lit}-b`} kind=${k} label="12 uses" ?lit=${lit}></sett-edge>
        </div>`))}
    </div>`,
};
