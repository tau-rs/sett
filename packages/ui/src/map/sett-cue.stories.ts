import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { base } from '@tau-rs/sett-tokens';
import './sett-cue.js';

const T = base.map.threshold;
const FROM = parseFloat(T.cue), TO = parseFloat(T.card);

const meta: Meta = {
  title: 'map/cue',
  component: 'sett-cue',
  args: { value: 660, from: FROM, threshold: TO, label: 'keep zooming · the card becomes the sheet' },
  render: ({ value, from, threshold, label }) => html`<sett-cue value=${value} from=${from} threshold=${threshold}>${label}</sett-cue>`,
};
export default meta;
type Story = StoryObj;

const cue = (value: number, label: string) => html`<sett-cue value=${value} from=${FROM} threshold=${TO}>${label}</sett-cue>`;
const stack = (...rows: unknown[]) => html`<div style="display:flex;flex-direction:column;gap:var(--sett-space-2);align-items:flex-start">${rows}</div>`;

export const Default: Story = {};
export const TowardTheThreshold: Story = {
  name: 'toward the threshold · just started, halfway, almost, reached (the bar turns blue)',
  render: () => stack(cue(FROM + 10, 'rg · keep zooming'), cue((FROM + TO) / 2, 'api · keep zooming'), cue(TO - 12, 'gpui · keep zooming'), cue(TO, 'gpui · sheet')),
};
export const Clamped: Story = {
  name: 'clamped · under the start the bar is empty, past the threshold it stays full',
  render: () => stack(cue(FROM - 200, 'under the start'), cue(TO + 300, 'past the threshold')),
};
