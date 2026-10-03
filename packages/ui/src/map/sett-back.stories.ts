import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-back.js';

const meta: Meta = {
  title: 'map/back',
  component: 'sett-back',
  args: { hint: 'esc', label: 'board' },
  render: ({ hint, label }) => html`<sett-back hint=${hint}>${label}</sett-back>`,
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const Places: Story = {
  name: 'names where it leads · the board, a unit, an area · ripgrep, zero2prod, zed',
  render: () => html`<div class="sett-row"><sett-back hint="esc">ripgrep</sett-back><sett-back hint="esc">zero2prod · api</sett-back><sett-back hint="esc">gpui · elements</sett-back></div>`,
};
export const Plain: Story = {
  name: 'plain · no words given, no key shown',
  render: () => html`<div class="sett-row"><sett-back></sett-back><sett-back>board</sett-back></div>`,
};
