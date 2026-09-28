import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { sessionOrder } from '@tau-rs/sett-tokens';
import './sett-tag.js';

const meta: Meta = {
  title: 'primitives/tag',
  component: 'sett-tag',
  args: { kind: 'default', mono: false, label: 'impl' },
  argTypes: {
    kind: { control: 'select', options: ['default', 'sug', 'bad', 'ok', 'sel', 'session'] },
    session: { control: 'select', options: sessionOrder },
  },
  render: ({ kind, session, mono, label }) => html`<sett-tag kind=${kind} session=${session ?? ''} ?mono=${mono}>${label}</sett-tag>`,
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const Sug: Story = { name: 'sug · planned', args: { kind: 'sug', label: 'planned' } };
export const Bad: Story = { name: 'bad · finding glyph', args: { kind: 'bad', label: '⚠' } };
export const Ok: Story = { name: 'ok · count', args: { kind: 'ok', label: '+12' } };
export const Sel: Story = { name: 'sel · you', args: { kind: 'sel', label: 'you' } };
export const Session: Story = { name: 'session', args: { kind: 'session', session: 'yk', label: 'yokohama' } };
export const Mono: Story = { name: 'mono · identifier', args: { mono: true, label: 'refund_flow' } };
export const MonoFileLine: Story = { name: 'mono · file:line, sel', args: { mono: true, kind: 'sel', label: 'service.rs:61' } };
export const EveryState: Story = {
  render: () => html`<div class="sett-row">
    <sett-tag>impl</sett-tag><sett-tag kind="sug">planned</sett-tag><sett-tag kind="bad">⚠</sett-tag>
    <sett-tag kind="ok">+12</sett-tag><sett-tag kind="sel">you</sett-tag><sett-tag kind="session">yokohama</sett-tag>
    <sett-tag mono kind="sel">service.rs:61</sett-tag><sett-tag mono>refund_flow</sett-tag>
  </div>`,
};
