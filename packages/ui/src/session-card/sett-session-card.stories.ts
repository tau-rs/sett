import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { sessionOrder } from '@tau-rs/sett-tokens';
import './sett-session-card.js';
import '../thread/sett-thread.js';
import '../shell/sett-inspector.js';

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
  <sett-plan-row state="taken-over" who="you">retry() in api</sett-plan-row>
  <sett-plan-row state="deviation">HttpNotifier</sett-plan-row>
  <sett-plan-row state="pending">tests</sett-plan-row>
  <span slot="foot">paused 2 min ago</span><a slot="thread">thread ›</a>
</sett-session-card>`;

// groups as lanes (DESIGN.md rule 7): the gate words on the right, elements inside, sub-agents folded under the group
const groups = (g1: string, g2: string, g3: string, o: { open?: boolean; running?: boolean; step?: number } = {}) => html`<sett-session-card name="Yokohama" driver="claude code" session="yk" step=${o.step ?? 3} of="6" ?running=${o.running ?? true} style="width:250px">
  <sett-plan-row kind="group" gate=${g1}>group 1
    <sett-plan-row slot="element" state="done">RefundRequest</sett-plan-row>
    <sett-plan-row slot="element" state="done">Refunds · port</sett-plan-row>
  </sett-plan-row>
  <sett-plan-row kind="group" gate=${g2} ?open=${o.open ?? false}>group 2
    <sett-sub-agent slot="sub" state="done">a1 · store</sett-sub-agent>
    <sett-sub-agent slot="sub" state="running">a2 · tests/refund.rs</sett-sub-agent>
    <sett-sub-agent slot="sub">a3 · migrations</sett-sub-agent>
    <sett-plan-row slot="element" state=${g2 === 'running' ? 'running' : 'pending'} ?current=${g2 === 'running'}>PgRefundRepo</sett-plan-row>
    <sett-plan-row slot="element" state="pending">refund() in api</sett-plan-row>
  </sett-plan-row>
  <sett-plan-row kind="group" gate=${g3}>group 3
    <sett-plan-row slot="element" state="pending">webhook · refund</sett-plan-row>
  </sett-plan-row>
  <span slot="foot">4 changed · +59 −2 · 2 ahead</span><a slot="thread">thread ›</a>
