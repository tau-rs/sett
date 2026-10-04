import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-findings-view.js';
import './sett-scope-line.js';
import '../button/sett-button.js';

// the view fills the left pane: paper, at the pane's narrow width
const pane = (body: unknown) => html`<div style="box-sizing:border-box;width:var(--sett-size-shell-pane-min);height:var(--sett-size-shell-pane-max);display:flex;flex-direction:column;background:var(--sett-color-paper);border:var(--sett-stroke-hair) solid var(--sett-color-line2)">${body}</div>`;

const main = html`<sett-scope-line slot="scope" sub="new on main"></sett-scope-line>`;
const w1 = html`<sett-scope-line slot="scope" scope="session" session="yk" scope-id="w1" name="refund flow" sub="introduced"></sett-scope-line>`;

// the story plays the app: it orders the rules, writes the counts, folds and selects
const onFold = (e: CustomEvent<{ open: boolean }>) => { (e.target as HTMLElement & { open: boolean }).open = e.detail.open; };
const onSelect = (e: CustomEvent) => {
  const view = e.currentTarget as HTMLElement;
  for (const r of Array.from(view.querySelectorAll('[selected]'))) (r as HTMLElement & { selected: boolean }).selected = false;
  (e.target as HTMLElement & { selected: boolean }).selected = true;
};
const view = (count: string, blocks: string, scope: unknown, rows: unknown) => pane(html`<sett-findings-view count=${count} blocks=${blocks} @sett-fold=${onFold} @sett-select=${onSelect}>${scope}${rows}</sett-findings-view>`);

// main: two rules that warn, nothing blocks
const warns = html`
  <sett-rule-row name="cycle" level="warns" count="1" open>
    <sett-finding-row name="store ↔ api" at="store/pg.rs:12" depth="1"></sett-finding-row>
  </sett-rule-row>
  <sett-rule-row name="owners" level="warns" count="1" open>
    <sett-finding-row name="team-payments not among reviewers" at="api/webhook.rs" depth="1"></sett-finding-row>
  </sett-rule-row>`;

// the sketch of arch-design#40: the blocking rule first, then the one that warns
const blocking = (sel = false) => html`
  <sett-rule-row name="leaky-port" level="blocks" count="1" open>
    <sett-finding-row name="Order → PaymentsHttp" at="domain/order.rs:41" depth="1" ?selected=${sel}></sett-finding-row>
  </sett-rule-row>
  <sett-rule-row name="cycle" level="warns" count="1" open>
    <sett-finding-row name="store ↔ api" at="store/pg.rs:12" depth="1"></sett-finding-row>
  </sett-rule-row>`;

// w1 brought two findings of one rule and one of another; the warning rule is folded
const scoped = html`
  <sett-rule-row name="leaky-port" level="blocks" count="2" open>
    <sett-finding-row name="refund() → PaymentsHttp" at="api/service.rs:61" depth="1" selected></sett-finding-row>
    <sett-finding-row name="PgOrderRepo → Order::status" at="store/pg.rs:88" depth="1"></sett-finding-row>
  </sett-rule-row>
  <sett-rule-row name="naming" level="warns" count="1">
    <sett-finding-row name="refund_v2()" at="api/service.rs:74" depth="1"></sett-finding-row>
  </sett-rule-row>`;

// rule 11: a view with nothing in it opens to an empty state that names the two doors, agent door first
const nothingFound = html`<div style="display:flex;flex-direction:column;align-items:center;gap:var(--sett-space-2);padding:var(--sett-space-6) var(--sett-space-3);color:var(--sett-color-ink2)">
  no findings<sett-button variant="primary" size="sm">ask Yokohama to check</sett-button><sett-button size="sm">run arch check</sett-button>
</div>`;

const meta: Meta = {
  title: 'shell/findings view',
  component: 'sett-findings-view',
  render: () => view('2', '0', main, warns),
};
export default meta;
type Story = StoryObj;

export const Default: Story = { name: 'default · on main, rules that warn; a row selects, a chevron folds' };
export const Blocking: Story = { name: 'blocking · the blocking rule first, its count on the count line', render: () => view('2', '1', main, blocking()) };
export const Empty: Story = { name: 'empty · the state names the two doors', render: () => pane(html`<sett-findings-view>${main}${nothingFound}</sett-findings-view>`) };
export const Scoped: Story = { name: "scoped · a session is the scope: what it introduced, under its tint", render: () => view('3', '2', w1, scoped) };
export const SelectedRow: Story = { name: 'selected row · the app moved the Map to it and shows the fix card', render: () => view('2', '1', main, blocking(true)) };
