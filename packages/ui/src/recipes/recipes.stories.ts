import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, unsafeStatic } from 'lit/static-html.js';
import '../index.js';
import editorCss from '../editor/editor.css?raw';

// Composed screens rebuilt from the components. Layout styles here are the recipe's own, tokens only.
const shellCss = html`<style>${unsafeStatic(editorCss)}
.shell { width: 1180px; height: 640px; display: grid; grid-template-rows: auto auto 1fr auto; background: var(--sett-color-bg); border: var(--sett-stroke-hair) solid var(--sett-color-line2); border-radius: var(--sett-radius-card); overflow: hidden; font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); color: var(--sett-color-ink); }
.top { display: flex; align-items: center; gap: var(--sett-space-3); padding: var(--sett-space-2) var(--sett-space-3); background: var(--sett-color-paper); border-bottom: var(--sett-stroke-hair) solid var(--sett-color-line2); font-size: var(--sett-font-size-xl); }
.top .brand { font-weight: var(--sett-font-weight-semibold); } .top .lbl { color: var(--sett-color-mute); } .top .right { margin-left: auto; display: flex; gap: var(--sett-space-2); align-items: center; color: var(--sett-color-ink2); font-size: var(--sett-font-size-base); }
.strip { display: flex; align-items: center; gap: var(--sett-space-2); padding: var(--sett-space-1) var(--sett-space-3); background: var(--sett-color-paper); border-bottom: var(--sett-stroke-hair) solid var(--sett-color-line2); min-height: calc(var(--sett-space-5) * 2); flex-wrap: wrap; }
.strip .bn { font-family: var(--sett-font-mono); font-weight: var(--sett-font-weight-medium); margin-right: var(--sett-space-1); }
.body { display: grid; grid-template-columns: 250px minmax(0, 1fr) 330px; min-height: 0; }
.left { background: var(--sett-color-paper); border-right: var(--sett-stroke-hair) solid var(--sett-color-line2); padding: var(--sett-space-2); display: flex; flex-direction: column; gap: var(--sett-space-2); min-height: 0; overflow: hidden; }
.center { display: flex; flex-direction: column; min-width: 0; padding: var(--sett-space-2); gap: var(--sett-space-1); }
.center sett-frame { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.center sett-frame::part(inner) { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.center .ed { flex: 1; }
.right { border-left: var(--sett-stroke-hair) solid var(--sett-color-line2); display: flex; min-height: 0; overflow: hidden; background: var(--sett-color-paper); }
.right sett-thread { flex: 1; }
.status { display: flex; gap: var(--sett-space-4); padding: var(--sett-space-1) var(--sett-space-3); background: var(--sett-color-paper); border-top: var(--sett-stroke-hair) solid var(--sett-color-line2); font-size: var(--sett-font-size-sm); color: var(--sett-color-ink2); } .status .r { margin-left: auto; }
.tree { font-size: var(--sett-font-size-lg); }
.tr { padding: var(--sett-space-1) var(--sett-space-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-radius: var(--sett-radius-chip); display: flex; align-items: center; gap: var(--sett-space-1); color: var(--sett-color-ink2); }
.tr.d { color: var(--sett-color-ink); font-weight: var(--sett-font-weight-medium); } .tr.f { padding-left: var(--sett-space-5); font-family: var(--sett-font-mono); font-size: var(--sett-font-size-md); } .tr.on { background: var(--sett-color-sel-bg); color: var(--sett-color-sel); }
.tr sett-tag { margin-left: auto; }
.ed { font-family: var(--sett-font-mono); font-size: var(--sett-font-size-md); line-height: var(--sett-font-line-height-code); padding: var(--sett-space-1) 0; --_session: var(--sett-session-yk-main); }
.ln { display: flex; align-items: baseline; white-space: nowrap; overflow: hidden; padding: 0 var(--sett-space-2) 0 var(--sett-space-1); }
.ln .n { width: var(--sett-space-6); text-align: right; color: var(--sett-color-mute); margin: 0 var(--sett-space-2); flex: none; } .ln .t { flex: 1; min-width: 0; }
/* map, static svg on the same values as tokens.rs */
.mapbg { flex: 1; min-height: 0; background: var(--sett-color-bg); border-radius: var(--sett-radius-card); position: relative; overflow: hidden; }
svg.map { font-family: var(--sett-font-mono); font-size: var(--sett-font-map-label); display: block; width: 100%; height: 100%; }
svg.map .area { fill: none; stroke: var(--sett-color-line); stroke-dasharray: 3 3; }
svg.map .area.editing { stroke: var(--sett-color-sel); stroke-dasharray: none; }
svg.map .area-h { font-family: var(--sett-font-sans); fill: var(--sett-color-ink2); }
svg.map .item { fill: var(--sett-color-paper); stroke: var(--sett-color-line); stroke-width: var(--sett-stroke-hair); }
svg.map .item.port { rx: 9; }
svg.map .item.ext { fill: var(--sett-map-status-external-bg); stroke-dasharray: 2 2; }
svg.map .item.sel { fill: var(--sett-color-sel-bg); stroke: var(--sett-color-sel); stroke-width: var(--sett-stroke-lit); }
svg.map .item.planned { fill: var(--sett-color-sug-bg); stroke: var(--sett-color-sug); stroke-dasharray: 3 2; }
svg.map .item.s { fill: var(--_session-bg, var(--sett-session-yk-bg)); stroke: var(--_session, var(--sett-session-yk-main)); }
svg.map .item.finding { stroke: var(--sett-color-bad); }
svg.map .lbl { fill: var(--sett-color-ink); } svg.map .lbl.sel { fill: var(--sett-color-sel-ink); } svg.map .lbl.planned { fill: var(--sett-color-sug); }
svg.map g.faded { opacity: var(--sett-map-far); }
svg.map .link { fill: none; stroke: var(--sett-color-mute); stroke-width: var(--sett-stroke-hair); }
svg.map .link.lit { stroke: var(--sett-color-sel); stroke-width: var(--sett-stroke-lit); }
svg.map .link.planned { stroke: var(--sett-color-sug); stroke-dasharray: 3 2; }
svg.map .selbox { fill: none; stroke: var(--sett-color-sel); stroke-dasharray: 4 3; stroke-width: var(--sett-stroke-hair); }
.legend { display: flex; gap: var(--sett-space-3); font-size: var(--sett-font-size-sm); color: var(--sett-color-ink2); padding: var(--sett-space-1) var(--sett-space-2); flex-wrap: wrap; }
.legend i { display: inline-block; width: var(--sett-space-2); height: var(--sett-space-2); border-radius: var(--sett-radius-item); vertical-align: middle; margin-right: var(--sett-space-1); border: var(--sett-stroke-hair) solid var(--sett-color-line); background: var(--sett-color-paper); }
</style>`;

