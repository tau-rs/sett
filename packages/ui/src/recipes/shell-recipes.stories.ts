import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, unsafeStatic } from 'lit/static-html.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../index.js';
import editorCss from '../editor/editor.css?raw';
import type { Scope } from '../scope.js';
import { openUnit, zero2prod, type Who } from '../map/map-fixtures.stories-helpers.js';

// The shell recipes (issue #67): one state of each arch flow page, rebuilt only from sett components.
// One grid for all four: bar · body (rail · left pane · centre · inspector) · bottom panel · status bar,
// the whole screen inside the one frame that says the state of the scope (DESIGN.md "The shell" rule 5).
// Layout styles here are the recipe's own, tokens and calc only. The Map is sett's own fixture (zero2prod · api).

/** the scope of each recipe, declared once: the scope line, the selector and the status bar all read it */
export const SCOPES = {
  planShaping: { kind: 'plan', name: 'refund flow' },
} satisfies Record<string, Scope>;

/** a scope and the session colour it takes, when a session is the scope */
interface Of { scope: Scope; session?: string }

const css = html`<style>${unsafeStatic(editorCss)}
.rx { box-sizing: border-box; width: calc(var(--sett-space-5) * 59); }
.sh { height: calc(var(--sett-space-5) * 34); display: grid; grid-template-rows: var(--sett-size-shell-bar) minmax(0, 1fr) auto var(--sett-size-shell-status); background: var(--sett-color-bg); font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); color: var(--sett-color-ink); }
.sh .bar { display: flex; align-items: center; gap: var(--sett-space-3); min-width: 0; padding: 0 var(--sett-space-3); background: var(--sett-color-paper); border-bottom: var(--sett-stroke-hair) solid var(--sett-color-line2); white-space: nowrap; }
.sh .brand { font-size: var(--sett-font-size-xl); font-weight: var(--sett-font-weight-semibold); }
.sh .repo { color: var(--sett-color-ink2); }
.sh .chips { margin-left: auto; display: flex; align-items: center; gap: var(--sett-space-2); min-width: 0; }
.sh .ask { color: var(--sett-color-mute); text-decoration: none; }
.sh .planchip { display: inline-flex; align-items: center; gap: var(--sett-space-2); padding: var(--sett-space-1) var(--sett-space-2); border: var(--sett-stroke-hair) solid var(--sett-color-line); border-radius: var(--sett-radius-chip); background: var(--sett-color-paper); color: var(--sett-color-ink2); }
.sh .planchip a { color: var(--sett-color-sel); font-weight: var(--sett-font-weight-semibold); cursor: pointer; }
.sh .body { display: grid; grid-template-columns: var(--sett-size-shell-rail) var(--sett-size-shell-pane-max) minmax(0, 1fr) var(--sett-size-shell-inspector); min-height: 0; }
.sh .body > * { min-width: 0; min-height: 0; }
.sh .left { display: flex; flex-direction: column; overflow: hidden; background: var(--sett-color-paper); border-right: var(--sett-stroke-hair) solid var(--sett-color-line2); }
.sh .left > sett-sessions-view, .sh .left > sett-files-view { flex: 1; min-height: 0; }
.sh .centre { display: flex; flex-direction: column; }
.sh .map { flex: 1; min-height: 0; overflow: auto; padding: var(--sett-space-3); }
.sh .file { flex: 1; min-height: 0; overflow: auto; background: var(--sett-color-paper); font-family: var(--sett-font-mono); font-size: var(--sett-font-size-md); line-height: var(--sett-font-line-height-code); padding: var(--sett-space-1) 0; }
.sh .ln { display: flex; align-items: baseline; white-space: pre; padding: 0 var(--sett-space-2) 0 var(--sett-space-1); }
.sh .ln .n { width: var(--sett-space-6); text-align: right; color: var(--sett-color-mute); margin: 0 var(--sett-space-2); flex: none; }
.sh .ln .t { flex: 1; min-width: 0; }
.sh .insp { display: flex; border-left: var(--sett-stroke-hair) solid var(--sett-color-line2); }
.sh .insp > sett-inspector { flex: 1; min-width: 0; }
.sh .in { margin: var(--sett-space-2) var(--sett-space-3); }
.sh p.in { color: var(--sett-color-ink2); font-size: var(--sett-font-size-lg); }
</style>`;

