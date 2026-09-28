import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-tabs.js';
import '../button/sett-button.js';

const meta: Meta = { title: 'chrome/tabs and switches', component: 'sett-tabbar' };
export default meta;
type Story = StoryObj;

const bar = html`<sett-tabbar style="width:900px">
  <sett-tab pinned active>map</sett-tab>
  <sett-tab mono dirty>ports.rs</sett-tab>
  <sett-tab mono>service.rs</sett-tab>
  <sett-tab mono session="yk">pg.rs · Yokohama</sett-tab>
  <sett-tab>review · feat/refund</sett-tab>
  <sett-seg slot="right"><sett-seg-item value="repo">repo</sett-seg-item><sett-seg-item value="areas">areas</sett-seg-item><sett-seg-item value="items" active>items</sett-seg-item></sett-seg>
  <sett-overlay-toggles slot="right"><sett-toggle value="sessions" on>sessions</sett-toggle><sett-toggle value="plan" on>plan</sett-toggle><sett-toggle value="findings">findings</sett-toggle><sett-toggle value="delta">delta</sett-toggle></sett-overlay-toggles>
  <span slot="right">⌘1 map · ⌘W close</span>
</sett-tabbar>`;
export const Tabbar: Story = { name: 'tabbar · pinned map, unsaved file, session tab, right end', render: () => bar };
export const TabStates: Story = { name: 'tab · pinned, active, dirty, session, plain', render: () => html`<sett-tabbar style="width:600px"><sett-tab pinned>map</sett-tab><sett-tab mono active>active.rs</sett-tab><sett-tab mono dirty>unsaved.rs</sett-tab><sett-tab mono session="tl">by Lyon</sett-tab><sett-tab>plain</sett-tab></sett-tabbar>` };
export const SegFill: Story = { name: 'seg · fill', render: () => html`<sett-seg fill style="width:220px"><sett-seg-item value="files" active>files</sett-seg-item><sett-seg-item value="changes">changes</sett-seg-item><sett-seg-item value="review">review</sett-seg-item></sett-seg>` };
export const SegCount: Story = { name: 'seg · with a count', render: () => html`<sett-seg fill style="width:220px"><sett-seg-item value="files">files</sett-seg-item><sett-seg-item value="changes" active>changes · 3</sett-seg-item><sett-seg-item value="review">review</sett-seg-item></sett-seg>` };
export const SegEmptyState: Story = { name: 'seg · a view with nothing in it is never disabled: empty state', render: () => html`<div style="width:260px;border:var(--sett-stroke-hair) solid var(--sett-color-line2);border-radius:var(--sett-radius-card);overflow:hidden">
  <div style="padding:var(--sett-space-1);background:var(--sett-color-well)"><sett-seg fill><sett-seg-item value="files">files</sett-seg-item><sett-seg-item value="changes">changes · 3</sett-seg-item><sett-seg-item value="review" active>review</sett-seg-item></sett-seg></div>
  <div style="padding:var(--sett-space-4);text-align:center;color:var(--sett-color-ink2);font-size:var(--sett-font-size-md);display:grid;gap:var(--sett-space-2);justify-items:center">no review yet on feat/refund<div class="sett-row"><sett-button variant="primary" size="sm">with Yokohama</sett-button><sett-button size="sm">review it myself</sett-button></div></div></div>` };
export const SegInline: Story = { name: 'seg · inline (code · reach) and the reach bar', render: () => html`<div class="sett-row"><sett-seg><sett-seg-item value="code" active>code</sett-seg-item><sett-seg-item value="reach">reach</sett-seg-item></sett-seg>
  <sett-seg><sett-seg-item value="less">−</sett-seg-item><sett-seg-item value="depth" active style="font-family:var(--sett-font-mono)">depth 1</sett-seg-item><sett-seg-item value="more">+</sett-seg-item><sett-seg-item value="all" style="color:var(--sett-color-sel)">all</sett-seg-item></sett-seg><span style="color:var(--sett-color-mute)">4 reached</span>
  <sett-seg><sett-seg-item value="in" active>incoming</sett-seg-item><sett-seg-item value="out">outgoing</sett-seg-item></sett-seg></div>` };
export const Toggles: Story = { name: 'overlay toggles · on and off', render: () => html`<sett-overlay-toggles><sett-toggle value="sessions" on>sessions</sett-toggle><sett-toggle value="plan" on>plan</sett-toggle><sett-toggle value="findings">findings</sett-toggle><sett-toggle value="delta">delta</sett-toggle></sett-overlay-toggles>` };