const top = (sel: unknown, right: unknown) => html`<div class="top"><span class="brand">arch</span><span class="lbl">orderly</span>${sel}<span class="right">${right}<span>ask ⌘K</span></span></div>`;
const tree = html`<div class="tree"><div class="tr d">refund</div><div class="tr f on">refund_flow.rs<sett-tag kind="session" session="yk">yk</sett-tag></div><div class="tr f">pg_refund_repo.rs<sett-tag kind="sel">M</sett-tag></div><div class="tr f">service.rs</div><div class="tr d">webhook</div><div class="tr f">retry.rs<sett-tag kind="sug">plan</sett-tag></div></div>`;
const sessionCard = html`<sett-session-card name="Yokohama" driver="claude code" session="yk" step="3" of="6" running>
  <sett-plan-row state="done">RefundRequest</sett-plan-row><sett-plan-row state="done">Refunds · port</sett-plan-row>
  <sett-plan-row state="running" current>PgRefundRepo<sett-sub-agent slot="sub" state="done">store</sett-sub-agent><sett-sub-agent slot="sub" state="running">tests/refund.rs</sett-sub-agent><sett-sub-agent slot="sub">migrations</sett-sub-agent></sett-plan-row>
  <sett-plan-row state="pending">refund() in api</sett-plan-row><sett-plan-row state="pending">webhook · refund</sett-plan-row>
  <span slot="foot">started 14 min ago</span><a slot="thread">thread ›</a></sett-session-card>`;