</sett-session-card>`;

// the card with its fixed bar (DESIGN.md "The shell" rule 6; the verbs are rule 9's words, encoded in sett-verbs)
const withBar = (state: 'running' | 'paused' | 'taken-over') => html`<sett-session-card name="Yokohama" driver="claude code" session="yk" step="3" of="6" ?running=${state === 'running'} style="width:var(--sett-size-shell-inspector)">
  <sett-plan-row state="done">RefundRequest</sett-plan-row>
  <sett-plan-row state="done">Refunds · port</sett-plan-row>
  <sett-plan-row state=${state === 'running' ? 'running' : state === 'paused' ? 'paused' : 'taken-over'} who=${state === 'taken-over' ? 'you' : ''} current>PgRefundRepo</sett-plan-row>
  <sett-plan-row state="pending">refund() in api</sett-plan-row>
  <sett-plan-row state="pending">webhook · refund</sett-plan-row>
  <span slot="foot">${state === 'running' ? 'started 14 min ago' : state === 'paused' ? 'paused 2 min ago' : 'held 40 s'} · 4 changed</span><a slot="thread">thread ›</a>
  <sett-verbs slot="verbs" state=${state} subject="PgRefundRepo" session="yk"></sett-verbs>
  ${state === 'taken-over'
    ? html`<sett-composer slot="composer" mode="handback"><span slot="files">pg.rs · tests/refund.rs</span></sett-composer>`
    : html`<sett-composer slot="composer" placeholder="tell Yokohama…"></sett-composer>`}
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
export const Trouble: Story = { name: 'asks · paused · taken over · deviation', render: () => trouble };
export const Resolve: Story = {
  name: 'resolve · a conflict added an element to the plan (spec §13.19)',
  render: () => html`<sett-session-card name="Lyon" driver="codex" session="tl" step="3" of="4" style="width:250px">
    <sett-plan-row state="done">RetryPolicy</sett-plan-row>
    <sett-plan-row state="done">PgQueue</sett-plan-row>
    <sett-plan-row state="resolve" current>pool.rs · with w2 · fix-pool-size</sett-plan-row>
    <sett-plan-row state="pending">tests</sett-plan-row>
    <span slot="foot">paused 20 s ago</span><a slot="thread">thread ›</a>
  </sett-session-card>`,
};
export const Groups: Story = { name: 'groups as lanes · done · running · waiting', render: () => groups('done', 'running', 'waiting') };
export const GroupsOpen: Story = { name: 'groups · sub-agents unfolded under their group', render: () => groups('done', 'running', 'waiting', { open: true }) };
export const GroupGate: Story = { name: 'gate · group 1 runs its gate, group 2 waits', render: () => groups('gate', 'waiting', 'waiting', { running: false, step: 2 }) };
export const GroupGateFailed: Story = { name: 'gate failed 1/2 · a fix round runs', render: () => groups('failed 1/2', 'waiting', 'waiting', { step: 2 }) };
export const GateColumn: Story = {
  name: 'the gate words · done · running · gate · failed n/m · waiting',
  render: () => html`<sett-session-card name="gates" driver="" style="width:250px">
    ${['done', 'running', 'gate', 'failed 1/2', 'waiting'].map((g, i) => html`<sett-plan-row kind="group" gate=${g}>group ${i + 1}</sett-plan-row>`)}
  </sett-session-card>`,
};
export const VerbsRunning: Story = { name: 'with its bar · running · pause · stop', render: () => withBar('running') };
export const VerbsPaused: Story = { name: 'with its bar · paused · resume · take over · stop', render: () => withBar('paused') };
export const VerbsTakenOver: Story = { name: 'with its bar · taken over · ✋ you · stop · the composer is the hand-back note', render: () => withBar('taken-over') };
export const GlyphColumn: Story = {
  name: 'the glyph column',
  render: () => html`<sett-session-card name="glyphs" driver="" style="width:250px">
    ${(['done', 'running', 'paused', 'taken-over', 'deviation', 'asks', 'resolve', 'pending'] as const).map((s) => html`<sett-plan-row state=${s} count="2" who=${s === 'taken-over' ? 'you' : ''}>${s}</sett-plan-row>`)}
  </sett-session-card>`,
};
export const InTheInspector: Story = {
  name: 'in the inspector · headless · the heading writes the name, the card keeps n/m in its foot',
  render: () => html`<div style="width:var(--sett-size-shell-inspector);height:calc(var(--sett-space-6) * 12);display:flex;border:var(--sett-stroke-hair) solid var(--sett-color-line);border-radius:var(--sett-radius-card);overflow:hidden">
    <sett-inspector heading="Yokohama" sub="claude code · w1 · 14 min" state="running" session="yk" style="flex:1">
      <sett-session-card headless name="Yokohama" driver="claude code" session="yk" step="3" of="6" running style="margin:var(--sett-space-2) var(--sett-space-3)">
        <sett-plan-row state="done">RefundRequest</sett-plan-row>
        <sett-plan-row state="done">Refunds · port</sett-plan-row>
        <sett-plan-row state="running" current>PgRefundRepo${subs(3)}</sett-plan-row>
        <sett-plan-row state="pending">refund() in api</sett-plan-row>
        <sett-plan-row state="pending">webhook · refund</sett-plan-row>
        <span slot="foot">started 14 min ago</span><a slot="thread">thread ›</a>
      </sett-session-card>
    </sett-inspector>
  </div>`,
};
export const OtherSession: Story = { name: 'another session colour', render: () => running(true, 6, 'mg') };
export const ReducedMotion: Story = { name: 'reduced motion · dot still', render: () => running(false, 6, 'yk', true) };
