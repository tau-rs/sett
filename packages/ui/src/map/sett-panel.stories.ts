import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-panel.js';
import type { SettPanel } from './sett-panel.js';

const meta: Meta = {
  title: 'map/panel',
  component: 'sett-panel',
  args: { status: 'fitted · 11 units' },
  render: ({ status }) => holder(html`<sett-panel status=${status}>${body}</sett-panel>`),
};
export default meta;
type Story = StoryObj;

/** the panel fills the height of the map's pane; the story gives it one */
const holder = (p: unknown, label = '') => html`<div>${label ? html`<div style="font-size:var(--sett-font-size-xs);color:var(--sett-color-mute);margin-bottom:var(--sett-space-1)">${label}</div>` : ''}<div style="display:flex;height:calc(var(--sett-map-size-minimap-h) * 2);border:var(--sett-stroke-hair) solid var(--sett-color-line2)">${p}</div></div>`;
const row = (...cols: unknown[]) => html`<div class="sett-row" style="align-items:flex-start;gap:var(--sett-space-4)">${cols}</div>`;
const body = html`<p style="margin:var(--sett-space-2) var(--sett-space-3);color:var(--sett-color-ink2)">the panel's sections: the position, then what the map needs</p>`;
const act = (label: string, run: (p: SettPanel) => void) => html`<button style="font:inherit;color:var(--sett-color-sel);background:var(--sett-color-paper);border:var(--sett-stroke-hair) solid var(--sett-color-line);border-radius:var(--sett-radius-chip);padding:var(--sett-space-1) var(--sett-space-2);cursor:pointer" @click=${(e: Event) => run((e.currentTarget as HTMLElement).closest('[data-scene]')!.querySelector('sett-panel') as SettPanel)}>${label}</button>`;

export const Default: Story = {};
export const StatusLine: Story = {
  name: 'status line · a message in the well tint · at rest the row keeps its height',
  render: () => row(
    holder(html`<sett-panel status="fitted · 11 units">${body}</sett-panel>`, 'ripgrep · after f'),
    holder(html`<sett-panel status="opened zero2prod · api">${body}</sett-panel>`, 'zero2prod · after ↩'),
    holder(html`<sett-panel status="gpui · 214 impls of Render folded to one pill">${body}</sett-panel>`, 'zed · a long message ends in an ellipsis'),
    holder(html`<sett-panel>${body}</sett-panel>`, 'at rest'),
  ),
};
export const SaysThenClears: Story = {
  name: 'says, then clears · after 1.9 s or at the next action, with no fade',
  render: () => html`<div data-scene style="display:flex;flex-direction:column;gap:var(--sett-space-3);align-items:flex-start">
    <p style="margin:0;max-width:60ch;color:var(--sett-color-ink2)">The map says what it just did in the panel's first row, never in a toast. The message leaves by itself, or as soon as you do something else.</p>
    <div style="display:flex;gap:var(--sett-space-2)">${act('f · fit', (p) => { p.status = 'fitted · 11 units'; })}${act('↩ · open', (p) => { p.status = 'opened rg'; })}${act('the next action on the map', (p) => p.clear())}</div>
    ${holder(html`<sett-panel>${body}</sett-panel>`)}
  </div>`,
};
