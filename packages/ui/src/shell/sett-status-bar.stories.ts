import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-status-bar.js';

type Kind = 'main' | 'session' | 'you' | 'plan';

// the scope item per scope: the words come from the item (scopeText), the state is the content
const SCOPE: Record<Kind, unknown> = {
  main: html`<sett-status-item scope="main">up to date</sett-status-item>`,
  session: html`<sett-status-item scope="session" session="yk" scope-id="w1" name="refund flow"><span data-tone="sug">2 behind main</span></sett-status-item>`,
  you: html`<sett-status-item scope="you" name="fix-pool-size" locked>2 changed</sett-status-item>`,
  plan: html`<sett-status-item scope="plan" name="refund flow">5 elements</sett-status-item>`,
};

const bar = (kind: Kind, file = false) => html`<sett-status-bar>
  ${SCOPE[kind]}
  <sett-status-item label="Sessions"><b>2</b> running · <span data-tone="sug">1 asks</span></sett-status-item>
  <sett-status-item label="Findings"><b>2</b> · <span data-tone="bad">1 blocks</span></sett-status-item>
  <sett-status-item label="Checks"><span data-tone="sug">judge running</span></sett-status-item>
  ${file ? html`<sett-status-item slot="right">Ln 14, Col 9 · rust</sett-status-item>` : ''}
  <sett-status-item slot="right"><span data-tone="ok">Map up to date · 2 s</span></sett-status-item>
</sett-status-bar>`;

const labelled = (label: string, b: unknown) => html`<div style="display:grid;gap:var(--sett-space-1)"><span style="font-size:var(--sett-font-size-xs);color:var(--sett-color-mute)">${label}</span>${b}</div>`;
const both = (kind: Kind) => html`<div style="display:grid;gap:var(--sett-space-4)">${labelled('the map in the centre', bar(kind))}${labelled('a file open: the caret and the language on the right', bar(kind, true))}</div>`;

const meta: Meta = {
  title: 'shell/status bar',
  component: 'sett-status-bar',
  args: { scope: 'main', file: false },
  argTypes: { scope: { control: 'inline-radio', options: ['main', 'session', 'you', 'plan'] } },
  render: ({ scope, file }) => bar(scope as Kind, file as boolean),
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const Main: Story = { name: 'main · up to date', render: () => both('main') };
export const Session: Story = { name: 'session · 2 behind main', render: () => both('session') };
export const YouLocked: Story = { name: 'you locked · 2 changed', render: () => both('you') };
export const Plan: Story = { name: 'plan', render: () => both('plan') };
export const Links: Story = {
  name: 'items · the host is the link, or an anchor with href; a count is ink, a tone is its accent',
  render: () => html`<sett-status-bar>
    <sett-status-item label="Sessions"><b>2</b> running</sett-status-item>
    <sett-status-item label="Findings" href="#findings"><b>2</b> · <span data-tone="bad">1 blocks</span></sett-status-item>
    <sett-status-item label="Checks" href="#checks"><span data-tone="ok">all passed</span></sett-status-item>
    <sett-status-item slot="right" href="#map"><span data-tone="ok">Map up to date · 2 s</span></sett-status-item>
  </sett-status-bar>`,
};
