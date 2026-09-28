import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-thread.js';
import '../tag/sett-tag.js';

const box = (inner: unknown, h = 'auto') => html`<div style="width:330px;height:${h};border:var(--sett-stroke-hair) solid var(--sett-color-line);border-radius:var(--sett-radius-card);overflow:hidden;display:flex">${inner}</div>`;
const meta: Meta = { title: 'thread/thread', component: 'sett-thread' };
export default meta;
type Story = StoryObj;

const sessionThread = (verbs: unknown, composer: unknown) => html`<sett-thread identity="session" session="yk" style="flex:1">
  <span slot="name">Yokohama</span><span slot="context">claude code · PgRefundRepo</span><span slot="role">session</span>
  <sett-msg from="me" author="you" time="14:02">Add refunds for paid orders. Keep the payments port; a refund is a new port method, not a new client.</sett-msg>
  <sett-msg from="agent" author="Yokohama" time="14:03" session="yk">Plan accepted. Starting with the domain: RefundRequest, then the port.<sett-tool>read domain/order.rs · 1–120
arch reach OrderRepo · depth 1</sett-tool><sett-changed>changed · RefundRequest added · Refunds port added</sett-changed></sett-msg>
  <sett-msg from="sub" author="sub · store" time="14:05" session="yk">Implementing PgRefundRepo. Reusing the sqlx transaction.<sett-tool>edit store/pg.rs · +38 −2</sett-tool><sett-changed none>no change on the map yet</sett-changed></sett-msg>
  <sett-question author="Yokohama" count="2">Refund a partially shipped order?
    <sett-option slot="option" value="refuse" effect="no map change">refuse · refund only unshipped</sett-option>
    <sett-option slot="option" value="allow" effect="+1 item in domain">allow · new Partial status</sett-option>
    <sett-option slot="option" value="ask" effect="+1 link api → payments">ask the payments provider first</sett-option>
  </sett-question>
  <sett-deviation subject="HttpNotifier">Yokohama: refund confirmations need an email; there is no notifier port, so I called reqwest from api directly.
    <sett-option slot="way" value="back" label="back on the plan">revert the call · do it through a port</sett-option>
    <sett-option slot="way" value="update" label="update the plan">absorb: add a Notifier port as element 7</sett-option>
    <sett-option slot="way" value="carve" label="not this change">carve out as a follow-up · revert here</sett-option>
    <sett-option slot="way" value="discuss" label="discuss" quiet>not a decision · how you get to one</sett-option>
  </sett-deviation>
  ${verbs}${composer}
</sett-thread>`;

export const Session: Story = { name: 'session · every content kind', render: () => box(sessionThread(html`<sett-verbs slot="verbs" state="running" subject="PgRefundRepo" session="yk"></sett-verbs>`, html`<sett-composer slot="composer" placeholder="tell Yokohama…"></sett-composer>`), '720px') };
export const Planner: Story = { name: 'planner · amber top', render: () => box(html`<sett-thread identity="planner" style="flex:1"><span slot="name">planner</span><span slot="context">shaping · 3 elements</span><span slot="role">plan</span>
  <sett-msg from="me" author="intention">Add refunds for paid orders.</sett-msg>
  <sett-msg from="agent" author="planner" style="--_session:var(--sett-color-sug)">Three elements, in the columns the map already has. One question below.<sett-changed>changed · 3 elements drafted</sett-changed></sett-msg>
  <sett-verbs slot="verbs">draft · 1 question open</sett-verbs><sett-composer slot="composer" placeholder="answer, or say how…"></sett-composer></sett-thread>`) };
export const Framer: Story = { name: 'framer · blue top, witnesses', render: () => box(html`<sett-thread identity="framer" style="flex:1"><span slot="name">ask</span><span slot="context">orderly · main</span><span slot="role">framer</span>
  <sett-msg from="me" author="you">who calls OrderRepo::save outside api?</sett-msg>
  <sett-msg from="agent" author="answer · 2 witnesses" style="--_session:var(--sett-color-sel)">Nobody outside api. Two callers, both in service.rs. <sett-tag mono kind="sel">service.rs:61</sett-tag> <sett-tag mono kind="sel">service.rs:88</sett-tag></sett-msg>
  <sett-verbs slot="verbs">judgement · none needed<span slot="actions"><button>make it so ›</button></span></sett-verbs><sett-composer slot="composer" placeholder="ask the repo… ⌘K"></sett-composer></sett-thread>`) };
