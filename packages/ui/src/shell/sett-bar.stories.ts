import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';
import './sett-bar.js';
import '../selector/sett-selector.js';
import '../menu/sett-menu.js';
import '../chip/sett-chip.js';
import { scopeText } from '../scope.js';

type Kind = 'main' | 'session' | 'you' | 'plan';

// the selector per scope: the words come from the selector (scopeText), never typed here
const SELECTOR: Record<Kind, unknown> = {
  main: html`<sett-selector still scope="main"></sett-selector>`,
  session: html`<sett-selector still scope="session" session="yk" scope-id="w1" name="refund flow" state="asks" count="1"></sett-selector>`,
  you: html`<sett-selector still scope="you" name="fix-pool-size" state="yours" locked></sett-selector>`,
  plan: html`<sett-selector still scope="plan" name="refund flow"></sett-selector>`,
};
// a chip sits in the bar only if it carries a verb (rule 1)
const CHIPS: Record<Kind, unknown> = {
  main: nothing,
  session: html`<sett-chip slot="chips" kind="gate" state="blocking" session="yk">group 1 → group 2<span slot="count">· failed 2/2</span><a slot="verb">open</a></sett-chip>
    <sett-chip slot="chips" kind="agent" state="waiting" session="yk">refund flow asks<span slot="count">· 1</span><a slot="verb">answer</a></sett-chip>`,
  you: html`<sett-chip slot="chips" kind="detected">changes detected<span slot="count">· 2 files</span><a slot="agent">delegate the rest</a><a slot="manual">commit</a></sett-chip>`,
  plan: html`<sett-chip slot="chips" kind="plan">refund flow<span slot="count">· 5 elements</span><a slot="verb">open</a></sett-chip>`,
};

const bar = (kind: Kind, chips = true) => html`<sett-bar shortcut="⌘K">
  <span slot="brand">arch</span><span slot="repo">orderly</span>
  ${SELECTOR[kind]}
  ${chips ? CHIPS[kind] : nothing}
</sett-bar>`;

const labelled = (label: string, b: unknown) => html`<div style="display:grid;gap:var(--sett-space-1)"><span style="font-size:var(--sett-font-size-xs);color:var(--sett-color-mute)">${label}</span>${b}</div>`;

const meta: Meta = {
  title: 'shell/bar',
  component: 'sett-bar',
  args: { scope: 'session' },
  argTypes: { scope: { control: 'inline-radio', options: ['main', 'session', 'you', 'plan'] } },
  render: ({ scope }) => bar(scope as Kind),
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const Main: Story = { name: 'main · no chip carries a verb, so none sits in the bar', render: () => bar('main') };
export const Session: Story = { name: 'session · the gate failed and the session asks: two chips with their verbs', render: () => bar('session') };
export const YouLocked: Story = { name: 'you locked · changes detected, the two doors on the chip', render: () => bar('you') };
export const Plan: Story = { name: 'plan · shaping, the plan chip', render: () => bar('plan') };
export const Narrow: Story = {
  name: 'narrow · the chips give way and scroll, nothing wraps or shrinks',
  render: () => html`<div style="display:grid;gap:var(--sett-space-4)">
    ${labelled('room for everything', bar('session'))}
    ${labelled('less room: the chips scroll sideways under the right end; brand, repo, selector and Ask keep their size', html`<div style="width:calc(var(--sett-space-5) * 30)">${bar('session')}</div>`)}
  </div>`,
};
export const Ask: Story = {
  name: 'ask · the bar\'s own entry, or the host\'s',
  render: () => html`<div style="display:grid;gap:var(--sett-space-4)">
    ${labelled('the bar\'s own entry with its shortcut: choosing it fires sett-ask', bar('main'))}
    ${labelled('no shortcut', html`<sett-bar><span slot="brand">arch</span><span slot="repo">orderly</span>${SELECTOR.main}</sett-bar>`)}
    ${labelled('the host brings its own entry in the ask slot', html`<sett-bar><span slot="brand">arch</span><span slot="repo">orderly</span>${SELECTOR.main}<a slot="ask" href="#ask" style="color:var(--sett-color-mute);text-decoration:none">Ask the repo ⌘K</a></sett-bar>`)}
  </div>`,
};
export const NoRepo: Story = {
  name: 'no repo · the › goes with the repo',
  render: () => html`<sett-bar shortcut="⌘K"><span slot="brand">arch</span>${SELECTOR.main}</sett-bar>`,
};
export const MenuOpen: Story = {
  name: 'menu open · the selector\'s menu hangs under the bar, never clipped',
  render: () => html`<div style="height:calc(var(--sett-space-5) * 12)"><sett-bar shortcut="⌘K">
    <span slot="brand">arch</span><span slot="repo">orderly</span>
    <sett-selector still scope="session" session="yk" scope-id="w1" name="refund flow" state="working" open>
      <sett-menu slot="menu">
        <sett-menu-item scope="main">${scopeText({ kind: 'main' })}<span slot="right">up to date</span></sett-menu-item>
        <sett-menu-group label="running"><sett-menu-item scope="session" state="working" session="yk" selected>${scopeText({ kind: 'session', id: 'w1', name: 'refund flow' })}<span slot="right">Yokohama · 3/6</span></sett-menu-item></sett-menu-group>
      </sett-menu>
    </sett-selector>
  </sett-bar></div>`,
};
