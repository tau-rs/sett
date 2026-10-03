import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-sessions-view.js';

// the view fills the left pane: paper, at the pane's narrow width
const pane = (body: unknown) => html`<div style="box-sizing:border-box;width:var(--sett-size-shell-pane-min);background:var(--sett-color-paper);border:var(--sett-stroke-hair) solid var(--sett-color-line2)">${body}</div>`;

interface RefundOpts { selected?: boolean; scoped?: boolean; open?: boolean; agent?: string }

// the running session, refund flow (w1, yk): group 1 done, the gate judging, group 2 writing
const refund = (o: RefundOpts = {}) => html`<sett-session-row scope="session" session="yk" name="refund flow" state="gate · group 1 → group 2" tone="session" running ?open=${o.open} ?selected=${o.selected} ?scoped=${o.scoped}>
  <sett-group-row name="group 1" state="done" depth="1" open>
    <sett-agent-row session="yk" name="a1 · OrderRepo: add refund()" state="done" depth="2"></sett-agent-row>
    <sett-agent-row session="yk" name="a2 · PgOrderRepo: implement refund()" state="writing" depth="2" open ?selected=${o.agent === 'a2'}>
      <sett-file-row letter="M" name="store/pg.rs" counts="+18 −2" depth="3"></sett-file-row>
      <sett-file-row letter="A" name="tests/lifecycle.rs" counts="+31" depth="3"></sett-file-row>
    </sett-agent-row>
  </sett-group-row>
  <sett-group-row kind="gate" name="gate · group 1 → group 2" state="judge" depth="1"></sett-group-row>
  <sett-group-row name="group 2" state="running" depth="1" open>
    <sett-agent-row session="yk" name="a3 · pay(), close()" state="writing" depth="2" open>
      <sett-file-row letter="M" name="api/service.rs" counts="+6" depth="3"></sett-file-row>
    </sett-agent-row>
  </sett-group-row>
  <sett-changes-row depth="1" meta="2 ahead · MR !42 · gated"></sett-changes-row>
</sett-session-row>`;

const all = (o: RefundOpts & { you?: boolean } = {}) => html`<sett-sessions-view>
  <sett-view-section label="planning" count="1">
    <sett-session-row scope="plan" name="rate limit headers" state="5 elements" tone="sug"></sett-session-row>
  </sett-view-section>
  <sett-view-section label="yours" count="1">
    <sett-session-row scope="you" name="fix-pool-size" state="🔒 locked" meta="main · 2 files" ?scoped=${o.you}></sett-session-row>
  </sett-view-section>
  <sett-view-section label="needs you" count="1">
    <sett-session-row scope="session" session="tl" name="webhook retries" state="asks you" tone="sug"></sett-session-row>
  </sett-view-section>
  <sett-view-section label="running" count="1">${refund(o)}</sett-view-section>
  <sett-view-section label="in review" count="1">
    <sett-session-row scope="session" session="mg" name="rate limits" state="2 remarks"></sett-session-row>
  </sett-view-section>
  <sett-view-section label="done" count="2">
    <sett-session-row scope="session" session="cy" name="idempotency keys" meta="merged" dim></sett-session-row>
    <sett-session-row scope="session" session="ol" name="pg pool sizing" meta="merged" dim></sett-session-row>
  </sett-view-section>
  <sett-new-session-row slot="foot"></sett-new-session-row>
</sett-sessions-view>`;

