import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';
import './sett-bottom-panel.js';
import '../button/sett-button.js';

type Tab = 'findings' | 'checks' | 'terminal' | 'whatsnew';
interface PanelOpts { active?: Tab; closed?: boolean; empty?: boolean }

const OPEN = 'calc(var(--sett-space-5) * 11)';

const findings = html`<sett-panel-table slot="findings" kind="findings">
  <sett-panel-row level="bad" selected><span>Order → PaymentsHttp</span><span>domain must not depend on clients · blocks</span><span data-mono>order.rs:41</span><span data-mono>core</span></sett-panel-row>
  <sett-panel-row level="sug"><span>team-payments not among reviewers · webhook.rs</span><span>owners notified · warns</span><span data-mono>MR !42</span><span data-mono>core</span></sett-panel-row>
</sett-panel-table>`;

// rule 11: a view with nothing in it opens to an empty state that names the two doors, agent door first
const noFindings = html`<div slot="findings" class="sett-row" style="justify-content:center;padding:var(--sett-space-6) var(--sett-space-3);color:var(--sett-color-ink2)">
  no findings<span class="sett-sep">·</span><sett-button variant="primary" size="sm">ask Yokohama to check</sett-button><sett-button size="sm">run arch check</sett-button>
</div>`;

const checks = html`<sett-panel-table slot="checks" kind="checks">
  <sett-panel-row level="ok"><span>cargo nextest run · gate group 1 → group 2</span><span>refund flow · w1 · round 1 of 2</span><span data-mono data-tone="ok">41 passed</span><span data-mono>12:44</span></sett-panel-row>
  <sett-panel-row level="sug"><span>judge · refund() honours the port contract</span><span>refund flow · w1</span><span data-mono data-tone="sug">running</span><span data-mono>12:45</span></sett-panel-row>
  <sett-panel-row level="ok"><span>arch check</span><span>main · 5 rules</span><span data-mono data-tone="ok">ok</span><span data-mono>12:40</span></sett-panel-row>
  <sett-panel-row level="ok"><span>pipeline · build · test · arch check</span><span>MR !42 · forge</span><span data-mono data-tone="ok">green</span><span data-mono>12:31</span></sett-panel-row>
</sett-panel-table>
<sett-panel-output slot="checks">${`$ cargo nextest run
    Starting 41 tests across 3 binaries
        PASS [ 0.012s] orderly::lifecycle refunded_order_is_closed
        PASS [ 0.009s] orderly::lifecycle refund_twice_is_idempotent
     Summary [ 1.204s] 41 tests run: 41 passed, 0 skipped`}</sett-panel-output>`;

const terminal = html`<sett-panel-output slot="terminal">${`orderly (w1 · refund flow) $ cargo build
   Compiling orderly v0.4.1 (/Users/t/code/orderly-w1)
    Finished dev [unoptimized + debuginfo] target(s) in 3.21s
orderly (w1 · refund flow) $`}</sett-panel-output>`;

const whatsnew = html`
  <sett-panel-line slot="whatsnew" when="3 min"><b>main</b> moved: 2 commits by m.durand · pg pool sizing merged</sett-panel-line>
  <sett-panel-line slot="whatsnew" when="3 min"><b>refund flow</b> is 2 behind main · reconcile touches store/pg.rs (a2 is in it)</sett-panel-line>`;

const panel = (o: PanelOpts = {}) => {
  // the story plays the consumer: the panel reports, the consumer changes what is open
  const onSelect = (e: CustomEvent<{ value: string }>) => { const p = e.currentTarget as HTMLElement & { active: string; closed: boolean }; p.active = e.detail.value; p.closed = false; p.style.height = OPEN; };
  const onToggle = (e: CustomEvent<{ closed: boolean }>) => { const p = e.currentTarget as HTMLElement & { closed: boolean }; p.closed = e.detail.closed; p.style.height = e.detail.closed ? '' : OPEN; };
  const active = o.active ?? 'findings';
  return html`<sett-bottom-panel active=${active} ?closed=${o.closed} style=${o.closed ? '' : `height:${OPEN}`} @sett-select=${onSelect} @sett-toggle=${onToggle}>
    <sett-panel-tab slot="tabs" value="findings" count=${o.empty ? nothing : '1'} tone="bad">Findings</sett-panel-tab>
    <sett-panel-tab slot="tabs" value="checks" count="1" tone="sug">Checks</sett-panel-tab>
    <sett-panel-tab slot="tabs" value="terminal">Terminal</sett-panel-tab>
    <sett-panel-tab slot="tabs" value="whatsnew" count="2">What's new</sett-panel-tab>
    ${active === 'terminal' && !o.closed ? html`<span slot="act">w1 · refund flow</span>` : nothing}
    ${o.empty ? noFindings : findings}${checks}${terminal}${whatsnew}
  </sett-bottom-panel>`;
};

const meta: Meta = {
  title: 'shell/bottom panel',
  component: 'sett-bottom-panel',
  args: { active: 'findings', closed: false },
  argTypes: { active: { control: 'inline-radio', options: ['findings', 'checks', 'terminal', 'whatsnew'] } },
  render: (args) => panel(args as PanelOpts),
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const Closed: Story = { name: 'closed · a strip of the tabs with their counts', render: () => panel({ closed: true }) };
export const Findings: Story = { name: 'findings · a blocking row selected, a warning row; every row names its origin', render: () => panel({ active: 'findings' }) };
export const Checks: Story = { name: 'checks · passed, running, ok, pipeline green; the output below', render: () => panel({ active: 'checks' }) };
export const Terminal: Story = { name: 'terminal · the worktree name at the right of the strip', render: () => panel({ active: 'terminal' }) };
export const WhatsNew: Story = { name: "what's new · each line a link, its time at the right", render: () => panel({ active: 'whatsnew' }) };
export const EmptyFindings: Story = { name: 'findings · empty: the state names the two doors', render: () => panel({ active: 'findings', empty: true }) };
