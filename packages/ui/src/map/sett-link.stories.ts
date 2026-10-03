import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { LINK_KINDS, kindsOf, type LinkFamily, type LinkKind } from './link-kinds.js';
import type { ItemDelta, ItemKind } from './sett-item.js';
import type { LinkDelta } from './sett-link.js';
import './sett-item.js';
import './sett-op-row.js';
import './sett-link.js';

/**
 * One line between two items, outside a sheet: the link finds its ends by
 * `key` and draws the simplest square route by itself. The grammar: the
 * line pattern is the family, the head is the kind, a diamond at the start
 * is ownership. The lighter the line, the less the analyser knows.
 */
const meta: Meta = { title: 'map/link', component: 'sett-link' };
export default meta;
type Story = StoryObj;

interface End { name: string; kind?: ItemKind; port?: boolean; entry?: boolean; finding?: boolean; selected?: boolean; lit?: boolean; planned?: boolean; group?: string; delta?: ItemDelta }
interface Row { kind: LinkKind; from: End; to: End; finding?: boolean; guessed?: boolean; lit?: boolean; selected?: boolean; far?: boolean; plug?: boolean; label?: string; caption?: string; swap?: boolean; anchor?: 'from' | 'to'; planned?: boolean; delta?: LinkDelta; wire?: string }

const item = (key: string, e: End) => html`<sett-item key=${key} kind=${e.kind ?? 'fn'} ?port=${e.port} ?entry=${e.entry} ?finding=${e.finding} ?selected=${e.selected} ?lit=${e.lit} ?planned=${e.planned} group=${ifDefined(e.group)} delta=${ifDefined(e.delta)}>${e.name}</sett-item>`;
const row = (id: string, r: Row) => html`
  <span class="cap">${r.caption ?? LINK_KINDS[r.kind].label}</span>
  <div class="pair" style=${r.swap ? 'direction: rtl' : nothing}>
    <div>${item(`${id}-a`, r.from)}</div>
    <div>${item(`${id}-b`, r.to)}</div>
    <sett-link from=${`${id}-a`} to=${`${id}-b`} kind=${r.kind} label=${ifDefined(r.label)} anchor=${ifDefined(r.anchor)} ?finding=${r.finding} ?guessed=${r.guessed} ?lit=${r.lit} ?selected=${r.selected} ?far=${r.far} ?plug=${r.plug} ?planned=${r.planned} delta=${ifDefined(r.delta)} ?wire=${!!r.wire} style=${r.wire ? `--_wire: var(--sett-map-kind-${r.wire}-color)` : nothing}></sett-link>
  </div>`;
const table = (rows: Row[], note: string) => html`
  <style>
    .rows { display: grid; grid-template-columns: 14ch auto; row-gap: var(--sett-space-2); column-gap: var(--sett-space-4); align-items: center; font-family: var(--sett-font-sans); font-size: var(--sett-font-size-base); color: var(--sett-color-ink2); }
    .pair { position: relative; display: grid; grid-template-columns: var(--sett-map-size-column) var(--sett-map-size-column); column-gap: var(--sett-map-size-column-gutter); align-items: center; }
    .pair > div { padding-inline: var(--sett-space-2); }
    .note { margin: 0 0 var(--sett-space-3); max-width: 64ch; color: var(--sett-color-ink2); font-family: var(--sett-font-sans); }
  </style>
  <p class="note">${note}</p>
  <div class="rows">${rows.map((r, i) => row(`${r.kind}-${i}`, r))}</div>`;

const fn = (name: string, e: Partial<End> = {}): End => ({ name, kind: 'fn', ...e });
const st = (name: string, e: Partial<End> = {}): End => ({ name, kind: 'struct', ...e });
const tr = (name: string, e: Partial<End> = {}): End => ({ name, kind: 'trait', ...e });
const en = (name: string): End => ({ name, kind: 'enum' });

