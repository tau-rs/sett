import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, unsafeStatic } from 'lit/static-html.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { ref } from 'lit/directives/ref.js';
import '../index.js';
import editorCss from '../editor/editor.css?raw';
import type { Scope } from '../scope.js';
import { openUnit, zero2prod, type Lines, type Who } from '../map/map-fixtures.stories-helpers.js';

// The shell recipes (issue #67): one state of each arch flow page, rebuilt only from sett components.
// One grid for all four: bar · body (rail · left pane · centre · inspector) · bottom panel · status bar,
// the whole screen inside the one frame that says the state of the scope (DESIGN.md "The shell" rule 5).
// Layout styles here are the recipe's own, tokens and calc only. The Map is sett's own fixture (zero2prod · api).

/** the scope of each recipe, declared once: the scope line, the selector and the status bar all read it */
export const SCOPES = {
  planShaping: { kind: 'plan', name: 'refund flow' },
  sessionGateFailed: { kind: 'session', id: 'w1', name: 'refund flow' },
  reviewGlance: { kind: 'session', id: 'w3', name: 'rate limits' },
  dailyEditByHand: { kind: 'you', name: 'fix-pool-size', locked: true },
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
.sh .in { flex: none; margin: var(--sett-space-2) var(--sett-space-3); }
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
// the camera: the open unit is wider than the centre, so the box is panned once to the unit's first column (no motion)
const pan = (box?: Element) => {
  if (!box) return;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const col = box.querySelector('sett-column');
    if (col) box.scrollLeft += col.getBoundingClientRect().left - box.getBoundingClientRect().left;
  }));
};
// the plan overlay: five planned elements in their two groups
const PLAN_OVERLAY: Who = { subscribe: { planned: true, group: 'g1' }, newsub: { planned: true, group: 'g1' }, subemail: { planned: true, group: 'g2' }, confirm: { planned: true, group: 'g2' }, subname: { planned: true, group: 'g2' } };
// and the three links the plan adds between them
const PLANNED_LINKS = ['subscribe>newsub', 'newsub>subemail', 'newsub>subname'];
const planLines: Lines = (l) => (PLANNED_LINKS.includes(`${l.from}>${l.to}`) ? { planned: true } : undefined);
// the delta overlay: every item of the unit stands somewhere against main; the session's ring stays on what it touched
const delta = (touched: Record<string, 'added' | 'changed' | 'removed'>, session: string): Who =>
  Object.fromEntries(zero2prod.units.api.areas.flatMap((a) => a.items).map((it) => [it.id, touched[it.id] ? { delta: touched[it.id], session } : { delta: 'unchanged' as const }]));
