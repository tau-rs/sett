import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-button.js';
import '../menu/sett-menu.js';
import '../pill/sett-pill.js';

const meta: Meta = { title: 'buttons/buttons', component: 'sett-button' };
export default meta;
type Story = StoryObj;

const drivers = html`<sett-menu slot="menu"><sett-menu-group label="delegate to">
  <sett-menu-item state="working" session="yk">Yokohama<span slot="right">claude code</span></sett-menu-item>
  <sett-menu-item state="planning" session="tl">Lyon<span slot="right">codex</span></sett-menu-item>
</sett-menu-group></sett-menu>`;

export const Buttons: Story = { name: 'button · default, primary, quiet, sm, disabled', render: () => html`<div class="sett-row">
  <sett-button>save plan</sett-button><sett-button variant="primary">accept</sett-button><sett-button variant="quiet">discard</sett-button>
  <sett-button size="sm">save plan</sett-button><sett-button size="sm" variant="primary">send</sett-button>
  <sett-button disabled>save plan</sett-button><sett-button variant="primary" disabled>merge into main</sett-button></div>` };
export const SplitAgentFirst: Story = { name: 'split · agent first (default)', render: () => html`<div class="sett-row" style="height:140px;align-items:flex-start">
  <sett-split-button>accept · delegate to Yokohama${drivers}</sett-split-button><sett-button>save plan</sett-button><sett-button variant="quiet">discard</sett-button></div>` };
export const SplitMeFirst: Story = { name: 'split · "me first" setting', render: () => html`<div class="sett-row" style="height:140px;align-items:flex-start">
  <sett-button variant="primary">save plan · do it myself</sett-button><sett-split-button variant="default">accept · delegate${drivers}</sett-split-button><sett-button variant="quiet">discard</sett-button></div>` };
export const SplitOpen: Story = { name: 'split · list open', render: () => html`<div style="height:160px"><sett-split-button open>accept · delegate to Yokohama${drivers}</sett-split-button></div>` };
export const GatedBlocked: Story = { name: 'gated · blocked with pills', render: () => html`<sett-gated-button blocked>merge into main<span slot="reason">blocked by</span><sett-pill slot="reason" kind="bad">tests · 3 failed</sett-pill><sett-pill slot="reason" kind="bad">1 finding</sett-pill><sett-pill slot="reason" kind="sug">2 remarks</sett-pill></sett-gated-button>` };
export const GatedOpen: Story = { name: 'gated · open', render: () => html`<sett-gated-button>merge into main<span slot="reason">everything green · 3 commits · description drafted from the plan</span></sett-gated-button>` };
export const HandBackDisabled: Story = { name: 'hand back · disabled until the note is written', render: () => html`<sett-gated-button blocked>hand back<span slot="reason">write what you changed and why first</span></sett-gated-button>` };
