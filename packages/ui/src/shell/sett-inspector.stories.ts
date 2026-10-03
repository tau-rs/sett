import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-inspector.js';
import '../session-card/sett-session-card.js';
import '../thread/sett-thread.js';
import '../button/sett-button.js';
import '../menu/sett-menu.js';
import '../card/sett-card.js';

// the pane at the app's width, in a frame the height of a short shell
const H = 'calc(var(--sett-space-6) * 20)';
const pane = (inner: unknown, h = H) => html`<div style="width:var(--sett-size-shell-inspector);height:${h};display:flex;border:var(--sett-stroke-hair) solid var(--sett-color-line);border-radius:var(--sett-radius-card);overflow:hidden">${inner}</div>`;

const sessionCard = html`<sett-inspector heading="refund flow" sub="claude code · w1 · 14 min" state="running" session="yk" style="flex:1">
  <sett-session-card headless name="refund flow" driver="claude code" session="yk" step="2" of="4" running style="margin:var(--sett-space-2) var(--sett-space-3)">
    <sett-plan-row state="done">OrderRepo: refund()</sett-plan-row>
    <sett-plan-row state="running" current>PgOrderRepo: refund()<sett-sub-agent slot="sub" state="running">a2 · store/pg.rs</sett-sub-agent><sett-sub-agent slot="sub" state="pending">tests/lifecycle.rs</sett-sub-agent></sett-plan-row>
    <sett-plan-row state="pending">pay(), close() call refund()</sett-plan-row>
    <sett-plan-row state="pending">handle_webhook()</sett-plan-row>
    <span slot="foot">group 1 · gate after · group 2 waiting</span><a slot="thread">thread ›</a>
  </sett-session-card>
  <sett-button slot="verbs">pause</sett-button><sett-button slot="verbs" variant="quiet">stop</sett-button>
  <span slot="note">verbs are words · pause, then take over · the thread is under thread ›</span>
  <sett-composer slot="composer" placeholder="reply to refund flow… (read before its next step)"></sett-composer>
</sett-inspector>`;

const subAgent = html`<sett-inspector heading="a2" sub="refund flow · group 1 · E2" state="writing" session="yk" style="flex:1">
  <sett-msg from="sub" author="a2 · E2" time="12:41" session="yk">Implementing refund() against the pool; adding a lifecycle test.<sett-tool>arch.write store/pg.rs · ok · 3e9a…</sett-tool></sett-msg>
  <sett-msg from="sub" author="a2 · E2" time="12:43" session="yk">Running check on the diff.<sett-tool>arch.check --diff → 0 findings</sett-tool><sett-changed none>no change on the map</sett-changed></sett-msg>
  <sett-msg from="me" author="you" time="12:44">keep the transaction on the pool; the test can use the fixture.</sett-msg>
  <sett-button slot="verbs">pause a2</sett-button>
  <span slot="note">pause, then take over E2 · words, never glyphs</span>
  <sett-composer slot="composer" placeholder="reply to a2…"></sett-composer>
</sett-inspector>`;

const planner = html`<sett-inspector heading="planner" sub="refund flow" state="draft" kind="planner" style="flex:1">
  <sett-card style="margin:var(--sett-space-2) var(--sett-space-3)"><span slot="title">plan · 4 elements · 2 groups</span>
    <sett-card-row mark="·" kind="sug"><b>E1</b> · OrderRepo: refund()<span slot="right">group 1</span></sett-card-row>
    <sett-card-row mark="·" kind="sug"><b>E2</b> · PgOrderRepo: refund()<span slot="right">group 1</span></sett-card-row>
    <sett-card-row mark="·" kind="sug"><b>E3</b> · pay(), close()<span slot="right">group 2</span></sett-card-row>
    <sett-card-row mark="·" kind="sug"><b>E4</b> · handle_webhook()<span slot="right">group 2</span></sett-card-row></sett-card>
  <sett-msg from="agent" author="planner" time="now" style="--_session:var(--sett-color-sug)">Two groups by dependency; the port and its impl first, one gate per group. Want the webhook in group 1 instead?<sett-changed>changed · 4 elements drafted</sett-changed></sett-msg>
  <sett-split-button slot="verbs">accept · delegate<sett-menu slot="menu" label="driver"><sett-menu-item state="main" selected>claude code</sett-menu-item><sett-menu-item state="main">codex</sett-menu-item></sett-menu></sett-split-button>
  <sett-button slot="verbs">save plan</sett-button><sett-button slot="verbs" variant="quiet">discard</sett-button>
  <span slot="note">accept creates the branch, the worktree and the plan · save plan keeps it as a locked you session</span>
  <sett-composer slot="composer" placeholder="answer, or say how…"></sett-composer>
</sett-inspector>`;

const meta: Meta = { title: 'shell/inspector', component: 'sett-inspector' };
export default meta;
type Story = StoryObj;

export const SessionCard: Story = { name: 'session card · pause · stop, a note, the composer', render: () => pane(sessionCard) };
export const SubAgentThread: Story = { name: 'sub-agent thread · messages and tool lines', render: () => pane(subAgent) };
export const Planner: Story = { name: 'planner · accept · delegate ▾, save plan, discard', render: () => pane(planner) };
export const Folded: Story = { name: 'folded · the handle, the heading as its title', render: () => html`<div style="height:${H};display:flex;border:var(--sett-stroke-hair) solid var(--sett-color-line);border-radius:var(--sett-radius-card);overflow:hidden"><sett-inspector heading="refund flow" session="yk" folded><p>hidden while folded</p></sett-inspector></div>` };
export const States: Story = { name: 'states · running, draft, 🔒 locked, new in bad', render: () => html`<div style="display:grid;gap:var(--sett-space-2)">
  ${pane(html`<sett-inspector heading="refund flow" sub="claude code · w1" state="running" session="yk" style="flex:1"><p style="margin:var(--sett-space-2) var(--sett-space-3);color:var(--sett-color-ink2)">a running session</p></sett-inspector>`, 'auto')}
  ${pane(html`<sett-inspector heading="planner" sub="refund flow" state="draft" kind="planner" style="flex:1"><p style="margin:var(--sett-space-2) var(--sett-space-3);color:var(--sett-color-ink2)">a plan being shaped</p></sett-inspector>`, 'auto')}
  ${pane(html`<sett-inspector heading="you · fix-pool-size" sub="manual · main · detected" state="🔒 locked" kind="fixer" style="flex:1"><p style="margin:var(--sett-space-2) var(--sett-space-3);color:var(--sett-color-ink2)">a locked you session</p></sett-inspector>`, 'auto')}
  ${pane(html`<sett-inspector heading="finding" sub="api must not depend on store · blocks" state="new" tone="bad" style="flex:1"><p style="margin:var(--sett-space-2) var(--sett-space-3);color:var(--sett-color-ink2)">a new finding</p></sett-inspector>`, 'auto')}
</div>` };