export const Fixer: Story = { name: 'fixer · blue top, the finding’s doors', render: () => box(html`<sett-thread identity="fixer" style="flex:1"><span slot="name">fix</span><span slot="context">no-http-in-domain</span><span slot="role">fixer</span>
  <sett-msg from="agent" author="fixer" style="--_session:var(--sett-color-sel)">One site in api/notify.rs calls reqwest directly.</sett-msg>
  <sett-verbs slot="verbs"><sett-tag kind="bad">⚠</sett-tag> no-http-in-domain · 1 site</sett-verbs><sett-composer slot="composer" placeholder="say how…"></sett-composer></sett-thread>`) };
export const Messages: Story = { name: 'msg · me, agent, sub', render: () => html`<div style="width:330px;display:flex;flex-direction:column;gap:8px">
  <sett-msg from="me" author="you" time="14:02">yours, on the right, selection tint</sett-msg>
  <sett-msg from="agent" author="Yokohama" time="14:03">agent, outlined in its colour</sett-msg>
  <sett-msg from="sub" author="sub · store" time="14:05">sub-agent, in the sub shade</sett-msg>
  <sett-msg from="agent" author="Lyon" session="tl">another session</sett-msg></div>` };
export const ToolAndChanged: Story = { name: 'tool block · changed · no change', render: () => html`<div style="width:330px"><sett-msg from="agent" author="Yokohama"><sett-tool>read domain/order.rs · 1–120
arch reach OrderRepo · depth 1</sett-tool><sett-changed>changed · RefundRequest added</sett-changed> <sett-changed none>no change</sett-changed></sett-msg></div>` };
export const Question: Story = { name: 'question · options and later', render: () => html`<div style="width:330px"><sett-question author="Yokohama" count="2">Refund a partially shipped order?
  <sett-option slot="option" value="refuse" effect="no map change">refuse · refund only unshipped</sett-option>
  <sett-option slot="option" value="allow" effect="+1 item in domain">allow · new Partial status</sett-option></sett-question></div>` };
export const Deviation: Story = { name: 'deviation · three typologies', render: () => html`<div style="width:330px"><sett-deviation subject="HttpNotifier">No notifier port, so I called reqwest from api directly.
  <sett-option slot="way" value="back" label="back on the plan">revert the call · do it through a port</sett-option>
  <sett-option slot="way" value="update" label="update the plan">absorb: add a Notifier port as element 7</sett-option>
  <sett-option slot="way" value="carve" label="not this change">carve out as a follow-up · revert here</sett-option>
  <sett-option slot="way" value="discuss" label="discuss" quiet>not a decision · how you get to one</sett-option></sett-deviation></div>` };
export const Verbs: Story = { name: 'verbs bar · running, paused, taken over', render: () => html`<div style="width:330px;display:grid;gap:8px">
  <sett-verbs state="running" subject="PgRefundRepo"></sett-verbs>
  <sett-verbs state="paused" subject="PgRefundRepo"></sett-verbs>
  <sett-verbs state="taken-over" subject="PgRefundRepo"></sett-verbs>
  <sett-verbs state="running" subject="PgRefundRepo" still></sett-verbs></div>` };
export const Composer: Story = { name: 'composer · send and hand back', render: () => html`<div style="width:330px;display:grid;gap:8px">
  <sett-composer placeholder="tell Yokohama…"></sett-composer>
  <sett-composer mode="handback"><span slot="files">your edits are listed automatically: store/pg.rs · +12 −4</span></sett-composer></div>` };
export const HandBackMoment: Story = { name: 'hand back · before and after', render: () => html`<div style="display:flex;gap:12px">
  ${box(sessionThread(html`<sett-verbs slot="verbs" state="taken-over" subject="PgRefundRepo"></sett-verbs>`, html`<sett-composer slot="composer" mode="handback"><span slot="files">store/pg.rs · +12 −4</span></sett-composer>`), '720px')}
</div>` };
