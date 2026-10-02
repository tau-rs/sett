import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-card.js';
import '../pill/sett-pill.js';
import '../tag/sett-tag.js';
import '../button/sett-button.js';
import '../shell/sett-hunk.js';
import '../shell/sett-inspector.js';

const w = (inner: unknown) => html`<div style="width:300px">${inner}</div>`;
const meta: Meta = { title: 'cards/card', component: 'sett-card' };
export default meta;
type Story = StoryObj;

export const Fix: Story = { render: () => w(html`<sett-card variant="fix"><span slot="title">fix · no-http-in-domain</span><sett-tag slot="state" kind="bad">1 site</sett-tag>
  <sett-card-row mark="⚠" kind="bad" place="domain/notify.rs:12">uses reqwest</sett-card-row>
  <sett-card-row mark="→" kind="mute" nav="why">move the call behind a Notifier port in api</sett-card-row>
  <sett-button slot="acts" variant="primary" size="sm">with Yokohama</sett-button><sett-button slot="acts" size="sm">fix myself</sett-button><sett-button slot="acts" variant="quiet" size="sm">allow this site…</sett-button></sett-card>`) };
export const Delta: Story = { name: 'plan delta', render: () => w(html`<sett-card variant="delta"><span slot="title">plan delta</span><sett-tag slot="state" kind="sug">3 elements</sett-tag>
  <sett-card-row mark="+" kind="sug"><b>RefundRequest</b> · domain<span slot="right">new</span></sett-card-row>
  <sett-card-row mark="+" kind="sug"><b>Refunds</b> · port<span slot="right">new</span></sett-card-row>
  <sett-card-row mark="~" kind="sug"><b>PaymentsHttp</b> · +refund()<span slot="right">changed</span></sett-card-row>
  <sett-card-row mark="·" kind="mute">keeps: OrderRepo, Payments<span slot="right">unchanged</span></sett-card-row>
  <sett-button slot="acts" variant="primary" size="sm">accept · delegate to Yokohama ▾</sett-button><sett-button slot="acts" size="sm">save plan</sett-button></sett-card>`) };
export const Impact: Story = { render: () => w(html`<sett-card variant="impact"><span slot="title">impact · save() changed</span><sett-tag slot="state" kind="sel">2 feel it</sett-tag>
  <sett-card-row mark="▸" kind="mute" place="service.rs:61">api::pay</sett-card-row>
  <sett-card-row mark="▸" kind="mute" place="service.rs:88">api::close</sett-card-row>
  <sett-card-row mark="·" kind="mute" place="pg.rs:14">store::PgOrderRepo <sett-tag>impl</sett-tag></sett-card-row></sett-card>`) };
export const Checklist: Story = { name: 'merge checklist', render: () => w(html`<sett-card variant="checklist"><span slot="title">merge checklist</span><sett-pill slot="state" kind="bad">2 blocking</sett-pill>
  <sett-card-row mark="✓" kind="ok" nav="git">up to date with main</sett-card-row>
  <sett-card-row mark="✕" kind="bad" nav="pipeline">tests · 3 failed</sett-card-row>
  <sett-card-row mark="⚠" kind="bad" nav="findings">1 finding · no-http-in-domain</sett-card-row>
  <sett-card-row mark="·" kind="sug" nav="review">2 remarks open</sett-card-row>
  <sett-card-row mark="✓" kind="ok" nav="session">plan realized · 6/6</sett-card-row></sett-card>`) };
export const ChecklistNoPlan: Story = { name: 'merge checklist · plan · none · hand-made branch (spec §13.22)', render: () => w(html`<sett-card variant="checklist"><span slot="title">merge checklist</span><sett-pill slot="state" kind="ok">ready</sett-pill>
  <sett-card-row mark="✓" kind="ok" nav="git">up to date with main</sett-card-row>
  <sett-card-row mark="✓" kind="ok" nav="pipeline">tests · 41 passed</sett-card-row>
  <sett-card-row mark="✓" kind="ok" nav="findings">no finding</sett-card-row>
  <sett-card-row mark="·" kind="sug" nav="review">1 remark open</sett-card-row>
  <sett-card-row mark="·" kind="mute">plan · none · hand-made branch</sett-card-row></sett-card>`) };
