import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import './sett-activity-rail.js';
import type { ScopeKind } from '../scope.js';

type View = 'sessions' | 'files';
interface RailOpts { on?: View; scope?: ScopeKind; session?: string; closed?: boolean; asks?: number }

// the two glyphs of the shell page, drawn with currentColor; the item sizes and strokes them
const G = {
  sessions: html`<svg slot="glyph" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="5" rx="1.5"/><rect x="4" y="14" width="10" height="5" rx="1.5"/><circle cx="18" cy="16.5" r="2"/></svg>`,
  files: html`<svg slot="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6l2 2h8v12H4z"/></svg>`,
};

const rail = (o: RailOpts = {}) => html`<sett-activity-rail aria-label="views" scope=${o.scope ?? 'main'} session=${ifDefined(o.session)} ?closed=${o.closed} style="height:calc(var(--sett-space-6) * 9)">
  <sett-rail-item value="sessions" ?active=${o.on === 'sessions'} badge=${ifDefined(o.asks || undefined)} badge-label=${ifDefined(o.asks ? `${o.asks} asks you` : undefined)}>${G.sessions}Sessions</sett-rail-item>
  <sett-rail-item value="files" ?active=${o.on === 'files'}>${G.files}Files</sett-rail-item>
</sett-activity-rail>`;

const labelled = (label: string, r: unknown) => html`<div style="display:grid;gap:var(--sett-space-1);justify-items:start">${r}<span style="font-size:var(--sett-font-size-xs);color:var(--sett-color-mute)">${label}</span></div>`;
const row = (...cols: unknown[]) => html`<div class="sett-row" style="align-items:flex-start;gap:var(--sett-space-6)">${cols}</div>`;

const meta: Meta = {
  title: 'shell/activity rail',
  component: 'sett-activity-rail',
  args: { on: 'sessions', scope: 'main', session: 'yk', closed: false, asks: 1 },
  argTypes: {
    on: { control: 'inline-radio', options: ['sessions', 'files'] },
    scope: { control: 'inline-radio', options: ['main', 'session', 'you', 'plan'] },
    session: { control: 'inline-radio', options: ['yk', 'tl', 'mg', 'cy', 'ol', 'sn', 'pl'] },
  },
  render: (args) => rail(args as RailOpts),
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const Active: Story = {
  name: 'active · Sessions, Files',
  render: () => row(labelled('sessions', rail({ on: 'sessions' })), labelled('files', rail({ on: 'files' }))),
};
export const Badge: Story = {
  name: 'badge · asks you on Sessions, on the active item too',
  render: () => row(
    labelled('1 asks you', rail({ on: 'files', asks: 1 })),
    labelled('on the active item', rail({ on: 'sessions', asks: 2 })),
  ),
};
export const Scoped: Story = {
  name: 'scoped · the active bar takes the scope colour: session yk, session tl, you, plan',
  render: () => row(
    labelled('main', rail({ on: 'files' })),
    labelled('session · yk', rail({ on: 'files', scope: 'session', session: 'yk' })),
    labelled('session · tl', rail({ on: 'sessions', scope: 'session', session: 'tl', asks: 1 })),
    labelled('you', rail({ on: 'files', scope: 'you' })),
    labelled('plan', rail({ on: 'sessions', scope: 'plan' })),
  ),
};
export const PaneClosed: Story = {
  name: 'pane closed · the badge and the scope bar stay',
  render: () => row(
    labelled('pane open', rail({ on: 'sessions', scope: 'session', session: 'yk', asks: 1 })),
    labelled('pane closed', rail({ on: 'sessions', scope: 'session', session: 'yk', asks: 1, closed: true })),
  ),
};