/** one real-looking pair per kind, from the zero2prod and ripgrep fixtures */
const EXAMPLES: Record<LinkKind, [End, End, string?]> = {
  'calls': [fn('subscribe()', { entry: true }), fn('insert_subscriber()'), 'subscribe → insert_subscriber'],
  'calls-port': [fn('send_confirmation_email()'), tr('EmailSender', { port: true }), 'dyn EmailSender::send'],
  'hands-off': [fn('publish_newsletter()', { entry: true }), fn('enqueue_delivery_tasks()'), 'tokio::spawn'],
  'constructs': [fn('subscribe()', { entry: true }), st('NewSubscriber'), 'NewSubscriber { .. }'],
  'wires': [fn('Application::build()'), st('PostgresStore'), 'Box::new(store) as Box<dyn Store>'],
  'calls-out': [fn('send_email()'), { name: 'reqwest::Client', kind: 'external' }, 'reqwest'],
  'listens-to': [fn('run_worker()'), st('issue_delivery_queue'), 'rx.recv()'],
  'implements': [st('PostgresStore'), tr('Store', { port: true }), 'impl Store for PostgresStore'],
  'inherits': [st('AdminController'), st('Controller'), 'class AdminController : Controller'],
  'refines': [tr('Matcher'), tr('Captures'), 'trait Matcher: Captures'],
  'depends-on-port': [st('Searcher'), tr('Sink', { port: true }), 'S: Sink'],
  'uses-type': [fn('login()', { entry: true }), st('Credentials'), 'fn login(c: Credentials)'],
  'holds': [st('Application'), st('EmailClient'), 'email_client: EmailClient'],
  'shares-state': [fn('get_username()'), st('TypedSession'), 'Arc<Mutex<Session>>'],
  'matches-on': [fn('try_processing()'), en('NextAction'), 'match action { .. }'],
  'translates': [fn('validate_credentials()'), en('AuthError'), 'impl From<sqlx::Error> for AuthError'],
  'reads': [fn('run()'), { name: 'DEFAULT_PORT', kind: 'struct' }, 'const DEFAULT_PORT'],
  'tests': [{ name: 'tests', kind: 'mod' }, fn('subscribe()', { entry: true }), '#[test] fn subscribe_returns_200'],
  're-exports': [{ name: 'pub use matcher · error', kind: 'mod' }, tr('Matcher'), 'pub use crate::matcher::Matcher'],
  'expands': [fn('main()', { entry: true }), { name: 'routes!', kind: 'macro' }, 'routes!(..)'],
  'decorates': [fn('health_check()', { entry: true }), { name: 'tracing::instrument', kind: 'macro' }, '#[tracing::instrument]'],
  'refers-to': [fn('main()', { entry: true }), st('Settings'), 'use crate::configuration::Settings'],
};
const family = (f: LinkFamily): Row[] => kindsOf(f).map((kind) => ({ kind, from: EXAMPLES[kind][0], to: EXAMPLES[kind][1], label: EXAMPLES[kind][2] }));

export const Does: Story = { name: 'family · does · solid: calls, calls port, hands off, constructs, wires, calls out, listens to', render: () => table(family('does'), 'Solid: something runs. The head says which way it runs: a filled triangle calls directly, a socket calls through an interface chosen at run time, an open chevron hands work off, a dot makes a value, a bar plugs an adapter into a port slot, a double chevron leaves the unit, a hollow dot listens. Point at a line to read its kind and the exact construct.') };
export const Promises: Story = { name: 'family · promises · dashed: implements, inherits, refines, depends on port', render: () => table(family('promises'), 'Dashed: a contract. The hollow triangle keeps its meaning from every notation an engineer knows (is a / fulfils); a base bar under it is inheritance, two of them a trait that requires another; the socket is a need declared by interface only.') };
export const Knows: Story = { name: 'family · knows · dotted: uses type, holds, shares state, matches on, translates, reads', render: () => table(family('knows'), 'Dotted: depends on a shape. The open chevron is the weak "uses"; a diamond at the start is ownership, filled when owned (holds), hollow when shared (shares state); a square looks inside; a double chevron converts; a dot reads a constant.') };
export const Around: Story = { name: 'family · around · dash-dot: tests, re-exports, expands, decorates', render: () => table(family('around'), 'Dash-dot: surrounds the code without being part of its flow. A hollow dot checks it, a double chevron passes it through, a triangle writes code into it, a square wraps it.') };
export const RefersTo: Story = { name: 'the fallback · refers to · the lightest line, no head', render: () => table([{ kind: 'refers-to', from: EXAMPLES['refers-to'][0], to: EXAMPLES['refers-to'][1], label: EXAMPLES['refers-to'][2] }], 'When only an import or an unresolved reference is known: no family, no head, the lightest ink. The lighter the line, the less the analyser knows.') };

