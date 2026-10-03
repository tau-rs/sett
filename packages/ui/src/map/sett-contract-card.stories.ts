import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { Fixture, FixtureContract } from './fixtures.js';
import { PORT_KINDS } from './sett-port-row.js';
import { ripgrep, zed, zero2prod } from './map-fixtures.stories-helpers.js';
import './sett-contract-card.js';

/**
 * What a port promises, on the three fixtures. One skeleton for every kind:
 * the kind only changes the chip's dot and word. The card sits wherever the
 * host puts it (the map's panel here, `map.size.panel` wide).
 */
const meta: Meta = {
  title: 'map/contract card',
  component: 'sett-contract-card',
  args: { kind: 'http', name: 'zero2prod · HTTP API', owner: 'zero2prod', format: 'actix-web App · 12 routes', witness: 'src/startup.rs:90-106', schema: '', notes: '' },
  argTypes: { kind: { control: 'select', options: PORT_KINDS } },
  render: ({ kind, name, owner, format, witness, schema, notes }) => holder(html`<sett-contract-card kind=${kind} name=${name} owner=${owner} format=${format} witness=${witness} schema=${schema} notes=${notes} .ops=${zero2prod.contracts['z2p.http'].ops ?? []} .used=${zero2prod.contracts['z2p.http'].used ?? []}></sett-contract-card>`),
};
export default meta;
type Story = StoryObj;

const holder = (c: unknown, label = '') => html`<div style="width:var(--sett-map-size-panel)">${label ? html`<div style="font-size:var(--sett-font-size-xs);color:var(--sett-color-mute);margin-bottom:var(--sett-space-1)">${label}</div>` : ''}${c}</div>`;
const row = (...cols: unknown[]) => html`<div class="sett-row" style="align-items:flex-start;gap:var(--sett-space-4)">${cols}</div>`;
const cardOf = (c: FixtureContract) => html`<sett-contract-card kind=${c.kind} name=${c.name} owner=${c.owner} format=${ifDefined(c.format)} witness=${ifDefined(c.witness ?? undefined)} schema=${ifDefined(c.schema)} notes=${ifDefined(c.notes)} .ops=${c.ops ?? []} .used=${c.used ?? []}></sett-contract-card>`;
const of = (f: Fixture, ...ids: string[]) => row(...ids.map((id) => holder(cardOf(f.contracts[id]), `${f.name} · ${id}`)));

export const Default: Story = {};
export const Http: Story = { name: 'http · zero2prod · ours, and a third party\'s (postmark)', render: () => of(zero2prod, 'z2p.http', 'postmark') };
export const Rpc: Story = { name: 'rpc · zed · protobuf over websocket', render: () => of(zed, 'zed.proto') };
export const Cli: Story = { name: 'cli · ripgrep · a long ops block wraps inside the well', render: () => of(ripgrep, 'rg.cli') };
export const Topic: Story = {
  name: 'topic · illustrative: no fixture has an event port',
  render: () => holder(cardOf({ kind: 'topic', name: 'subscriber.confirmed', owner: 'zero2prod', format: 'illustrative · JSON event', witness: 'src/events.rs:12', ops: ['publish subscriber.confirmed', 'subscribe subscriber.confirmed → send_welcome()'], schema: 'SubscriberConfirmed { subscriber_id, confirmed_at }', used: [['worker', 'send_welcome()']], notes: 'illustrative data: the three fixtures hold no topic' }), 'illustrative'),
};
export const Crate: Story = { name: 'crate · zed, zero2prod · a library and a dependency list', render: () => row(holder(cardOf(zed.contracts['zed_extension_api']), 'zed · zed_extension_api'), holder(cardOf(zero2prod.contracts['z2p.deps']), 'zero2prod · z2p.deps')) };
export const Sql: Story = { name: 'sql · zero2prod · tables, and a table with its schema', render: () => of(zero2prod, 'z2p.pg', 'z2p.queue') };
export const Pub: Story = { name: 'pub · ripgrep · a trait and its users', render: () => of(ripgrep, 'sink.pub', 'matcher.pub') };
export const Redis: Story = { name: 'redis · zero2prod · the session store', render: () => of(zero2prod, 'z2p.redis') };
export const FsAndTty: Story = { name: 'fs · tty · ripgrep · the system', render: () => of(ripgrep, 'rg.fs', 'rg.tty') };
export const Declared: Story = { name: 'declared · zed · no witness: dashed, and it says so', render: () => of(zed, 'zed.site') };
export const NothingToSay: Story = { name: 'absent parts · no users, no notes, no schema: the card is shorter', render: () => row(holder(cardOf(zed.contracts['collab.api']), 'zed · collab.api'), holder(cardOf(ripgrep.contracts['matcher.deps']), 'ripgrep · matcher.deps')) };
export const LongName: Story = { name: 'a name too long ends in an ellipsis · the chip stays', render: () => holder(cardOf({ ...zero2prod.contracts['z2p.queue'], name: 'zero2prod · issue_delivery_queue · the table used as a queue' })) };