export const Pipeline: Story = { render: () => w(html`<sett-card variant="pipeline"><span slot="title">pipeline · #418</span><sett-pill slot="state" kind="sug">running · 2/4</sett-pill>
  <sett-pipe steps="ok,ok,run,pending"></sett-pipe>
  <sett-card-row mark="✓" kind="ok">check<span slot="right">41 s</span></sett-card-row>
  <sett-card-row mark="✓" kind="ok">clippy<span slot="right">1 m 02</span></sett-card-row>
  <sett-card-row mark="●" kind="sug">test<span slot="right">running</span></sett-card-row>
  <sett-card-row mark="·" kind="mute">build image</sett-card-row></sett-card>`) };
export const Result: Story = { render: () => w(html`<sett-card variant="result"><span slot="title">✓ merged · feat/refund → main</span>
  <sett-card-row mark="·" kind="ok">3 commits · 9 files · +412 −38</sett-card-row>
  <sett-card-row mark="·" kind="ok">map: 3 items added, 1 changed · 2 sessions feel it</sett-card-row>
  <sett-card-row mark="·" kind="mute" nav="repo">branch archived · thread kept</sett-card-row></sett-card>`) };
export const WhatsNew: Story = { name: "what's new", render: () => w(html`<sett-card variant="whatsnew"><span slot="title">what's new · main moved</span><sett-tag slot="state" kind="sel">2 commits</sett-tag>
  <sett-card-row mark="◦" kind="mute"><sett-tag mono>a41f2c</sett-tag> pg: pool size from env<span slot="right">Mara · 2 h</span></sett-card-row>
  <sett-card-row mark="◦" kind="mute"><sett-tag mono>9c07e1</sett-tag> webhook: idempotency key<span slot="right">Lyon · 5 h</span></sett-card-row>
  <sett-card-row mark="→" kind="sug" nav="impact">touches PgOrderRepo, which this branch changed</sett-card-row></sett-card>`) };
export const Rows: Story = { name: 'rows · place, destination, note, none', render: () => w(html`<sett-card><span slot="title">rows</span>
  <sett-card-row mark="▸" kind="mute" place="service.rs:61">leads to a place in code</sett-card-row>
  <sett-card-row mark="✕" kind="bad" nav="pipeline">leads to another pane</sett-card-row>
  <sett-card-row mark="✓" kind="ok">a note on the right<span slot="right">41 s</span></sett-card-row>
  <sett-card-row mark="·" kind="mute">plain fact</sett-card-row></sett-card>`) };
export const Pipes: Story = { name: 'pipe · states', render: () => html`<div style="width:300px;display:grid;gap:8px"><sett-pipe steps="ok,ok,ok,ok"></sett-pipe><sett-pipe steps="ok,bad,pending,pending"></sett-pipe><sett-pipe steps="ok,ok,run,pending"></sett-pipe></div>` };
export const AllSeven: Story = { name: 'all seven', render: () => html`<div style="display:grid;grid-template-columns:repeat(2,300px);gap:10px">${[Fix, Delta, Impact, Checklist, Pipeline, Result, WhatsNew].map((s) => (s.render as any)())}</div>` };

// ── the inspector's layouts (shell lane E): the review page's checklist, delta and result; the daily page's What's new and fix card ──

const W = 'var(--sett-size-shell-inspector)';
const wide = (inner: unknown) => html`<div style="width:${W}">${inner}</div>`;
const how = html`<span slot="how">squash · from the forge's default · delete branch · archive session</span>`;

