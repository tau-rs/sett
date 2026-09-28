import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { sessionOrder } from '@tau-rs/sett-tokens';
import './sett-pill.js';

const meta: Meta = {
  title: 'primitives/pill',
  component: 'sett-pill',
  args: { kind: 'default', label: 'paused' },
  argTypes: {
    kind: { control: 'select', options: ['default', 'sug', 'bad', 'ok', 'sel', 'session'] },
    session: { control: 'select', options: sessionOrder },
  },
  render: ({ kind, session, label }) => html`<sett-pill kind=${kind} session=${session ?? ''}>${label}</sett-pill>`,
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const Progress: Story = { args: { label: '●●●○' } };
export const Sug: Story = { name: 'sug · asks, planned, waiting', args: { kind: 'sug', label: 'asks · 2' } };
export const Bad: Story = { name: 'bad · finding, collision, failed', args: { kind: 'bad', label: 'tests · 3 failed' } };
export const Ok: Story = { name: 'ok · done', args: { kind: 'ok', label: 'done' } };
export const Sel: Story = { name: 'sel · yours', args: { kind: 'sel', label: 'yours' } };
export const Session: Story = { name: 'session · default yk', args: { kind: 'session', label: 'working' } };
export const OtherSession: Story = { name: 'session · another session', args: { kind: 'session', session: 'tl', label: 'working' } };
export const AllSessions: Story = {
  name: 'session · all seven',
  render: () => html`<div class="sett-row">${sessionOrder.map((id) => html`<sett-pill kind="session" session=${id}>working</sett-pill>`)}</div>`,
};
export const EveryState: Story = {
  render: () => html`<div class="sett-row">
    <sett-pill>paused</sett-pill><sett-pill>●●●○</sett-pill>
    <sett-pill kind="sug">asks · 2</sett-pill><sett-pill kind="sug">2 remarks</sett-pill>
    <sett-pill kind="bad">1 finding</sett-pill><sett-pill kind="bad">collision</sett-pill><sett-pill kind="bad">tests · 3 failed</sett-pill>
    <sett-pill kind="ok">done</sett-pill><sett-pill kind="sel">yours</sett-pill>
    <sett-pill kind="session">planning</sett-pill><sett-pill kind="session" session="tl">working</sett-pill>
  </div>`,
};
export const InContext: Story = {
  render: () => html`<div class="sett-paper">feat/refund <sett-pill kind="session" session="tl">working</sett-pill> <span class="sett-sep">·</span> 3 files <sett-tag mono kind="sel">service.rs:88</sett-tag> <sett-tag kind="bad">⚠</sett-tag> one finding <sett-pill kind="bad">tests · 3 failed</sett-pill></div>`,
};
