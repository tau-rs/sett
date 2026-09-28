import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-card.js';
import '../pill/sett-pill.js';
import '../tag/sett-tag.js';
import '../button/sett-button.js';

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