const editor = html`<div class="ed">
  <div class="ln sett-gutter-bar"><span class="sett-gutter-glyph"></span><span class="n">5</span><span class="t"><span class="sett-syn-keyword">pub trait</span> <span class="sett-syn-definition">OrderRepo</span>: Send + Sync {</span><span class="sett-hints"><span>2 callers</span><span>1 impl</span><span class="sett-hint--planned">planned · +refund()</span></span></div>
  <div class="ln sett-gutter-bar"><span class="sett-gutter-glyph"></span><span class="n">6</span><span class="t">    <span class="sett-syn-keyword">async fn</span> <span class="sett-syn-definition">get</span>(&self, id: <span class="sett-syn-type">OrderId</span>) -> <span class="sett-syn-type">Result</span><<span class="sett-syn-type">Option</span><<span class="sett-syn-type">Order</span>>>;</span></div>
  <div class="ln sett-gutter-bar sett-gutter-bar--session"><span class="sett-gutter-glyph"></span><span class="n">7</span><span class="t">    <span class="sett-syn-comment">/// refund a paid order</span></span></div>
  <div class="ln sett-gutter-bar sett-gutter-bar--session sett-ed-line"><span class="sett-gutter-glyph"></span><span class="n">8</span><span class="t">    <span class="sett-syn-keyword">async fn</span> <span class="sett-syn-definition">refund</span>(&self, o: &<span class="sett-syn-type">Order</span>) -> <span class="sett-syn-type">Result</span><<span class="sett-syn-type">RefundId</span>>;</span><span class="sett-hints"><span class="sett-hint--blame">Yokohama · 12 s ago</span></span></div>
  <div class="ln sett-gutter-bar"><span class="sett-gutter-glyph"></span><span class="n">9</span><span class="t">}</span></div>
  <div class="ln sett-gutter-bar"><span class="sett-gutter-glyph sett-gutter-glyph--finding"></span><span class="n">12</span><span class="t"><span class="sett-syn-keyword">use</span> <span class="sett-span-finding">reqwest::Client</span>;</span></div></div>`;
const thread = html`<sett-thread identity="session" session="yk"><span slot="name">Yokohama</span><span slot="context">claude code · PgRefundRepo</span><span slot="role">session</span>
  <sett-msg from="me" author="you" time="14:02">Add refunds for paid orders. Keep the payments port.</sett-msg>
  <sett-msg from="agent" author="Yokohama" time="14:03">Port done. Starting the Postgres adapter; spawning store, tests, migrations.<sett-tool>read domain/ports.rs
arch reach OrderRepo · depth 1</sett-tool><sett-changed>changed · Refunds port added</sett-changed></sett-msg>
  <sett-msg from="sub" author="sub · tests" time="14:05">refund.rs: 4 cases written, 3 green.<sett-changed>+1 file · +62</sett-changed></sett-msg>
  <sett-msg from="me" author="you" time="14:06">keep the retry policy out of the repo.</sett-msg>
  <sett-msg from="agent" author="Yokohama" time="14:06">Understood, retry stays in the api layer.<sett-changed none>no change</sett-changed></sett-msg>
  <sett-verbs slot="verbs" state="running" subject="PgRefundRepo" session="yk"></sett-verbs><sett-composer slot="composer" placeholder="tell Yokohama…"></sett-composer></sett-thread>`;

const meta: Meta = { title: 'recipes/screens' };
export default meta;
type Story = StoryObj;

