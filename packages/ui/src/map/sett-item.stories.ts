import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { sessionOrder } from '@tau-rs/sett-tokens';
import { ITEM_KINDS } from './sett-item.js';
import './sett-item.js';

const meta: Meta = {
  title: 'map/item',
  component: 'sett-item',
  args: { kind: 'fn', name: 'subscribe()', entry: true, port: false, finding: false, selected: false, live: false, family: '', unresolved: 0 },
  argTypes: { kind: { control: 'select', options: ITEM_KINDS }, session: { control: 'select', options: [undefined, ...sessionOrder] }, also: { control: 'select', options: [undefined, ...sessionOrder] } },
  render: ({ kind, name, entry, port, finding, selected, session, also, live, family, unresolved }) => stack(html`<sett-item kind=${kind} ?entry=${entry} ?port=${port} ?finding=${finding} ?selected=${selected} session=${ifDefined(session)} also=${ifDefined(also)} ?live=${live} family=${ifDefined(family || undefined)} unresolved=${ifDefined(unresolved || undefined)}>${name}</sett-item>`),
};
export default meta;
type Story = StoryObj;

// items live in an area; the stories give them the same width and inset an area does
const stack = (items: unknown, label = '') => html`<div class="sett-paper" style="width:var(--sett-map-size-column);padding:var(--sett-space-2)">${label ? html`<div style="font-size:var(--sett-font-size-xs);color:var(--sett-color-mute);margin-bottom:var(--sett-space-1)">${label}</div>` : ''}${items}</div>`;
const row = (...cols: unknown[]) => html`<div class="sett-row" style="align-items:flex-start;gap:var(--sett-space-4)">${cols}</div>`;

export const Default: Story = {};
export const Kinds: Story = {
  name: 'kinds · eight',
  render: () => stack(ITEM_KINDS.map((k) => html`<sett-item kind=${k}>${{ fn: 'subscribe()', struct: 'NewSubscriber', enum: 'ConfirmationError', trait: 'EmailSender · trait', impl: 'impl PgSubscriberRepo', mod: 'mod routes', macro: 'register_extension!', external: 'sqlx::PgPool' }[k]}</sett-item>`)),
};
export const States: Story = {
  name: 'states · entry · port · finding · selected · family · and together',
  render: () => row(
    stack(html`<sett-item>plain()</sett-item><sett-item entry>health_check()</sett-item><sett-item kind="trait" port>EmailSender · trait</sett-item><sett-item finding>confirm()</sett-item><sett-item selected>subscribe()</sett-item><sett-item kind="trait" port family="214 impls">Element · trait</sett-item>`, 'one at a time'),
    stack(html`<sett-item entry finding>confirm()</sett-item><sett-item entry selected>subscribe()</sett-item><sett-item finding selected>store_token()</sett-item><sett-item kind="external" selected>sqlx::PgPool</sett-item>`, 'together'),
  ),
};
export const Far: Story = {
  name: 'far · unrelated to the focused area · recedes by colour, still readable · a finding and a pin never do',
  render: () => row(
    stack(html`<sett-item>plain()</sett-item><sett-item entry>health_check()</sett-item><sett-item kind="trait" port family="214 impls">Element · trait</sett-item><sett-item kind="external">sqlx::PgPool</sett-item><sett-item unresolved="2">dispatch()</sett-item><sett-item session="yk" live>try_execute_task()</sett-item>`, 'at rest'),
    stack(html`<sett-item far>plain()</sett-item><sett-item far entry>health_check()</sett-item><sett-item far kind="trait" port family="214 impls">Element · trait</sett-item><sett-item far kind="external">sqlx::PgPool</sett-item><sett-item far unresolved="2">dispatch()</sett-item><sett-item far session="yk" live>try_execute_task()</sett-item>`, 'far: mute ink, a faint border; fills and presence stay'),
    stack(html`<sett-item far finding>confirm()</sett-item><sett-item far selected>subscribe()</sett-item><sett-item far lit>store_token()</sett-item>`, 'far, but a finding · a pin · lit by a pointed link'),
  ),
};
export const Unresolved: Story = {
  name: 'unresolved · links the analyser could not follow fold to one pill · on every fill · beside a family pill',
  render: () => row(
    stack(html`<sett-item>plain()</sett-item><sett-item unresolved="1">spawn_worker()</sett-item><sett-item unresolved="12">dispatch()</sett-item>`, 'none · one · many'),
    stack(html`<sett-item entry unresolved="2">publish_newsletter()</sett-item><sett-item kind="trait" port unresolved="3">EmailSender · trait</sett-item><sett-item finding unresolved="1">confirm()</sett-item><sett-item kind="external" unresolved="1">sqlx::PgPool</sett-item><sett-item selected unresolved="4">subscribe()</sett-item><sett-item session="yk" live unresolved="2">try_execute_task()</sett-item>`, 'entry · port · finding · external · selected · live'),
    stack(html`<sett-item kind="trait" port family="214 impls">Element · trait</sett-item><sett-item kind="trait" port family="214 impls" unresolved="3">Element · trait</sett-item><sett-item unresolved="3">get_subscriber_id_from_token()</sett-item>`, 'family alone · family and unresolved · a long name'),
  ),
};
export const LongNames: Story = {
  name: 'long names · ellipsis, the pill is never squeezed',
  render: () => stack(html`<sett-item>get_subscriber_id_from_token()</sett-item><sett-item entry>publish_newsletter_form()</sett-item><sett-item kind="trait" port family="214 impls">RenderOnceElementWithAVeryLongName</sett-item>`),
};
export const Sessions: Story = {
  name: 'sessions · touched earlier (still ring) vs working now (breathes, sheen)',
  render: () => row(
    stack(sessionOrder.slice(0, 4).map((s) => html`<sett-item session=${s}>touched by ${s}</sett-item>`), 'touched earlier'),
    stack(sessionOrder.slice(0, 4).map((s) => html`<sett-item session=${s} live>live · ${s}</sett-item>`), 'working now'),
    stack(html`<sett-item entry session="yk" live>subscribe()</sett-item><sett-item entry finding session="tl" live>confirm()</sett-item><sett-item kind="trait" port session="mg" live>EmailSender · trait</sett-item>`, 'the item keeps its own colour'),
  ),
};
export const Collisions: Story = {
  name: 'collisions · selected and live · two agents on one item',
  render: () => row(
    stack(html`<sett-item entry selected session="yk" live>subscribe()</sett-item>`, 'your selection tight, the agent one step out'),
    stack(html`<sett-item entry finding session="yk" also="tl" live>confirm()</sett-item>`, 'two agents: one ring, split'),
    stack(html`<sett-item selected session="tl">store_token()</sett-item>`, 'selected and touched earlier'),
  ),
};
