import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import './sett-intent-bar.js';
import '../button/sett-button.js';

// the bar sits above the map in the centre pane: the pane's width, the map's grey under it
const centre = (body: unknown) => html`<div style="box-sizing:border-box;width:calc(var(--sett-size-shell-inspector) * 2);background:var(--sett-color-bg);border:var(--sett-stroke-hair) solid var(--sett-color-line2)">${body}<div style="height:var(--sett-space-6)"></div></div>`;

interface BarOpts { value?: string; counts?: string; placeholder?: string }
const INTENT = 'Refunds: add refund() to the OrderRepo port and the Postgres impl, expose it on pay()/close()';
const bar = (o: BarOpts = {}, verbs?: unknown) => html`<sett-intent-bar value=${ifDefined(o.value)} counts=${ifDefined(o.counts)} placeholder=${ifDefined(o.placeholder)}>${verbs}</sett-intent-bar>`;

const meta: Meta = {
  title: 'shell/intent bar',
  component: 'sett-intent-bar',
  args: { value: INTENT, counts: '5 elements · 2 groups' },
  render: (args) => centre(bar(args as BarOpts)),
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const Empty: Story = { name: 'empty · the placeholder asks what should change', render: () => centre(bar()) };
export const Filled: Story = { name: 'filled · the intention and what the plan holds', render: () => centre(bar({ value: INTENT, counts: '5 elements · 2 groups' })) };
export const WithVerb: Story = {
  name: 'filled with a verb · the app adds its button after the counts',
  render: () => centre(bar({ value: INTENT, counts: '5 elements · 2 groups' }, html`<sett-button slot="verbs" size="sm">re-plan</sett-button>`)),
};
export const Narrow: Story = {
  name: 'narrow · the field shrinks, the counts stay whole',
  render: () => html`<div style="box-sizing:border-box;width:var(--sett-size-shell-inspector);background:var(--sett-color-bg);border:var(--sett-stroke-hair) solid var(--sett-color-line2)">${bar({ value: INTENT, counts: '5 elements · 2 groups' })}</div>`,
};
