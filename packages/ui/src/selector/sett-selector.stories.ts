import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { sessionOrder } from '@tau-rs/sett-tokens';
import './sett-selector.js';
import '../menu/sett-menu.js';

const STATES = ['main', 'yours', 'planning', 'working', 'asks', 'paused', 'done', 'collision'] as const;
const menu = () => html`<sett-menu slot="menu">
  <sett-menu-group label="needs you"><sett-menu-item state="asks" count="2">feat/refund<span slot="right">Yokohama</span></sett-menu-item></sett-menu-group>
  <sett-menu-group label="working">
    <sett-menu-item state="working" session="tl" selected>feat/webhook-retry<span slot="right">Lyon · 4/6</span></sett-menu-item>
    <sett-menu-item state="planning" session="mg">feat/tax-rounding-for-eu-orders<span slot="right">Malaga</span></sett-menu-item>
  </sett-menu-group>
  <sett-menu-group label="waiting to merge"><sett-menu-item state="done">fix/pg-timeout<span slot="right">you</span></sett-menu-item></sett-menu-group>
  <sett-menu-group label="saved plans · main">
    <sett-menu-item state="asks">plan · order-history<span slot="right">3 elements</span></sett-menu-item>
    <sett-menu-item state="main">main<span slot="right">up to date</span></sett-menu-item>
  </sett-menu-group>
</sett-menu>`;

const meta: Meta = {
  title: 'primitives/selector',
  component: 'sett-selector',
  args: { state: 'working', session: 'yk', count: 2, open: false },
  argTypes: { state: { control: 'select', options: STATES }, session: { control: 'select', options: sessionOrder } },
  render: ({ state, session, count, open }) => html`<div style="height:260px"><sett-selector state=${state} session=${session ?? ''} count=${count} ?open=${open}>feat/refund${menu()}</sett-selector></div>`,
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
const one = (state: string, extra = {}): Story => ({ name: `state · ${state}`, args: { state, open: false, ...extra } });
export const Main = one('main');
export const Yours = one('yours');
export const Planning = one('planning');
export const Working = one('working');
export const Asks = one('asks', { count: 2 });
export const Paused = one('paused');
export const Done = one('done');
export const Collision = one('collision');
export const AllStates: Story = {
  render: () => html`<div class="sett-row">${STATES.map((s) => html`<sett-selector state=${s} count="2">${s === 'main' ? 'main' : 'feat/refund'}</sett-selector>`)}</div>`,
};
export const OtherSession: Story = { name: 'working · another session', args: { state: 'working', session: 'tl' } };
export const MenuOpen: Story = { name: 'menu open · grouped needs-you / working / waiting-to-merge / saved-plans / main', args: { open: true, session: 'tl' } };
export const NarrowMenu: Story = {
  name: 'menu · narrow, rows never wrap',
  render: () => html`<sett-menu style="width:290px">
    <sett-menu-group label="working">
      <sett-menu-item state="working" session="tl" selected>feat/webhook-retry<span slot="right">Lyon · 4/6</span></sett-menu-item>
      <sett-menu-item state="planning" session="mg">feat/tax-rounding-for-eu-orders<span slot="right">Malaga</span></sett-menu-item>
    </sett-menu-group></sett-menu>`,
};
export const ReducedMotion: Story = { name: 'reduced motion · working dot still', render: () => html`<sett-selector state="working" still>feat/refund</sett-selector>` };