export const SessionLive: Story = { name: 'session · live', render: () => html`${shellCss}<div class="shell">
  ${top(html`<sett-selector state="working" session="yk">feat/refund</sett-selector>`, html`<sett-pill>●●●○</sett-pill>`)}
  <div class="strip"><span class="bn">feat/refund</span>
    <sett-chip kind="agent" session="yk">Yokohama<span slot="count">· 3/6</span><a slot="agent">follow</a><a slot="manual">step in</a></sett-chip>
    <sett-chip kind="git">behind main<span slot="count">· 2</span><a slot="agent">with Yokohama</a><a slot="manual">update myself</a></sett-chip>
    <sett-chip kind="finding" state="blocking">rule<span slot="count">no-http-in-domain</span><a slot="agent">with Yokohama</a><a slot="manual">fix myself</a><a slot="verb">allow</a></sett-chip></div>
  <div class="body"><div class="left">${sessionCard}${tree}</div>
    <div class="center"><sett-tabbar><sett-tab pinned>map</sett-tab><sett-tab mono active dirty>ports.rs</sett-tab><sett-tab mono session="yk">pg.rs · Yokohama</sett-tab><span slot="right">⌘1 map · ⌘W close</span></sett-tabbar><sett-frame state="live" session="yk">${editor}</sett-frame></div>
    <div class="right">${thread}</div></div>
  <div class="status"><span>main · up to date</span><span>2 sessions</span><span class="r">ln 8, col 14 · rust-analyzer ✓</span></div></div>` };

