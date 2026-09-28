import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-funnel.js';

const steps = ['open', 'map', 'place', 'rules', 'first ask'];
const funnel = (current: number) => html`<sett-funnel current=${current}>${steps.map((s) => html`<sett-funnel-step>${s}</sett-funnel-step>`)}</sett-funnel>`;
const meta: Meta = { title: 'chrome/funnel', component: 'sett-funnel', args: { current: 3 }, argTypes: { current: { control: { type: 'number', min: 1, max: 5 } } }, render: ({ current }) => funnel(current) };
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const Start: Story = { name: 'step 1 of 5', args: { current: 1 } };
export const Last: Story = { name: 'step 5 of 5', args: { current: 5 } };
export const InWelcomeBar: Story = { name: 'in the welcome bar', render: () => html`<div style="display:flex;align-items:center;gap:var(--sett-space-4);padding:var(--sett-space-2) var(--sett-space-3);border:var(--sett-stroke-hair) solid var(--sett-color-line2);border-radius:var(--sett-radius-card);background:var(--sett-color-paper);width:640px"><span style="font-weight:var(--sett-font-weight-medium)">welcome to orderly</span>${funnel(3)}<span style="margin-left:auto;font-size:var(--sett-font-size-sm);color:var(--sett-color-ink2)">step 3 of 5 · skip</span></div>` };