export const States: Story = {
  name: 'states · at rest · lit · selected · far',
  render: () => table([
    { kind: 'calls', from: fn('subscribe()', { entry: true }), to: fn('insert_subscriber()'), caption: 'at rest' },
    { kind: 'calls', from: fn('subscribe()', { entry: true, lit: true }), to: fn('insert_subscriber()'), lit: true, caption: 'lit · pointed at' },
    { kind: 'calls', from: fn('subscribe()', { entry: true, selected: true }), to: fn('insert_subscriber()'), selected: true, caption: 'selected · flowing' },
    { kind: 'calls', from: fn('subscribe()', { entry: true }), to: fn('insert_subscriber()'), far: true, caption: 'far · unrelated' },
  ], 'Rest ink is mute, one step darker than any border. Pointing turns the line blue with the item at the other end. Selecting draws it outward and then the flow dashes travel, on the selection alone. Unrelated lines recede to map.far.'),
};
export const Finding: Story = {
  name: 'finding · red and heavier, on any kind, never recedes',
  render: () => table([
    { kind: 'calls', from: fn('publish_newsletter() · POST /newsletters', { entry: true, finding: true }), to: fn('insert_newsletter_issue()'), finding: true, label: 'mounted outside /admin · no reject_anonymous_users' },
    { kind: 'implements', from: st('PostgresStore'), to: tr('Store', { port: true }), finding: true, label: 'adapter implements a port of another unit' },
    { kind: 'holds', from: st('Domain'), to: st('PgPool'), finding: true, label: 'the domain holds an adapter' },
    { kind: 'calls', from: fn('publish_newsletter()', { entry: true, finding: true }), to: fn('insert_newsletter_issue()'), finding: true, far: true, caption: 'finding, among far lines' },
  ], 'A finding is an overlay, not a kind: the line keeps its own pattern and head, red and one step heavier. It keeps full ink when everything around it recedes.'),
};
export const Guessed: Story = {
  name: 'guessed · the analyser is not sure: a lighter line',
  render: () => table([
    { kind: 'calls', from: fn('subscribe()', { entry: true }), to: fn('insert_subscriber()'), caption: 'resolved' },
    { kind: 'calls', from: fn('subscribe()', { entry: true }), to: fn('insert_subscriber()'), guessed: true, caption: 'guessed' },
    { kind: 'refers-to', from: fn('main()', { entry: true }), to: st('Settings'), caption: 'refers to' },
  ], 'Three confidences (rule 10): resolved is firm ink, guessed is lighter, the fallback is the lightest. A finding is never raised on a guessed line without saying so.'),
};
export const Backward: Story = {
  name: 'backward · a line pointing right to left is a smell',
  render: () => table([
    { kind: 'calls', from: fn('subscribe()', { entry: true }), to: fn('insert_subscriber()'), caption: 'uses, left to right' },
    { kind: 'calls', from: fn('insert_subscriber()'), to: fn('subscribe()', { entry: true }), swap: true, caption: 'right to left' },
  ], 'Uses points left to right under both column rules (rule 11). A link that points the other way is drawn in the smell colour, whatever its kind.'),
};
const P = (e: End): End => ({ ...e, planned: true, group: e.group ?? 'g1' });
export const Plan: Story = {
  name: 'plan overlay · a planned link is amber and heavier on the amber band',
  render: () => table([
    { kind: 'calls', from: fn('subscribe()', { entry: true }), to: fn('insert_subscriber()'), caption: 'today · at rest' },
    { kind: 'calls', from: { name: 'order.paid', kind: 'external' }, to: fn('on_paid()'), wire: 'topic', caption: 'today · a topic wire' },
    { kind: 'calls', from: P(fn('refund()')), to: P(fn('insert_refund()')), planned: true, caption: 'planned · calls' },
    { kind: 'implements', from: P(st('StripeRefunds')), to: P(tr('Refunds', { port: true })), planned: true, caption: 'planned · implements' },
    { kind: 'calls', from: { name: 'refund.asked', kind: 'external' }, to: P(fn('refund()')), wire: 'topic', planned: true, caption: 'planned · a topic wire' },
    { kind: 'calls', from: P(fn('refund()', { selected: true })), to: P(fn('insert_refund()')), planned: true, selected: true, caption: 'planned · selected' },
    { kind: 'calls', from: P(fn('refund()', { finding: true })), to: fn('insert_order()'), planned: true, finding: true, label: 'the domain calls an adapter', caption: 'planned · a finding' },
  ], 'The plan will add these links; nothing is written yet. A planned link keeps its pattern and its head (the dash is the family, so it cannot take the planned item\'s dashes): it turns amber, one step heavier, on the amber tint band. The weight and the band tell it from a topic wire, a thin bare amber line. A finding outranks the plan; the selection turns it blue and keeps the band.'),
};
export const Delta: Story = {
  name: 'delta overlay · removed is a ghost cut across its middle, unchanged recedes',
  render: () => table([
    { kind: 'calls', from: fn('subscribe()', { entry: true }), to: fn('insert_subscriber()'), guessed: true, caption: 'today · guessed' },
    { kind: 'calls', from: fn('subscribe()', { entry: true, delta: 'changed' }), to: fn('insert_subscriber()', { delta: 'unchanged' }), delta: 'unchanged', caption: 'delta · unchanged' },
    { kind: 'calls', from: fn('subscribe()', { entry: true, delta: 'changed' }), to: st('SubscriberName::parse', { delta: 'added' }), delta: 'added', caption: 'delta · added' },
    { kind: 'calls', from: fn('subscribe()', { entry: true, delta: 'changed' }), to: fn('store_token()', { delta: 'unchanged' }), delta: 'removed', caption: 'delta · removed' },
    { kind: 'implements', from: st('OldStore', { delta: 'removed' }), to: tr('Store', { port: true }), delta: 'removed', caption: 'delta · removed, dashed kind' },
    { kind: 'calls', from: fn('publish_newsletter()', { entry: true, finding: true }), to: fn('insert_newsletter_issue()', { delta: 'unchanged' }), finding: true, delta: 'unchanged', caption: 'delta · unchanged finding' },
  ], 'Against main: what the branch adds is drawn as it is, what it removes stays as a ghost in the palest ink with a cut across its middle (the line\'s struck-through), what it leaves alone recedes to map.far. A finding never recedes.'),
};
export const Plugs: Story = {
  name: 'plugs · a dot beside each connected item, the line on demand',
  render: () => table([
    { kind: 'calls', from: fn('subscribe()', { entry: true }), to: fn('insert_subscriber()'), plug: true, caption: 'plugs · at rest' },
    { kind: 'calls', from: fn('subscribe()', { entry: true, lit: true }), to: fn('insert_subscriber()'), plug: true, lit: true, caption: 'plugs · lit' },
    { kind: 'calls', from: fn('publish_newsletter() · POST /newsletters', { entry: true, finding: true }), to: fn('insert_newsletter_issue()'), plug: true, finding: true, caption: 'plugs · a finding' },
  ], 'The sheet\'s plugs level: only the two dots say an item is connected; pointing or selecting brings the line. A finding is drawn in every level.'),
};
export const Wire: Story = {
  name: 'wire · a port wire takes the port kind\'s colour',
  render: () => html`
    <style>
      .w { position: relative; display: grid; grid-template-columns: var(--sett-map-size-rail) var(--sett-map-size-column); column-gap: var(--sett-map-size-column-gutter); align-items: center; }
      .w sett-op-row { padding-right: var(--sett-space-2); }
      .note { margin: 0 0 var(--sett-space-3); max-width: 64ch; color: var(--sett-color-ink2); font-family: var(--sett-font-sans); }
    </style>
    <p class="note">A route with a handler wires its op row to the item that handles it. The wire takes the port kind's colour (here http) and docks at mid height; a port without handlers wires to its area.</p>
    <div class="w">
      <sett-op-row key="w-op" kind="route" method="POST" path="/subscriptions" handler="subscribe"></sett-op-row>
      <div style="padding-inline: var(--sett-space-2)"><sett-item key="w-it" entry>subscribe()</sett-item></div>
      <sett-link from="w-op" to="w-it" kind="calls" wire style="--_wire: var(--sett-map-kind-http-color)"></sett-link>
    </div>`,
};
export const SelectDraws: Story = {
  name: 'motion · select draws the connections outward, then the flow travels',
  render: () => {
    const toggle = (e: Event) => {
      const root = (e.currentTarget as HTMLElement).closest('[data-scene]')!;
      const on = !root.querySelector('sett-link')!.hasAttribute('selected');
      root.querySelectorAll('sett-link').forEach((l) => { l.toggleAttribute('selected', on); });
      root.querySelector('sett-item[key="sd-a"]')!.toggleAttribute('selected', on);
    };
    return html`
      <div data-scene>
        <style>
          .note { margin: 0 0 var(--sett-space-3); max-width: 64ch; color: var(--sett-color-ink2); font-family: var(--sett-font-sans); }
          .sc { position: relative; display: grid; grid-template-columns: var(--sett-map-size-column) var(--sett-map-size-column); column-gap: var(--sett-map-size-column-gutter); row-gap: var(--sett-space-3); align-items: start; }
          .sc > div { padding-inline: var(--sett-space-2); }
          button { font: inherit; color: var(--sett-color-sel); background: var(--sett-color-paper); border: var(--sett-stroke-hair) solid var(--sett-color-line); border-radius: var(--sett-radius-chip); padding: var(--sett-space-1) var(--sett-space-2); cursor: pointer; margin-bottom: var(--sett-space-3); }
        </style>
        <p class="note">Click select. Each line is drawn from the selected item toward the other end over motion.draw; only once drawn do the flow dashes travel. Deselect and the flow stops. Under reduced motion there is no draw and no travel: a plain blue line.</p>
        <button @click=${toggle}>select subscribe()</button>
        <div class="sc">
          <div><sett-item key="sd-a" entry>subscribe()</sett-item></div>
          <div><sett-item key="sd-b">insert_subscriber()</sett-item><sett-item key="sd-c">store_token()</sett-item><sett-item key="sd-d" kind="struct">NewSubscriber</sett-item></div>
          <sett-link from="sd-a" to="sd-b" kind="calls"></sett-link>
          <sett-link from="sd-a" to="sd-c" kind="calls"></sett-link>
          <sett-link from="sd-a" to="sd-d" kind="constructs"></sett-link>
        </div>
      </div>`;
  },
};