const mergeRows = (viewed: number, remarks: number, approved: boolean) => html`
  <sett-card-row mark="✓" kind="ok" nav="rate limits">plan 6/6 realized · 2 gates passed</sett-card-row>
  <sett-card-row mark="✓" kind="ok" nav="open">findings 0 new · 1 allowed</sett-card-row>
  <sett-card-row mark="✓" kind="ok" nav="checks">pipeline #9129 passed · judge pass</sett-card-row>
  <sett-card-row mark=${remarks ? '⚠' : '✓'} kind=${remarks ? 'sug' : 'ok'} nav=${remarks ? 'jump' : 'you'}>remarks asking for a change · ${remarks} open</sett-card-row>
  <sett-card-row mark=${viewed >= 6 ? '✓' : '⚠'} kind=${viewed >= 6 ? 'ok' : 'sug'} nav=${viewed >= 6 ? 'you' : 'next unread'}>files viewed · ${viewed} / 6</sett-card-row>
  <sett-card-row mark="✓" kind="ok">current with main<span slot="right">40 min</span></sett-card-row>
  ${approved ? html`<sett-card-row mark="✓" kind="ok">approved<span slot="right">you · just now</span></sett-card-row>` : html`<sett-card-row mark="·" kind="mute">approved<span slot="right">not yet</span></sett-card-row>`}`;

export const MergeBlocked: Story = { name: 'merge · checklist rows with their sources, the how, approve · merge gated by its reasons', render: () => wide(html`<sett-card variant="checklist"><span slot="title">merge !44 → main</span><sett-pill slot="state" kind="sug">2 lines block</sett-pill>
  ${mergeRows(3, 2, false)}${how}
  <sett-gated-button slot="acts" blocked>approve · merge<sett-pill slot="reason" kind="sug">2 remarks open</sett-pill><sett-pill slot="reason" kind="sug">3 files unviewed</sett-pill></sett-gated-button>
  <span slot="note">each line is a fact with its source; the ⚠ lines block · arch never merges on its own · the pipeline is the Checks tab</span></sett-card>`) };
export const MergeReady: Story = { name: 'merge · every line ✓, approve · merge open', render: () => wide(html`<sett-card variant="checklist"><span slot="title">merge !44 → main</span><sett-pill slot="state" kind="ok">ready</sett-pill>
  ${mergeRows(6, 0, true)}${how}
  <sett-gated-button slot="acts">approve · merge</sett-gated-button>
  <span slot="note">enabled only when every line above is ✓ · arch never merges on its own</span></sett-card>`) };
export const MergeNoPlan: Story = { name: 'merge · plan · none · hand-made branch (ADR 0022)', render: () => wide(html`<sett-card variant="checklist"><span slot="title">merge !51 → main</span><sett-pill slot="state" kind="ok">ready</sett-pill>
  <sett-card-row mark="·" kind="mute">plan · none · hand-made branch</sett-card-row>
  <sett-card-row mark="✓" kind="ok" nav="open">findings 0 new</sett-card-row>
  <sett-card-row mark="✓" kind="ok" nav="checks">pipeline #9140 passed</sett-card-row>
  <sett-card-row mark="✓" kind="ok" nav="you">remarks asking for a change · 0 open</sett-card-row>
  <sett-card-row mark="✓" kind="ok" nav="you">files viewed · 2 / 2</sett-card-row>
  <sett-card-row mark="✓" kind="ok">current with main<span slot="right">5 min</span></sett-card-row>
  <sett-card-row mark="✓" kind="ok">approved<span slot="right">you · just now</span></sett-card-row>${how}
  <sett-gated-button slot="acts">approve · merge</sett-gated-button>
  <span slot="note">a remark asking for a change would create the first element, and with it the session's plan</span></sett-card>`) };
export const Merged: Story = { name: 'result · merged (forge fact) · archived (arch fact), the row moves to Done', render: () => wide(html`<sett-card variant="result"><span slot="title">!44</span><sett-pill slot="state" kind="ok">merged</sett-pill><sett-pill slot="state">archived</sett-pill>
  <sett-card-row mark="✓" kind="ok" nav="github">squashed 5 commits into 1</sett-card-row>
  <sett-card-row mark="✓" kind="ok">feat/rate-limits deleted<span slot="right">remote + worktree</span></sett-card-row>
  <sett-card-row mark="✓" kind="ok" nav="open">session archived · thread kept</sett-card-row>
  <sett-card-row mark="✓" kind="ok" nav="open">plan · 7 elements kept with the archive</sett-card-row>
  <sett-card-row mark="✓" kind="ok">main · map recomputed<span slot="right">+3 items · +1 link</span></sett-card-row>
  <sett-card-row mark="⚠" kind="sug" nav="reconcile">2 sessions now behind main</sett-card-row>
  <sett-button slot="acts" variant="primary">‹ sessions</sett-button><sett-button slot="acts">restore</sett-button>
  <span slot="note">branch and worktree gone · plan and threads kept · restorable · the row moves to Done</span></sett-card>`) };