// the delta on the lines: a link is added or removed, every other one recedes
const deltaLines = (touched: Record<string, 'added' | 'removed'>): Lines => (l) => ({ delta: touched[`${l.from}>${l.to}`] ?? 'unchanged' });
const map = (who: Who = {}, lines?: Lines) => html`<div class="map" tabindex="0" role="group" aria-label="map" ${ref(pan)}>${openUnit(zero2prod, 'api', who, { foldedAreas: ['admin', 'idem', 'email', 'startup'], lines })}</div>`;
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
    <sett-intent-bar value=${INTENT} counts="5 elements · 2 groups"></sett-intent-bar>${map(PLAN_OVERLAY, planLines)}`,
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

// ── session · gate failed (session flow, step 4b) ──
const w1: Of = { scope: SCOPES.sessionGateFailed, session: 'yk' };
const GATE = 'group 1 → group 2';
const JUDGE = `judge · round 2 of 2 · gate ${GATE}
  ✗ PgOrderRepo::refund() swallows the pool error at store/pg.rs:58
    the port contract says it propagates (domain/ports.rs:21)
  round 1: same reason at store/pg.rs:44, fixed
  budget 2/2 spent: the session stops and asks`;
export const SessionGateFailed: Story = { name: 'session · gate failed', render: () => shell({
  of: w1, frame: 'waiting',
  bar: bar(selector(w1, 'asks', 1), html`
    <sett-chip kind="gate" state="blocking" session="yk">${GATE}<span slot="count">· failed 2/2</span><a slot="verb">open</a></sett-chip>
    <sett-chip kind="agent" state="waiting" session="yk">refund flow asks<span slot="count">· 1</span><a slot="verb">answer</a></sett-chip>`),
  rail: rail(w1, 'sessions', 1),
  left: html`${scopeLine(w1, '4 changed')}<sett-sessions-view isolated count="5">
    <sett-session-row scope="session" session="yk" name="refund flow" state="gate failed · asks" tone="sug" open selected scoped>
      <sett-group-row name="group 1" state="done" depth="1" open>
        <sett-agent-row session="yk" name="a1 · OrderRepo: add refund()" state="done" depth="2"></sett-agent-row>
        <sett-agent-row session="yk" name="a2 · PgOrderRepo: implement refund()" state="done" depth="2" open>
          <sett-file-row letter="M" name="store/pg.rs" counts="+18 −2" depth="3"></sett-file-row>
          <sett-file-row letter="A" name="tests/lifecycle.rs" counts="+31" depth="3"></sett-file-row>
        </sett-agent-row>
      </sett-group-row>
      <sett-group-row kind="gate" name=${`gate · ${GATE}`} state="failed 2/2" depth="1" selected></sett-group-row>
      <sett-group-row name="group 2" state="waiting" depth="1"></sett-group-row>
      <sett-changes-row depth="1" meta="2 ahead · no MR yet"></sett-changes-row>
    </sett-session-row>
  </sett-sessions-view>`,
  centre: html`<sett-tabbar><sett-tab pinned active>map</sett-tab>${toggles('sessions', 'plan')}</sett-tabbar>
    ${map({ subscribe: { session: 'yk' }, newsub: { session: 'yk' }, subemail: { session: 'yk' } })}`,
  inspector: html`<sett-inspector heading="refund flow" sub="claude code · w1 · 31 min" state="asks" tone="sug" kind="session" session="yk">
    <sett-session-card class="in" name="refund flow" driver="claude code" session="yk" step="2" of="4" still>
      <sett-plan-row kind="group" gate="failed 2/2">group 1
        <sett-plan-row slot="element" state="done">OrderRepo: refund()</sett-plan-row>
        <sett-plan-row slot="element" state="asks" count="1" current>PgOrderRepo: refund()</sett-plan-row>
      </sett-plan-row>
      <sett-plan-row kind="group" gate="waiting">group 2</sett-plan-row>
      <span slot="foot">2 changed · +49 −2 · 2 ahead</span><a slot="thread">thread ›</a>
    </sett-session-card>
    <sett-question class="in" author="refund flow">gate · ${GATE} failed twice: judge says refund() does not honour the port contract
      <input slot="input" placeholder="a hint for one more round · what the judge keeps missing…" aria-label="hint">
      <sett-option slot="option" value="round" effect="round 3 of 2">one more round with a hint</sett-option>
      <sett-option slot="option" value="take-over" effect="pause a2 · you hold E2">take over</sett-option>
      <sett-option slot="option" value="accept" effect="recorded override">accept as is</sett-option>
      <sett-option slot="option" value="re-plan" effect="opens the planner" quiet>re-plan</sett-option>
    </sett-question>
    <sett-button slot="verbs">pause</sett-button><sett-button slot="verbs" variant="quiet">stop</sett-button>
    <sett-composer slot="composer" placeholder="reply to refund flow…"></sett-composer>
  </sett-inspector>`,
  panel: html`<sett-bottom-panel active="checks" style="height:calc(var(--sett-space-5) * 8)">${panelTabs({ checks: '1', checksTone: 'bad', news: '2' })}
    <sett-panel-table slot="checks" kind="checks">
      <sett-panel-row level="bad" selected><span>judge · refund() honours the port contract</span><span>refund flow · w1 · round 2 of 2</span><span data-mono data-tone="bad">failed 2/2</span><span data-mono>12:58</span></sett-panel-row>
      <sett-panel-row level="ok"><span>cargo nextest run · gate ${GATE}</span><span>refund flow · w1 · round 2 of 2</span><span data-mono data-tone="ok">41 passed</span><span data-mono>12:57</span></sett-panel-row>
    </sett-panel-table>
    <sett-panel-output slot="checks">${JUDGE}</sett-panel-output>
  </sett-bottom-panel>`,
  status: html`<sett-status-bar>${scopeItem(w1, html`<span data-tone="sug">asks you</span>`)}
    <sett-status-item label="Sessions"><b>2</b> running · <span data-tone="sug">1 asks</span></sett-status-item>
    <sett-status-item label="Findings"><b>0</b> new</sett-status-item>
    <sett-status-item label="Checks"><span data-tone="bad">1 failed</span></sett-status-item>${mapItem}</sett-status-bar>`,
}) };

// ── review · glance (review flow, step 1) ──
const w3: Of = { scope: SCOPES.reviewGlance, session: 'mg' };
export const ReviewGlance: Story = { name: 'review · glance', render: () => shell({
  of: w3, frame: 'live',
  bar: bar(selector(w3), html`<sett-chip kind="review">!44<span slot="count">· 1 remark</span><a slot="verb">open</a></sett-chip>`),
  rail: rail(w3, 'sessions'),
  left: html`${scopeLine(w3, 'in review · !44')}<sett-sessions-view isolated count="5">
    <sett-session-row scope="session" session="mg" name="rate limits" state="review · 2/6 viewed" open selected scoped>
      <sett-file-row letter="M" name="domain/ports.rs" counts="+4" depth="1" viewed></sett-file-row>
      <sett-file-row letter="A" name="domain/limits.rs" counts="+22" depth="1" viewed></sett-file-row>
      <sett-file-row letter="M" name="api/service.rs" counts="+6 −1" depth="1"></sett-file-row>
      <sett-file-row letter="A" name="clients/limiter.rs" counts="+38" depth="1"></sett-file-row>
      <sett-file-row letter="M" name="tests/lifecycle.rs" counts="+9" depth="1"></sett-file-row>
      <sett-file-row letter="A" name="tests/limits.rs" counts="+41" depth="1"></sett-file-row>
      <sett-changes-row depth="1" meta="5 ahead · MR !44 · 1 remark"></sett-changes-row>
    </sett-session-row>
  </sett-sessions-view>`,
  centre: html`<sett-tabbar><sett-tab pinned active>map</sett-tab>${toggles('delta', 'plan')}</sett-tabbar>
    ${map(delta({ subname: 'added', subscribe: 'changed', confirm: 'changed' }, 'mg'), deltaLines({ 'newsub>subname': 'added', 'subscribe>storetok': 'removed' }))}`,
  inspector: html`<sett-inspector heading="!44 · at a glance" sub="rate limits → main" state="2 lines block" tone="sug" kind="session" session="mg">
    <sett-card class="in" variant="checklist"><span slot="title">merge !44 → main</span><sett-pill slot="state" kind="sug">2 lines block</sett-pill>
      <sett-card-row mark="✓" kind="ok" nav="rate limits">plan 6/6 realized · 2 gates passed</sett-card-row>
      <sett-card-row mark="✓" kind="ok" nav="open">findings 0 new · 1 allowed</sett-card-row>
      <sett-card-row mark="✓" kind="ok" nav="checks">pipeline #9129 passed · judge pass</sett-card-row>
      <sett-card-row mark="⚠" kind="sug" nav="jump">remarks asking for a change · 1 open</sett-card-row>
      <sett-card-row mark="⚠" kind="sug" nav="next unread">files viewed · 2 / 6</sett-card-row>
      <sett-card-row mark="✓" kind="ok">current with main<span slot="right">40 min</span></sett-card-row>
      <sett-card-row mark="·" kind="mute">approved<span slot="right">not yet</span></sett-card-row>
      <span slot="how">squash · from the forge's default · delete branch · archive session</span>
      <sett-gated-button slot="acts" blocked>approve · merge<sett-pill slot="reason" kind="sug">1 remark open</sett-pill><sett-pill slot="reason" kind="sug">4 files unviewed</sett-pill></sett-gated-button>
      <sett-button slot="acts">review in detail</sett-button>
      <span slot="note">what main gains: a RateLimit port in domain, TokenBucket in clients; pay() and close() now depend on RateLimit · each line is a fact with its source</span>
    </sett-card>
  </sett-inspector>`,
  panel: html`<sett-bottom-panel active="findings" closed>${panelTabs({ checks: '3', news: '1' })}</sett-bottom-panel>`,
  status: html`<sett-status-bar>${scopeItem(w3, 'in review · !44')}
    <sett-status-item label="Sessions"><b>2</b> running · <b>1</b> in review</sett-status-item>
    <sett-status-item label="Findings"><b>0</b> new</sett-status-item>
    <sett-status-item label="Checks"><span data-tone="ok">all passed</span></sett-status-item>${mapItem}</sett-status-bar>`,
}) };

// ── daily · edit by hand (daily flow, step 4, with the commit of step 7 open) ──
const you: Of = { scope: SCOPES.dailyEditByHand };
// the editor is Theia's; these are sett's decoration classes (editor.css) on a few lines: your change bars are sel
const K = (t: string) => html`<span class="sett-syn-keyword">${t}</span>`;
const T = (t: string) => html`<span class="sett-syn-type">${t}</span>`;
const D = (t: string) => html`<span class="sett-syn-definition">${t}</span>`;
const L = (n: number, t: unknown, o: { mine?: boolean; caret?: boolean } = {}) => html`<div class="ln sett-gutter-bar ${o.mine ? 'sett-gutter-bar--you' : ''} ${o.caret ? 'sett-ed-line' : ''}"><span class="sett-gutter-glyph"></span><span class="n">${n}</span><span class="t">${t}</span></div>`;
const poolRs = html`<div class="file" tabindex="0" role="group" aria-label="store/pool.rs">
  ${L(1, html`<span class="sett-syn-comment">//! the pg pool, sized from config</span>`)}
  ${L(2, html`${K('use')} sqlx::postgres::{${T('PgPool')}, ${T('PgPoolOptions')}};`)}
  ${L(3, html`${K('use')} crate::config::${T('PgConfig')};`)}
  ${L(4, '')}
  ${L(5, html`${K('pub const')} ${D('DEFAULT_POOL_SIZE')}: ${T('u32')} = <span class="sett-syn-constant">8</span>;`, { mine: true })}
  ${L(6, '')}
  ${L(7, html`${K('pub struct')} ${D('Pool')} {`)}
  ${L(8, html`    inner: ${T('PgPool')},`)}
  ${L(9, '}')}
  ${L(10, '')}
  ${L(11, html`${K('impl')} ${T('Pool')} {`)}
  ${L(12, html`    ${K('pub async fn')} ${D('connect')}(cfg: &${T('PgConfig')}) -> ${T('Result')}&lt;${T('Pool')}&gt; {`)}
  ${L(13, html`        ${K('let')} size = cfg.pool_size.<span class="sett-syn-function">unwrap_or</span>(DEFAULT_POOL_SIZE);`, { mine: true })}
  ${L(14, html`        ${K('let')} inner = ${T('PgPoolOptions')}::<span class="sett-syn-function">new</span>().<span class="sett-syn-function">max_connections</span>(size)`, { mine: true, caret: true })}
  ${L(15, html`            .<span class="sett-syn-function">connect</span>(&cfg.url).${K('await')}?;`, { mine: true })}
  ${L(16, html`        ${T('Ok')}(${T('Pool')} { inner })`)}
  ${L(17, '    }')}
  ${L(18, '}')}
