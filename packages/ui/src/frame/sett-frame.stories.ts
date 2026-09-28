import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { sessionOrder } from '@tau-rs/sett-tokens';
import './sett-frame.js';
import '../pill/sett-pill.js';

const pane = (label: string, body: string) => html`
  <div style="display:flex;flex-direction:column;height:96px">
    <div style="display:flex;align-items:center;gap:var(--sett-space-2);padding:var(--sett-space-1) var(--sett-space-2);border-bottom:var(--sett-stroke-hair) solid var(--sett-color-line2)">
      <span style="font-weight:var(--sett-font-weight-medium)">arch</span><span style="color:var(--sett-color-mute)">orderly</span>${label}
    </div>
    <div style="flex:1;display:grid;place-items:center;color:var(--sett-color-mute);font-size:var(--sett-font-size-sm)">${body}</div>
  </div>`;

const meta: Meta = {
  title: 'primitives/frame',
  component: 'sett-frame',
  args: { state: 'idle', still: false },
  argTypes: {
    state: { control: 'select', options: ['idle', 'live', 'waiting', 'editing', 'collision', 'focus'] },
    session: { control: 'select', options: sessionOrder },
  },
  render: ({ state, session, still }) => html`<sett-frame state=${state} session=${session ?? ''} ?still=${still} style="width:420px">${pane(html`<sett-pill>${state}</sett-pill>` as never, `${state}`)}</sett-frame>`,
};
export default meta;
type Story = StoryObj;

const one = (state: string, session?: string, still = false, body = state): Story => ({
  render: () => html`<sett-frame state=${state} session=${session ?? ''} ?still=${still} style="width:420px">${pane(html`<sett-pill kind=${state === 'live' ? 'session' : state === 'waiting' ? 'sug' : 'default'} session=${session ?? ''}>${state === 'live' ? 'working' : state === 'waiting' ? 'asks · 2' : state}</sett-pill>` as never, body)}</sett-frame>`,
});
export const Idle = one('idle', undefined, false, 'nothing running');
export const Live = { ...one('live', undefined, false, 'Yokohama is working'), name: 'live · default session' };
export const LiveOtherSession = { ...one('live', 'tl', false, 'Lyon is working'), name: 'live · another session' };
export const Waiting = one('waiting', undefined, false, 'Yokohama asks');
export const Editing = one('editing', undefined, false, 'you are editing');
export const Collision = one('collision', undefined, false, 'two sessions touched pg.rs');
export const Focus = { ...one('focus', undefined, false, 'keyboard focus on this pane'), name: 'focus · sel ring at the lit stroke' };
export const ReducedMotion: Story = {
  name: 'reduced motion · live and waiting go still',
  render: () => html`<div style="display:grid;gap:var(--sett-space-2);width:420px">
    <sett-frame state="live" still>${pane(html`<sett-pill kind="session">working</sett-pill>` as never, 'solid session colour')}</sett-frame>
    <sett-frame state="waiting" still>${pane(html`<sett-pill kind="sug">asks · 2</sett-pill>` as never, 'solid amber')}</sett-frame>
  </div>`,
};
export const AllStates: Story = {
  render: () => html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sett-space-2);width:860px">
    ${['idle', 'live', 'waiting', 'editing', 'collision', 'focus'].map((s) => html`<sett-frame state=${s}>${pane(html`<sett-pill>${s}</sett-pill>` as never, s)}</sett-frame>`)}
  </div>`,
};
