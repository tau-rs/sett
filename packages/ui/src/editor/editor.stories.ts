import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, unsafeStatic } from 'lit/static-html.js';
import './sett-hint.js';
import editorCss from './editor.css?raw';

const style = html`<style>${unsafeStatic(editorCss)}
.ed { border: var(--sett-stroke-hair) solid var(--sett-color-line2); border-radius: var(--sett-radius-card); background: var(--sett-color-paper); font-family: var(--sett-font-mono); font-size: var(--sett-font-size-md); line-height: var(--sett-font-line-height-code); padding: var(--sett-space-1) 0; width: 560px; --_session: var(--sett-session-yk-main); }
.ln { display: flex; align-items: baseline; white-space: nowrap; overflow: hidden; padding: 0 var(--sett-space-2) 0 var(--sett-space-1); }
.ln .n { width: var(--sett-space-6); text-align: right; color: var(--sett-color-mute); margin: 0 var(--sett-space-2); flex: none; }
.ln .t { flex: 1; min-width: 0; color: var(--sett-color-ink); }
.sit { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sett-space-3); }
.sit h4 { margin: 0 0 var(--sett-space-1); font-size: var(--sett-font-size-sm); font-weight: var(--sett-font-weight-medium); color: var(--sett-color-ink2); font-family: var(--sett-font-sans); }
</style>`;
// `site` is a planned element's hint pill, after the code at the line it targets (rule 12): the line itself is untouched
const L = (n: number, t: unknown, o: { bar?: string; glyph?: string; cls?: string; hints?: unknown; site?: string } = {}) => html`<div class="ln sett-gutter-bar ${o.bar ? `sett-gutter-bar--${o.bar}` : ''} ${o.cls ?? ''}"><span class="sett-gutter-glyph ${o.glyph ? `sett-gutter-glyph--${o.glyph}` : ''}"></span><span class="n">${n}</span><span class="t">${t}</span>${o.site ? html`<sett-hint kind="planned">${o.site}</sett-hint>` : ''}${o.hints ? html`<span class="sett-hints">${o.hints}</span>` : ''}</div>`;
const decl = (o: { planned?: boolean; finding?: boolean; witness?: boolean } = {}) => L(5, html`<span class="sett-syn-keyword">pub trait</span> <span class="sett-syn-definition ${o.witness ? 'sett-span-witness' : ''}">OrderRepo</span>: Send + Sync {`, { glyph: o.planned ? 'planned' : o.witness ? 'witness' : '', site: o.planned ? 'planned · +refund()' : undefined, hints: html`<span>2 callers</span><span>1 impl</span>${o.finding ? html`<span class="sett-hint--finding">⚠ 1</span>` : ''}` });
const file = (o: { session?: boolean; you?: boolean; caret?: boolean; planned?: boolean; finding?: boolean; witness?: boolean; xrepo?: boolean; other?: boolean } = {}) => { const k = o.other ? 1 : 0; return html`<div class="ed">
  ${L(1, html`<span class="sett-syn-comment">//! orders: what an order is, and what the domain may do to one</span>`)}
  ${L(2, html`<span class="sett-syn-keyword">use</span> crate::orders::{<span class="sett-syn-type">Order</span>, <span class="sett-syn-type">OrderId</span>};`)}
  ${o.xrepo ? L(3, html`<span class="sett-syn-keyword">use</span> <span class="sett-sym-external">billing::Invoice</span>;`) : ''}
  ${L(4, html`<span class="sett-syn-attribute">#[async_trait]</span>`)}
  ${decl(o)}
  ${L(6, html`    <span class="sett-syn-keyword">async fn</span> <span class="sett-syn-definition">get</span>(&self, id: <span class="sett-syn-type">OrderId</span>) -> <span class="sett-syn-type">Result</span><<span class="sett-syn-type">Option</span><<span class="sett-syn-type">Order</span>>>;`)}
  ${o.session ? L(7, html`    <span class="sett-syn-comment">/// refund a paid order</span>`, { bar: 'session' }) : ''}
  ${o.session ? L(8, html`    <span class="sett-syn-keyword">async fn</span> <span class="sett-syn-definition">refund</span>(&self, o: &<span class="sett-syn-type">Order</span>) -> <span class="sett-syn-type">Result</span><<span class="sett-syn-type">RefundId</span>>;`, { bar: 'session', cls: o.caret ? 'sett-ed-line' : '', hints: o.caret ? html`<span class="sett-hint--blame">Yokohama · 12 s ago</span>` : undefined }) : ''}
  ${o.you ? L(9, html`    <span class="sett-syn-keyword">async fn</span> <span class="sett-syn-definition">list</span>(&self, q: &<span class="sett-syn-type">Query</span>) -> <span class="sett-syn-type">Result</span><<span class="sett-syn-type">Vec</span><<span class="sett-syn-type">Order</span>>>;`, { bar: 'you' }) : ''}
  ${o.other ? L(10, html`    <span class="sett-syn-keyword">async fn</span> <span class="sett-syn-definition">count</span>(&self) -> <span class="sett-syn-type">Result</span><u64>;`, { bar: 'tl' }) : ''}
  ${L(10 + k, html`}`)}
  ${L(11 + k, html`<span class="sett-syn-keyword">pub fn</span> <span class="sett-syn-definition">retry_after</span>(n<sett-hint>: u32</sett-hint>) -> <span class="sett-syn-type">Duration</span> {`, { hints: html`<span>3 callers</span>` })}
  ${L(12 + k, html`    <span class="sett-syn-keyword">let</span> base<sett-hint>: u64</sett-hint> = <span class="sett-syn-constant">250</span>;`)}
  ${L(13 + k, html`    <span class="sett-syn-macro">log!</span>(<span class="sett-syn-string">"retry {n}"</span>);`)}
  ${L(14 + k, html`    <span class="sett-syn-type">Duration</span>::<span class="sett-syn-function">from_millis</span>(base * <span class="sett-span-warning">2u64.pow(n)</span>)`, { glyph: 'warning' })}
  ${L(15 + k, html`}`)}
  ${o.finding ? L(16 + k, html`<span class="sett-syn-keyword">use</span> <span class="sett-span-finding">reqwest::Client</span>;`, { glyph: 'finding' }) : ''}
</div>`; };

const meta: Meta = { title: 'editor/decorations', component: 'sett-hint' };
export default meta;
type Story = StoryObj;

export const Syntax: Story = { name: 'syntax · seven classes at one lightness', render: () => html`${style}${file()}` };
export const SessionWorking: Story = { name: 'a session is working · gutter bars, blame on the caret line', render: () => html`${style}${file({ session: true, caret: true })}` };
export const YouTookOver: Story = { name: 'you took over · your bar is blue', render: () => html`${style}${file({ session: true, you: true })}` };
export const BarsPerAuthor: Story = { name: 'change bars per author · Yokohama, Lyon, you', render: () => html`${style}${file({ session: true, other: true, you: true })}` };
export const Planned: Story = { name: 'a planned element · ◇ in the gutter and the hint pill at its site, never an inserted line', render: () => html`${style}${file({ planned: true })}` };
export const Finding: Story = { name: 'a finding · wavy underline, ⚠ in the gutter, count in the hints', render: () => html`${style}${file({ finding: true })}` };
export const Witness: Story = { name: 'a witness · highlighted span, ◆', render: () => html`${style}${file({ witness: true })}` };
export const CrossRepo: Story = { name: 'a symbol from another repo · italic', render: () => html`${style}${file({ xrepo: true })}` };
export const BusyDay: Story = { name: 'a busy day · session, plan, finding', render: () => html`${style}${file({ session: true, you: true, planned: true, finding: true, caret: true })}` };
export const Hints: Story = { name: 'sett-hint · kinds', render: () => html`${style}<div class="sett-row"><sett-hint>: u32</sett-hint><sett-hint kind="planned">planned · +refund()</sett-hint><sett-hint kind="finding">⚠ 1</sett-hint><sett-hint kind="session">Yokohama · 2 lines</sett-hint><sett-hint kind="blame">Yokohama · 12 s ago</sett-hint></div>` };
export const AllSituations: Story = { name: 'all eight situations', render: () => html`${style}<div class="sit">${[
  ['nothing happening', file()], ['session working', file({ session: true, caret: true })], ['you took over', file({ session: true, you: true })], ['plan pending', file({ planned: true })],
  ['finding', file({ finding: true })], ['witness', file({ witness: true })], ['other repo', file({ xrepo: true })], ['busy day', file({ session: true, you: true, planned: true, finding: true, caret: true })],
].map(([h, f]) => html`<div><h4>${h}</h4>${f}</div>`)}</div>` };