const mapSvg = html`<svg class="map" viewBox="0 0 880 440" role="img"><title>map · edit at scale</title>
  <rect class="area" x="10" y="10" width="270" height="420" rx="6"/><text class="area-h" x="18" y="26">api · driving</text>
  <rect class="area editing" x="300" y="10" width="270" height="420" rx="6"/><text class="area-h" x="308" y="26" style="fill:var(--sett-color-sel)">domain · editing</text>
  <rect class="area" x="590" y="10" width="280" height="420" rx="6"/><text class="area-h" x="598" y="26">store · outbound</text>
  ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => html`<rect class="item" x="20" y=${40 + i * 30} width="240" height="18" rx="3"/><text class="lbl" x="26" y=${52.5 + i * 30}>api::${['pay', 'close', 'handle_webhook', 'router', 'notify', 'cancel', 'list', 'get', 'auth', 'metrics', 'health', 'retry'][i]}()</text>`)}
  <g class="faded">${[0, 1, 2, 3, 4, 5].map((i) => html`<rect class="item port" x="310" y=${40 + i * 30} width="250" height="18"/><text class="lbl" x="322" y=${52.5 + i * 30}>port · ${['OrderRepo', 'Payments', 'Notifier', 'Clock', 'Ids', 'Audit'][i]}</text>`)}</g>
  <rect class="selbox" x="304" y="224" width="262" height="130" rx="4"/>
  <rect class="item sel" x="310" y="230" width="250" height="18" rx="3"/><text class="lbl sel" x="316" y="242.5">RefundRequest</text>
  <rect class="item sel" x="310" y="260" width="250" height="18" rx="3"/><text class="lbl sel" x="316" y="272.5">Refund</text>
  <rect class="item planned" x="310" y="290" width="250" height="18" rx="3"/><text class="lbl planned" x="316" y="302.5">planned · RefundPolicy</text>
  <rect class="item sel" x="310" y="320" width="250" height="18" rx="3"/><text class="lbl sel" x="316" y="332.5">RefundId</text>
  <rect class="item s" x="600" y="40" width="260" height="18" rx="3"/><text class="lbl" x="606" y="52.5">PgRefundRepo · Yokohama</text>
  <rect class="item" x="600" y="70" width="260" height="18" rx="3"/><text class="lbl" x="606" y="82.5">PgOrderRepo</text>
  <rect class="item ext" x="600" y="100" width="260" height="18" rx="3"/><text class="lbl" x="606" y="112.5">billing::Invoice · other repo</text>
  <rect class="item finding" x="600" y="130" width="260" height="18" rx="3"/><text class="lbl" x="606" y="142.5">HttpNotifier · ⚠ no-http-in-domain</text>
  <path class="link lit" d="M260,49 C290,49 290,239 310,239"/><path class="link" d="M260,79 C290,79 290,269 310,269"/><path class="link planned" d="M560,299 C580,299 580,49 600,49"/><path class="link" d="M560,239 C580,239 580,79 600,79"/>
</svg>`;
export const MapEditAtScale: Story = { name: 'map · edit at scale', render: () => html`${shellCss}<div class="shell" style="--_session:var(--sett-session-yk-main);--_session-bg:var(--sett-session-yk-bg)">
  ${top(html`<sett-selector state="yours">chore/split-domain</sett-selector>`, html`<sett-pill>●●●●</sett-pill>`)}
  <div class="strip"><span class="bn">chore/split-domain</span>
    <sett-chip kind="tree" state="blocking">map edits · 4<span slot="count">· not kept</span><a slot="agent">with Yokohama</a><a slot="manual">keep</a><a slot="verb">undo all</a></sett-chip>
    <sett-chip kind="finding">rule<span slot="count">no-cycles · 1</span><a slot="agent">with Yokohama</a><a slot="manual">fix myself</a></sett-chip></div>
  <div class="body"><div class="left"><sett-seg fill><sett-seg-item value="files" active>files</sett-seg-item><sett-seg-item value="changes">changes · 4</sett-seg-item><sett-seg-item value="review">review</sett-seg-item></sett-seg>${tree}</div>
    <div class="center"><sett-tabbar><sett-tab pinned active>map</sett-tab><sett-tab mono>ports.rs</sett-tab><sett-seg slot="right"><sett-seg-item value="repo">repo</sett-seg-item><sett-seg-item value="areas">areas</sett-seg-item><sett-seg-item value="items" active>items</sett-seg-item></sett-seg><sett-overlay-toggles slot="right"><sett-toggle value="sessions" on>sessions</sett-toggle><sett-toggle value="plan" on>plan</sett-toggle><sett-toggle value="findings" on>findings</sett-toggle><sett-toggle value="delta">delta</sett-toggle></sett-overlay-toggles></sett-tabbar>
      <sett-frame state="editing"><div class="mapbg">${mapSvg}</div><div class="legend"><span><i></i>item</span><span><i style="border-radius:var(--sett-radius-node)"></i>port</span><span><i style="border-style:dashed;background:var(--sett-map-status-external-bg)"></i>other repo</span><span><i style="border-color:var(--sett-color-sel);background:var(--sett-color-sel-bg)"></i>selected · 3</span><span><i style="border-color:var(--sett-color-sug);background:var(--sett-color-sug-bg);border-style:dashed"></i>planned</span><span><i style="border-color:var(--sett-session-yk-main);background:var(--sett-session-yk-bg)"></i>Yokohama</span><span><i style="border-color:var(--sett-color-bad)"></i>finding</span></div></sett-frame></div>
    <div class="right"><sett-thread identity="planner"><span slot="name">planner</span><span slot="context">shaping · 3 elements</span><span slot="role">plan</span>
      <sett-msg from="me" author="intention">Split the domain: refunds get their own area.</sett-msg>
      <sett-msg from="agent" author="planner" style="--_session:var(--sett-color-sug)">Three elements moved, one policy planned. The delta is below.<sett-changed>changed · 3 elements drafted</sett-changed></sett-msg>
      <sett-card variant="delta"><span slot="title">plan delta</span><sett-tag slot="state" kind="sug">3 elements</sett-tag>
        <sett-card-row mark="+" kind="sug"><b>RefundPolicy</b> · domain<span slot="right">new</span></sett-card-row>
        <sett-card-row mark="~" kind="sug"><b>RefundRequest</b> · moved<span slot="right">changed</span></sett-card-row>
        <sett-card-row mark="·" kind="mute">keeps: OrderRepo, Payments<span slot="right">unchanged</span></sett-card-row>
        <sett-split-button slot="acts">accept · delegate to Yokohama</sett-split-button><sett-button slot="acts">save plan</sett-button><sett-button slot="acts" variant="quiet">discard</sett-button></sett-card>
      <sett-verbs slot="verbs">draft · 1 question open</sett-verbs><sett-composer slot="composer" placeholder="answer, or say how…"></sett-composer></sett-thread></div></div>
  <div class="status"><span>main · up to date</span><span>1 session</span><span class="r">4 edits not kept · ⌘S keep</span></div></div>` };