// the three glyphs of the rail stories, drawn with currentColor
const G = {
  sessions: html`<svg slot="glyph" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="5" rx="1.5"/><rect x="4" y="14" width="10" height="5" rx="1.5"/><circle cx="18" cy="16.5" r="2"/></svg>`,
  files: html`<svg slot="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6l2 2h8v12H4z"/></svg>`,
  findings: html`<svg slot="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg>`,
};

// the scope is never typed: each of the three places takes the same attributes and writes the words itself (scope.ts)
const selector = (o: Of, state = 'main', count?: number) => html`<sett-selector still scope=${o.scope.kind} session=${ifDefined(o.session)} scope-id=${ifDefined(o.scope.id)} name=${ifDefined(o.scope.name)} ?locked=${o.scope.locked} state=${state} count=${ifDefined(count)}></sett-selector>`;
const scopeLine = (o: Of, sub: string, slot?: string) => html`<sett-scope-line slot=${ifDefined(slot)} scope=${o.scope.kind} session=${ifDefined(o.session)} scope-id=${ifDefined(o.scope.id)} name=${ifDefined(o.scope.name)} ?locked=${o.scope.locked} sub=${sub}></sett-scope-line>`;
const scopeItem = (o: Of, state: unknown) => html`<sett-status-item scope=${o.scope.kind} session=${ifDefined(o.session)} scope-id=${ifDefined(o.scope.id)} name=${ifDefined(o.scope.name)} ?locked=${o.scope.locked}>${state}</sett-status-item>`;

const bar = (sel: unknown, chips: unknown) => html`<div class="bar"><span class="brand">arch</span><span class="repo">orderly ›</span>${sel}<span class="chips">${chips}<a class="ask" href="#ask">Ask ⌘K</a></span></div>`;
const rail = (o: Of, on: 'sessions' | 'files' | 'findings', asks = 0) => html`<sett-activity-rail aria-label="views" scope=${o.scope.kind} session=${ifDefined(o.session)}>
  <sett-rail-item value="sessions" ?active=${on === 'sessions'} badge=${ifDefined(asks || undefined)} badge-label=${ifDefined(asks ? `${asks} asks you` : undefined)}>${G.sessions}Sessions</sett-rail-item>
  <sett-rail-item value="files" ?active=${on === 'files'}>${G.files}Files</sett-rail-item>
  <sett-rail-item value="findings" ?active=${on === 'findings'} tone="bad">${G.findings}Findings</sett-rail-item>
</sett-activity-rail>`;
const toggles = (...on: string[]) => html`<sett-overlay-toggles slot="right">${['sessions', 'plan', 'findings', 'delta'].map((v) => html`<sett-toggle value=${v} ?on=${on.includes(v)}>${v}</sett-toggle>`)}</sett-overlay-toggles>`;
// the Map: a real open unit from the fixtures, in a box that scrolls; `who` is the overlay
const map = (who: Who = {}) => html`<div class="map" tabindex="0" role="group" aria-label="map">${openUnit(zero2prod, 'api', who, { foldedAreas: ['admin', 'idem', 'email', 'startup'] })}</div>`;
// the bottom panel closed: a strip of its tabs with their counts
const panelTabs = (o: { findings?: string; checks?: string; checksTone?: string; news?: string } = {}) => html`
  <sett-panel-tab slot="tabs" value="findings" count=${ifDefined(o.findings)} tone="bad">Findings</sett-panel-tab>
  <sett-panel-tab slot="tabs" value="checks" count=${ifDefined(o.checks)} tone=${ifDefined(o.checksTone)}>Checks</sett-panel-tab>
  <sett-panel-tab slot="tabs" value="terminal">Terminal</sett-panel-tab>
  <sett-panel-tab slot="tabs" value="whatsnew" count=${ifDefined(o.news)}>What's new</sett-panel-tab>`;
const mapItem = html`<sett-status-item slot="right"><span data-tone="ok">Map up to date · 2 s</span></sett-status-item>`;

interface Screen { of: Of; frame: string; bar: unknown; rail: unknown; left: unknown; centre: unknown; inspector: unknown; panel: unknown; status: unknown }
const shell = (s: Screen) => html`${css}<sett-frame class="rx" state=${s.frame} session=${ifDefined(s.of.session)} still><div class="sh">
  ${s.bar}
  <div class="body">${s.rail}<div class="left">${s.left}</div><div class="centre">${s.centre}</div><div class="insp">${s.inspector}</div></div>
  ${s.panel}
  ${s.status}
</div></sett-frame>`;