</div>`;
export const DailyEditByHand: Story = { name: 'daily · edit by hand', render: () => shell({
  of: you, frame: 'editing',
  bar: bar(selector(you, 'yours'), html`<sett-chip kind="detected">changes detected<span slot="count">· 2 files</span><a slot="agent">delegate the rest</a><a slot="manual">commit</a></sett-chip>`),
  rail: rail(you, 'files'),
  left: html`<sett-files-view projection="directory" scoped>
    ${scopeLine(you, 'detected', 'scope')}<span slot="tools">filter · ⌘⇧F</span>
    <sett-tree-row kind="folder" name="store" open>
      <sett-tree-row kind="file" name="pg.rs" depth="1" scope="you" letter="M" writer="you"></sett-tree-row>
      <sett-tree-row kind="file" name="pool.rs" depth="1" scope="you" letter="A" writer="you" selected></sett-tree-row>
    </sett-tree-row>
    <sett-tree-row kind="folder" name="api" dim></sett-tree-row>
    <sett-tree-row kind="folder" name="domain" dim></sett-tree-row>
    <sett-tree-row kind="folder" name="clients" dim></sett-tree-row>
    <sett-tree-row kind="folder" name="tests" dim></sett-tree-row>
    <sett-tree-row kind="folder" name=".arch" dim></sett-tree-row>
    <sett-tree-row kind="file" name="Cargo.toml" dim></sett-tree-row>
  </sett-files-view>`,
  centre: html`<sett-tabbar><sett-tab pinned>map</sett-tab><sett-tab mono active dirty scope="you">pool.rs <sett-pill kind="sel">you</sett-pill></sett-tab>${toggles('delta', 'sessions')}</sett-tabbar>${poolRs}`,
  inspector: html`<sett-inspector heading="commit · you · fix-pool-size" sub="main" state="2 files">
    <sett-commit-form value="store: size the pg pool from config" description="Reads pool size from PgConfig; defaults to 8. No behaviour change at defaults." files="store/pg.rs +12 · store/pool.rs +8" checks="ran on save · check 0 · tests 41 ✓" then="main" behind="main moved 2 commits" style="flex:1">
      <span slot="note">one click from the detected chip</span>
    </sett-commit-form>
  </sett-inspector>`,
  panel: html`<sett-bottom-panel active="findings" closed>${panelTabs({ checks: '2', news: '1' })}</sett-bottom-panel>`,
  status: html`<sett-status-bar>${scopeItem(you, '2 changed')}
    <sett-status-item label="Sessions"><b>2</b> running</sett-status-item>
    <sett-status-item label="Findings"><b>0</b> new</sett-status-item>
    <sett-status-item label="Checks"><span data-tone="ok">all passed</span></sett-status-item>
    <sett-status-item slot="right">Ln 14, Col 9 · rust</sett-status-item>${mapItem}</sett-status-bar>`,
}) };