const meta: Meta = {
  title: 'shell/sessions view',
  component: 'sett-sessions-view',
  args: { open: true, selected: false, scoped: false },
  render: (args) => pane(all(args as RefundOpts)),
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const AllSessions: Story = { name: 'all sessions · planning, yours, needs you, running unfolded, in review, done, the door', render: () => pane(all({ open: true })) };
export const Folded: Story = { name: 'all sessions · every session folded', render: () => pane(all({ open: false })) };
export const Selected: Story = { name: 'selected session · the Focus button on the row, nothing else changes', render: () => pane(all({ open: true, selected: true })) };
export const Scoped: Story = { name: "scoped session · a scope tag in the session's tint instead of the button", render: () => pane(all({ open: true, selected: true, scoped: true })) };
export const AgentSelected: Story = { name: 'a sub-agent selected · its thread is in the inspector', render: () => pane(all({ open: true, agent: 'a2' })) };
export const Isolated: Story = {
  name: 'isolated on a session · ‹ all sessions, the session unfolded, scoped',
  render: () => pane(html`<sett-sessions-view isolated count="6">${refund({ open: true, selected: true, scoped: true })}</sett-sessions-view>`),
};
export const IsolatedYou: Story = {
  name: 'isolated on a you session · locked, its files and changes',
  render: () => pane(html`<sett-sessions-view isolated count="6">
    <sett-session-row scope="you" name="fix-pool-size" state="🔒 locked" open selected scoped>
      <sett-file-row letter="M" name="store/pg.rs" counts="+12" depth="1"></sett-file-row>
      <sett-file-row letter="A" name="store/pool.rs" counts="+8" depth="1"></sett-file-row>
      <sett-changes-row depth="1" meta="0 ahead · not committed"></sett-changes-row>
    </sett-session-row>
  </sett-sessions-view>`),
};
export const GroupStates: Story = {
  name: "group rows · rule 7's words: done, running, gate, failed n/m, waiting; a gate row judging",
  render: () => pane(html`<sett-sessions-view>
    <sett-view-section label="running" count="1">
      <sett-session-row scope="session" session="sn" name="retry budget" state="gate · group 2 → group 3" tone="session" open>
        <sett-group-row name="group 1" state="done" depth="1"></sett-group-row>
        <sett-group-row kind="gate" name="gate · group 1 → group 2" state="judge" depth="1"></sett-group-row>
        <sett-group-row name="group 2" state="running" depth="1" open>
          <sett-agent-row session="sn" name="a4 · RetryPolicy: backoff()" state="asks" depth="2"></sett-agent-row>
          <sett-agent-row session="sn" name="a5 · tests" state="paused" depth="2"></sett-agent-row>
        </sett-group-row>
        <sett-group-row name="group 3" state="gate" depth="1"></sett-group-row>
        <sett-group-row name="group 4" state="failed 1/3" depth="1"></sett-group-row>
        <sett-group-row name="group 5" state="waiting" depth="1"></sett-group-row>
      </sett-session-row>
    </sett-view-section>
  </sett-sessions-view>`),
};
export const FileRows: Story = {
  name: 'file rows · every letter, viewed, dim, selected, a writer, a verb',
  render: () => pane(html`<sett-sessions-view>
    <sett-view-section label="files" count="6">
      <sett-file-row letter="M" name="store/pg.rs" counts="+18 −2" writer="a2"></sett-file-row>
      <sett-file-row letter="A" name="tests/lifecycle.rs" counts="+31" viewed></sett-file-row>
      <sett-file-row letter="D" name="store/legacy.rs" counts="−40" selected></sett-file-row>
      <sett-file-row letter="R" name="api/router.rs" counts="+1 −1"></sett-file-row>
      <sett-file-row letter="?" name="notes.md" dim></sett-file-row>
      <sett-file-row letter="M" name="api/service.rs" counts="+6"><sett-button slot="verb" size="sm">stage</sett-button></sett-file-row>
    </sett-view-section>
  </sett-sessions-view>`),
};
export const PlanElements: Story = {
  name: 'a plan being shaped · its elements under their groups, one the planner asks about',
  render: () => pane(html`<sett-sessions-view isolated count="5">
    <sett-session-row scope="plan" name="refund flow" state="shaping" tone="sug" open selected scoped>
      <sett-group-row name="group 1" state="2 elements" depth="1" open>
        <sett-element-row name="E1 · OrderRepo: add refund()" depth="2"></sett-element-row>
        <sett-element-row name="E2 · PgOrderRepo: implement refund()" depth="2"></sett-element-row>
      </sett-group-row>
      <sett-group-row kind="gate" name="gate · group 1 → group 2" state="tests green" depth="1"></sett-group-row>
      <sett-group-row name="group 2" state="3 elements" depth="1" open>
        <sett-element-row name="E3 · pay() calls refund()" depth="2"></sett-element-row>
        <sett-element-row name="E4 · close() calls refund()" depth="2"></sett-element-row>
        <sett-element-row name="E5 · handle_webhook(): fail fast" depth="2" state="asks" selected></sett-element-row>
      </sett-group-row>
      <sett-changes-row depth="1" meta="no branch yet · created at accept"></sett-changes-row>
    </sett-session-row>
  </sett-sessions-view>`),
};
export const Empty: Story = {
  name: 'empty · no session yet: the sections stay, the door names the way',
  render: () => pane(html`<sett-sessions-view>
    <sett-view-section label="running" count="0"></sett-view-section>
    <sett-view-section label="done" count="0"></sett-view-section>
    <sett-new-session-row slot="foot"></sett-new-session-row>
  </sett-sessions-view>`),
};
