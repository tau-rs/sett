import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-empty.js';
import '../button/sett-button.js';

// a pane of the shell's left column, and a short wide body under the centre
const pane = (b: unknown) => html`<div style="width:calc(var(--sett-space-5) * 13);border:var(--sett-stroke-hair) solid var(--sett-color-line2);border-radius:var(--sett-radius-card);background:var(--sett-color-paper)">${b}</div>`;
const wide = (b: unknown) => html`<div style="width:calc(var(--sett-space-5) * 40);border:var(--sett-stroke-hair) solid var(--sett-color-line2);border-radius:var(--sett-radius-card);background:var(--sett-color-paper)">${b}</div>`;

const meta: Meta = {
  title: 'shell/empty',
  component: 'sett-empty',
  args: { inline: false },
  render: ({ inline }) => pane(html`<sett-empty ?inline=${inline}>no review yet on feat/refund<sett-button slot="door" variant="primary" size="sm">with Yokohama</sett-button><sett-button slot="door" size="sm">review it myself</sett-button></sett-empty>`),
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const TwoDoors: Story = {
  name: 'two doors · the agent door first and bold, the manual door plain',
  render: () => pane(html`<sett-empty>no review yet on feat/refund<sett-button slot="door" variant="primary" size="sm">with Yokohama</sett-button><sett-button slot="door" size="sm">review it myself</sett-button></sett-empty>`),
};
export const OneDoor: Story = {
  name: 'one door · nothing an agent could do',
  render: () => pane(html`<sett-empty>nothing open in this worktree<sett-button slot="door" size="sm">open a file</sett-button></sett-empty>`),
};
export const WordsOnly: Story = {
  name: 'words only · nothing to do but wait',
  render: () => pane(html`<sett-empty>nothing new since you looked</sett-empty>`),
};
export const MeFirst: Story = {
  name: 'me first · the setting swaps order and weight',
  render: () => pane(html`<sett-empty>no review yet on feat/refund<sett-button slot="door" variant="primary" size="sm">review it myself</sett-button><sett-button slot="door" size="sm">with Yokohama</sett-button></sett-empty>`),
};
export const Inline: Story = {
  name: 'inline · words · doors on one line, for a wide and short body',
  render: () => html`<div style="display:grid;gap:var(--sett-space-4)">
    ${wide(html`<sett-empty inline>no findings<sett-button slot="door" variant="primary" size="sm">ask Yokohama to check</sett-button><sett-button slot="door" size="sm">run arch check</sett-button></sett-empty>`)}
    ${wide(html`<sett-empty inline>no checks have run yet</sett-empty>`)}
  </div>`,
};