export const PlanDelta: Story = { name: 'plan delta · E7 from a remark: the remark as intention, the hunk\'s item as site', render: () => wide(html`<sett-card variant="delta"><span slot="title">plan · 6/7</span><sett-tag slot="state" kind="sug">E7 from remark</sett-tag>
  <sett-card-row mark="+" kind="sug" place="service.rs:23"><b>E7</b> · gate the charge on the limiter result · pay()</sett-card-row>
  <sett-card-row mark="·" kind="mute">intention: your remark, verbatim</sett-card-row>
  <sett-card-row mark="·" kind="mute">site: pay() · contract: Limited → 429</sett-card-row>
  <sett-card-row mark="·" kind="mute" nav="review">attached: the hunk, the remark thread</sett-card-row>
  <sett-button slot="acts" variant="primary">delegate</sett-button><sett-button slot="acts">do it myself</sett-button>
  <span slot="note">realized in the session or by hand, never in the review tab · the hunk returns to unviewed when the commit lands</span></sett-card>`) };
export const WhatsNewDoors: Story = { name: "what's new · a glyph column, a door word on every line, mark as seen", render: () => wide(html`<sett-card variant="whatsnew"><span slot="title">what's new</span><sett-tag slot="state">40 s · main</sett-tag>
  <span slot="sub">from: your save (pg.rs) · a pull (ports.rs, order.rs · 2 commits by m.durand)</span>
  <sett-card-row mark="◆" kind="sel" nav="show">map · ship() → Notifier removed · save() returns RowId</sett-card-row>
  <sett-card-row mark="+1" kind="bad" nav="open">finding · api → store at pg.rs:41</sett-card-row>
  <sett-card-row mark="1" kind="sug" nav="place">unplaced · AuditLog in clients/audit.rs</sett-card-row>
  <sett-card-row mark="●" kind="session" session="yk" nav="follow">refund flow · told at next step · stale-write guard on pg.rs</sett-card-row>
  <sett-card-row mark="✓" kind="ok">tests 41 green</sett-card-row>
  <sett-button slot="acts" variant="primary">mark as seen</sett-button>
  <span slot="note">each line is a door; the same lines are the What's new tab in the panel</span></sett-card>`) };
const fixCard = html`<sett-card variant="fix"><span slot="title">finding · api must not depend on store</span><sett-pill slot="state" kind="bad">new</sett-pill>
  <sett-kv-row label="site" mono>store/pg.rs:41 · you · 2 min</sett-kv-row>
  <sett-kv-row label="rule">api → store · 1 site on this branch · blocks</sett-kv-row>
  <sett-kv-row label="fix">route the write through OrderRepo::save (the port already exists)</sett-kv-row>
  <sett-hunk proposed verified="check green" file="pg.rs:41">
    <sett-hunk-line kind="del">  self.store.pg.save_notified(&order).await?;</sett-hunk-line>
    <sett-hunk-line kind="add">  self.repo.save(&order).await?;</sett-hunk-line>
  </sett-hunk>
  <sett-button slot="acts" variant="primary">let an agent apply it</sett-button><sett-button slot="acts">apply myself</sett-button><sett-button slot="acts" variant="quiet">allow this site…</sett-button>
  <span slot="note">agent door first, manual always there · allow is person-only, one entry in .arch/allows</span></sett-card>`;
export const FixCard: Story = { name: 'fix card · site, rule, fix, the proposed hunk, both doors and allow', render: () => wide(fixCard) };
export const FixCardInInspector: Story = { name: 'fix card · in the inspector', render: () => html`<div style="width:${W};height:calc(var(--sett-space-6) * 18);display:flex;border:var(--sett-stroke-hair) solid var(--sett-color-line);border-radius:var(--sett-radius-card);overflow:hidden">
  <sett-inspector heading="finding" sub="api must not depend on store · blocks" state="new" tone="bad" style="flex:1"><div style="padding:var(--sett-space-2) var(--sett-space-3)">${fixCard}</div></sett-inspector></div>` };
