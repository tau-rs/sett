import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import './sett-scope-line.js';
import type { ScopeKind } from '../scope.js';

interface LineOpts { scope?: ScopeKind; session?: string; scopeId?: string; name?: string; sub?: string; locked?: boolean }

// the scope line sits at the top of the left pane: paper, at the pane's narrow width
const pane = (...lines: unknown[]) => html`<div style="display:grid;gap:var(--sett-space-2);box-sizing:border-box;width:var(--sett-size-shell-pane-min);padding:var(--sett-space-2);background:var(--sett-color-paper);border:var(--sett-stroke-hair) solid var(--sett-color-line2)">${lines}</div>`;
const line = (o: LineOpts = {}) => html`<sett-scope-line scope=${o.scope ?? 'main'} session=${ifDefined(o.session)} scope-id=${ifDefined(o.scopeId)} name=${ifDefined(o.name)} sub=${ifDefined(o.sub || undefined)} ?locked=${o.locked}></sett-scope-line>`;

const meta: Meta = {
  title: 'shell/scope line',
  component: 'sett-scope-line',
  args: { scope: 'session', session: 'yk', scopeId: 'w1', name: 'refund flow', sub: '4 changed', locked: false },
  argTypes: {
    scope: { control: 'inline-radio', options: ['main', 'session', 'you', 'plan'] },
    session: { control: 'inline-radio', options: ['yk', 'tl', 'mg', 'cy', 'ol', 'sn', 'pl'] },
  },
  render: (args) => pane(line(args as LineOpts)),
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const Main: Story = { name: 'main · neutral, as on disk', render: () => pane(line({ sub: 'as on disk' })) };
export const Session: Story = {
  name: 'session · its colour and tint: yk, tl',
  render: () => pane(
    line({ scope: 'session', session: 'yk', scopeId: 'w1', name: 'refund flow', sub: '4 changed' }),
    line({ scope: 'session', session: 'tl', scopeId: 'w2', name: 'webhook retries', sub: '1 changed' }),
  ),
};
export const You: Story = { name: 'you · sel', render: () => pane(line({ scope: 'you', name: 'fix-pool-size', sub: 'manual' })) };
export const YouLocked: Story = { name: 'you locked · 🔒 after the words', render: () => pane(line({ scope: 'you', name: 'fix-pool-size', sub: 'manual', locked: true })) };
export const Plan: Story = { name: 'plan · sug', render: () => pane(line({ scope: 'plan', name: 'refund flow', sub: '5 elements' })) };
export const SessionLocked: Story = { name: 'session locked', render: () => pane(line({ scope: 'session', session: 'yk', scopeId: 'w1', name: 'refund flow', locked: true })) };
export const EverySession: Story = {
  name: 'every session colour · the note stays readable on each tint',
  render: () => pane(...(['yk', 'tl', 'mg', 'cy', 'ol', 'sn', 'pl'] as const).map((s, i) => line({ scope: 'session', session: s, scopeId: `w${i + 1}`, name: 'refund flow', sub: 'note' }))),
};
export const LongName: Story = { name: 'a long name ends in an ellipsis; the note and the lock stay', render: () => pane(line({ scope: 'you', name: 'fix-pool-size-and-the-retry-budget-of-the-webhook-client', sub: 'manual', locked: true })) };
