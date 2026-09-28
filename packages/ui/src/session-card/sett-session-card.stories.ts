import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { sessionOrder } from '@tau-rs/sett-tokens';
import './sett-session-card.js';

const subs = (n: number) => ['store', 'tests/refund.rs', 'migrations', 'docs', 'bench', 'lint', 'types', 'ci', 'fixtures', 'perf', 'i18n', 'cleanup'].slice(0, n)
  .map((s, i) => html`<sett-sub-agent slot="sub" state=${i < 2 ? 'done' : i < 4 ? 'running' : 'pending'}>${s}</sett-sub-agent>`);
const running = (open = false, n = 6, session = 'yk', still = false) => html`<sett-session-card name="Yokohama" driver="claude code" session=${session} step="3" of="6" running ?still=${still} style="width:250px">
  <sett-plan-row state="done">RefundRequest</sett-plan-row>
  <sett-plan-row state="done">Refunds · port</sett-plan-row>
  <sett-plan-row state="running" current ?open=${open}>PgRefundRepo${subs(n)}</sett-plan-row>
  <sett-plan-row state="pending">refund() in api</sett-plan-row>
  <sett-plan-row state="pending">webhook · refund</sett-plan-row>
  <span slot="foot">started 14 min ago</span><a slot="thread">thread ›</a>
</sett-session-card>`;
const trouble = html`<sett-session-card name="Lyon" driver="codex" session="tl" step="4" of="6" style="width:250px">
  <sett-plan-row state="done">RetryPolicy</sett-plan-row>
  <sett-plan-row state="asks" count="2">WebhookQueue</sett-plan-row>
  <sett-plan-row state="paused">PgQueue</sett-plan-row>
  <sett-plan-row state="stepped-in" who="you">retry() in api</sett-plan-row>
  <sett-plan-row state="deviation">HttpNotifier</sett-plan-row>
  <sett-plan-row state="pending">tests</sett-plan-row>
  <span slot="foot">paused 2 min ago</span><a slot="thread">thread ›</a>
</sett-session-card>`;

const meta: Meta = {
  title: 'primitives/session card',
  component: 'sett-session-card',
  argTypes: { session: { control: 'select', options: sessionOrder } },
  render: () => running(),
};
export default meta;
type Story = StoryObj;

export const RunningWithSubAgents: Story = { name: 'running · element 3 of 6 · six sub-agents, folded', render: () => running(false) };
export const SubAgentsOpen: Story = { name: 'running · sub-agents unfolded', render: () => running(true) };
export const ManySubAgents: Story = { name: 'running · twelve sub-agents', render: () => html`<div class="sett-row">${running(false, 12)}${running(true, 12)}</div>` };
export const Trouble: Story = { name: 'asks · paused · stepped in · deviation', render: () => trouble };
export const GlyphColumn: Story = {
  name: 'the glyph column',
  render: () => html`<sett-session-card name="glyphs" driver="" style="width:250px">
    ${(['done', 'running', 'paused', 'stepped-in', 'deviation', 'asks', 'pending'] as const).map((s) => html`<sett-plan-row state=${s} count="2" who=${s === 'stepped-in' ? 'you' : ''}>${s}</sett-plan-row>`)}
  </sett-session-card>`,
};
export const OtherSession: Story = { name: 'another session colour', render: () => running(true, 6, 'mg') };
export const ReducedMotion: Story = { name: 'reduced motion · dot still', render: () => running(false, 6, 'yk', true) };