const meta: Meta = { title: 'recipes/shell', excludeStories: ['SCOPES'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

// ── plan · shaping (plan flow, step 3) ──
const plan: Of = { scope: SCOPES.planShaping };
// a planned element has no row of its own in the Sessions view: the sub-agent row, its dot turned to sug (planned)
const PLANNED = '--_session-sub:var(--sett-color-sug)';
const INTENT = 'Refunds: add refund() to the OrderRepo port and the Postgres impl, expose it on pay()/close()';
export const PlanShaping: Story = { name: 'plan · shaping', render: () => shell({
  of: plan, frame: 'planning',
  bar: bar(selector(plan), html`<span class="planchip"><sett-tag kind="sug">plan</sett-tag><span>refund flow · 5 elements</span><a>open</a></span>`),
  rail: rail(plan, 'sessions'),
  left: html`${scopeLine(plan, 'from main')}<sett-sessions-view isolated count="5">
    <sett-session-row scope="plan" name="refund flow" state="shaping" tone="sug" open selected scoped>
      <sett-group-row name="group 1" state="2 elements" depth="1" open>
        <sett-agent-row style=${PLANNED} name="E1 · OrderRepo: add refund()" depth="2"></sett-agent-row>
        <sett-agent-row style=${PLANNED} name="E2 · PgOrderRepo: implement refund()" depth="2"></sett-agent-row>
      </sett-group-row>
      <sett-group-row kind="gate" name="gate · group 1 → group 2" state="tests green" depth="1"></sett-group-row>
      <sett-group-row name="group 2" state="3 elements" depth="1" open>
        <sett-agent-row style=${PLANNED} name="E3 · pay() calls refund()" depth="2"></sett-agent-row>
        <sett-agent-row style=${PLANNED} name="E4 · close() calls refund()" depth="2"></sett-agent-row>
        <sett-agent-row style=${PLANNED} name="E5 · handle_webhook(): fail fast" depth="2" selected></sett-agent-row>
      </sett-group-row>
      <sett-changes-row depth="1" meta="no branch yet · created at accept"></sett-changes-row>
    </sett-session-row>
  </sett-sessions-view>`,
  centre: html`<sett-tabbar><sett-tab pinned active>map</sett-tab>${toggles('plan', 'sessions')}</sett-tabbar>
    <sett-intent-bar value=${INTENT} counts="5 elements · 2 groups"></sett-intent-bar>${map()}`,
  inspector: html`<sett-inspector heading="planner" sub="refund flow · shaping" state="draft" kind="planner">
    <sett-msg from="me" author="you" time="12:02">Could E5 go in group 1?</sett-msg>
    <sett-msg from="agent" author="planner" time="12:02" style="--_session:var(--sett-color-sug)">It calls refund(), which E1 defines, so it stays after the gate. I split pay() and close() into their own elements instead: one commit each.<sett-changed>changed · 2 elements</sett-changed></sett-msg>
    <sett-question class="in" author="planner">handle_webhook(): when refund() fails?
      <sett-option slot="option" value="fail" effect="E5 contract · 502">fail the request</sett-option>
      <sett-option slot="option" value="retry" effect="+1 element in group 2">retry, then fail</sett-option>
      <sett-option slot="option" value="queue" effect="+1 item in clients · +1 link">queue it for later</sett-option>
    </sett-question>
    <sett-split-button slot="verbs" variant="primary">accept · delegate<sett-menu slot="menu" label="driver"><sett-menu-item state="main" selected>claude code</sett-menu-item><sett-menu-item state="main">codex</sett-menu-item></sett-menu></sett-split-button>
    <sett-button slot="verbs">save plan</sett-button><sett-button slot="verbs" variant="quiet">discard</sett-button>
    <sett-composer slot="composer" placeholder="answer, or say how to shape it…"></sett-composer>
  </sett-inspector>`,
  panel: html`<sett-bottom-panel active="findings" closed>${panelTabs({ checks: '1', news: '2' })}</sett-bottom-panel>`,
  status: html`<sett-status-bar>${scopeItem(plan, '5 elements')}
    <sett-status-item label="Sessions"><b>2</b> running</sett-status-item>
    <sett-status-item label="Findings"><b>0</b> on the planned shape</sett-status-item>
    <sett-status-item label="Checks"><span data-tone="ok">all passed</span></sett-status-item>${mapItem}</sett-status-bar>`,
}) };
