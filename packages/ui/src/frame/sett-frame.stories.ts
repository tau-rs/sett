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
    state: { control: 'select', options: ['idle', 'live', 'waiting', 'editing', 'collision', 'planning', 'focus'] },
    session: { control: 'select', options: sessionOrder },
  },
  render: ({ state, session, still }) => html`<sett-frame state=${state} session=${session ?? ''} ?still=${still} style="width:420px">${pane(html`<sett-pill>${state}</sett-pill>` as never, `${state}`)}</sett-frame>`,
};
export default meta;
type Story = StoryObj;

const one = (state: string, session?: string, still = false, body = state): Story => ({
  render: () => html`<sett-frame state=${state} session=${session ?? ''} ?still=${still} style="width:420px">${pane(html`<sett-pill kind=${state === 'live' ? 'session' : state === 'waiting' || state === 'planning' ? 'sug' : 'default'} session=${session ?? ''}>${state === 'live' ? 'working' : state === 'waiting' ? 'asks · 2' : state}</sett-pill>` as never, body)}</sett-frame>`,
});
export const Idle = one('idle', undefined, false, 'nothing running');
export const Live = { ...one('live', undefined, false, 'Yokohama is working'), name: 'live · default session' };
export const LiveOtherSession = { ...one('live', 'tl', false, 'Lyon is working'), name: 'live · another session' };
export const Waiting = one('waiting', undefined, false, 'Yokohama asks');
export const Editing = one('editing', undefined, false, 'you are editing');
export const Collision = one('collision', undefined, false, 'two sessions touched pg.rs');
export const Planning = { ...one('planning', undefined, false, 'a plan is being shaped'), name: 'planning · dashed amber, always still' };
export const Focus = { ...one('focus', undefined, false, 'keyboard focus on this pane'), name: 'focus · sel ring at the lit stroke' };
export const ReducedMotion: Story = {
  name: 'reduced motion · live and waiting go still',
  render: () => html`<div style="display:grid;gap:var(--sett-space-2);width:420px">
    <sett-frame state="live" still>${pane(html`<sett-pill kind="session">working</sett-pill>` as never, 'solid session colour')}</sett-frame>
    <sett-frame state="waiting" still>${pane(html`<sett-pill kind="sug">asks · 2</sett-pill>` as never, 'solid amber')}</sett-frame>
  </div>`,
};
export const PlanningNextToWaiting: Story = {
  name: 'planning next to waiting · motion off',
  render: () => html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sett-space-2);width:860px">
    <sett-frame state="planning" still>${pane(html`<sett-pill kind="sug">planning</sett-pill>` as never, 'planning · dashed amber')}</sett-frame>
    <sett-frame state="waiting" still>${pane(html`<sett-pill kind="sug">asks · 2</sett-pill>` as never, 'waiting, motion off · solid amber')}</sett-frame>
  </div>`,
};
export const AllStates: Story = {
  render: () => html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sett-space-2);width:860px">
    ${['idle', 'live', 'waiting', 'editing', 'collision', 'planning', 'focus'].map((s) => html`<sett-frame state=${s}>${pane(html`<sett-pill>${s}</sett-pill>` as never, s)}</sett-frame>`)}
  </div>`,
};
// arch-app's centre: the host gets its height from the area, the pane has none of its own and fills the paper
export const FillsHost: Story = {
  name: 'fills a host with a height · the pane takes the whole paper',
  render: () => html`<sett-frame state="idle" style="box-sizing:border-box;width:420px;height:calc(var(--sett-space-5) * 9)">
    <div style="display:flex;flex-direction:column">
      <div style="padding:var(--sett-space-1) var(--sett-space-2);border-bottom:var(--sett-stroke-hair) solid var(--sett-color-line2)"><span style="font-weight:var(--sett-font-weight-medium)">arch</span> <span style="color:var(--sett-color-mute)">orderly</span></div>
      <div style="flex:1;display:grid;place-items:center;color:var(--sett-color-mute);font-size:var(--sett-font-size-sm)">no height of its own</div>
      <div style="padding:var(--sett-space-1) var(--sett-space-2);border-top:var(--sett-stroke-hair) solid var(--sett-color-line2);color:var(--sett-color-mute);font-size:var(--sett-font-size-sm)">the pane's last line, at the frame's bottom edge</div>
    </div>
  </sett-frame>`,
};
