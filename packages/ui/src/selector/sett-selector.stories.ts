import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { sessionOrder } from '@tau-rs/sett-tokens';
import './sett-selector.js';
import '../menu/sett-menu.js';
import { scopeText, type ScopeKind } from '../scope.js';

const STATES = ['main', 'yours', 'planning', 'working', 'asks', 'paused', 'done', 'collision'] as const;
// a row that names a scope writes the words the selector writes: one source, scopeText
const main = scopeText({ kind: 'main' });
const plan = (name: string) => scopeText({ kind: 'plan', name });
const you = (name: string) => scopeText({ kind: 'you', name });
const session = (id: string, name: string) => scopeText({ kind: 'session', id, name });
// main is a row of its own, then the six groups, by what a session needs
const menu = () => html`<sett-menu slot="menu">
  <sett-menu-item scope="main">${main}<span slot="right">up to date</span></sett-menu-item>
  <sett-menu-group label="planning"><sett-menu-item scope="plan">${plan('order history')}<span slot="right">3 elements</span></sett-menu-item></sett-menu-group>
  <sett-menu-group label="yours"><sett-menu-item scope="you">${you('fix-pool-size')}<span slot="right">3 changed</span></sett-menu-item></sett-menu-group>
  <sett-menu-group label="needs you"><sett-menu-item scope="session" session="mg" state="asks" count="2">${session('w3', 'tax rounding')}<span slot="right">Malaga</span></sett-menu-item></sett-menu-group>
  <sett-menu-group label="running">
    <sett-menu-item scope="session" state="working" session="yk" selected>${session('w1', 'refund flow')}<span slot="right">Yokohama · 3/6</span></sett-menu-item>
    <sett-menu-item scope="session" state="working" session="tl">${session('w2', 'webhook retries')}<span slot="right">Lyon · 4/6</span></sett-menu-item>
  </sett-menu-group>
  <sett-menu-group label="in review"><sett-menu-item scope="session" session="cy">${session('w4', 'pg timeout')}<span slot="right">!44 · 2 remarks</span></sett-menu-item></sett-menu-group>
  <sett-menu-group label="done"><sett-menu-item state="done">${session('w5', 'invoice export')}<span slot="right">merged</span></sett-menu-item></sett-menu-group>
</sett-menu>`;

interface ScopeOpts { scope: ScopeKind; session?: string; scopeId?: string; name?: string; locked?: boolean; state?: string; count?: number; open?: boolean }
const scoped = (o: ScopeOpts, slotted: unknown = '') => html`<sett-selector scope=${o.scope} session=${ifDefined(o.session)} scope-id=${ifDefined(o.scopeId)} name=${ifDefined(o.name)} ?locked=${o.locked} state=${o.state ?? 'main'} count=${ifDefined(o.count)} ?open=${o.open}>${slotted}</sett-selector>`;
const w1: ScopeOpts = { scope: 'session', session: 'yk', scopeId: 'w1', name: 'refund flow' };

const meta: Meta = {
  title: 'primitives/selector',
  component: 'sett-selector',
  args: { state: 'working', session: 'yk', count: 2, open: false },
  argTypes: { state: { control: 'select', options: STATES }, session: { control: 'select', options: sessionOrder } },
  render: ({ state, session, count, open }) => html`<div style="height:380px"><sett-selector state=${state} session=${session ?? ''} count=${count} ?open=${open}>feat/refund${menu()}</sett-selector></div>`,
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
export const ScopeMain: Story = { name: 'scope · main, neutral', render: () => scoped({ scope: 'main' }) };
export const ScopeSession: Story = { name: "scope · session, the words in the session's colour", render: () => scoped(w1) };
export const ScopeOtherSession: Story = { name: 'scope · another session colour', render: () => scoped({ scope: 'session', session: 'tl', scopeId: 'w2', name: 'webhook retries' }) };
export const ScopeSessionAsks: Story = { name: 'scope · session that asks: same pill, same words', render: () => scoped({ ...w1, state: 'asks', count: 1 }) };
export const ScopeYou: Story = { name: 'scope · you, sel', render: () => scoped({ scope: 'you', name: 'fix-pool-size' }) };
export const ScopeYouLocked: Story = { name: 'scope · you locked, 🔒 after the words', render: () => scoped({ scope: 'you', name: 'fix-pool-size', locked: true }) };
export const ScopePlan: Story = { name: 'scope · plan, sug', render: () => scoped({ scope: 'plan', name: 'refund flow' }) };
export const ScopeReadings: Story = {
  name: 'scope · the four readings side by side',
  render: () => html`<div class="sett-row">${scoped({ scope: 'main' })}${scoped(w1)}${scoped({ scope: 'you', name: 'fix-pool-size', locked: true })}${scoped({ scope: 'plan', name: 'refund flow' })}</div>`,
};
export const ScopeEverySession: Story = {
  name: 'scope · every session colour, the words stay readable',
  render: () => html`<div class="sett-row">${sessionOrder.map((id, i) => scoped({ scope: 'session', session: id, scopeId: `w${i + 1}`, name: 'refund flow' }))}</div>`,
};
export const MenuOpen: Story = {
  name: 'menu open · main, then planning / yours / needs you / running / in review / done',
  render: () => html`<div style="height:380px">${scoped({ ...w1, state: 'working', open: true }, menu())}</div>`,
};
export const NarrowMenu: Story = {
  name: 'menu · narrow, rows never wrap',
  render: () => html`<sett-menu style="width:290px">
    <sett-menu-group label="running">
      <sett-menu-item scope="session" state="working" session="tl" selected>${session('w2', 'webhook retries')}<span slot="right">Lyon · 4/6</span></sett-menu-item>
      <sett-menu-item scope="session" state="working" session="mg">${session('w3', 'tax rounding for eu orders')}<span slot="right">Malaga</span></sett-menu-item>
    </sett-menu-group></sett-menu>`,
};
export const ReducedMotion: Story = { name: 'reduced motion · working dot still', render: () => html`<sett-selector state="working" still>feat/refund</sett-selector>` };
