import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { opsOf } from './fixtures.js';
import { opRow, ripgrep, zed, zero2prod } from './map-fixtures.stories-helpers.js';

const KINDS = ['route', 'rpc', 'schema', 'table', 'flag', 'text', 'more'] as const;

const meta: Meta = {
  title: 'map/op row',
  component: 'sett-op-row',
  args: { kind: 'route', method: 'POST', path: '/subscriptions', returns: '200', handler: '', selected: false },
  argTypes: { kind: { control: 'select', options: KINDS }, method: { control: 'select', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] } },
  render: ({ kind, method, path, returns, handler, selected }) => html`<div class="sett-paper" style="width:var(--sett-map-size-rail)"><sett-op-row kind=${kind} method=${method} path=${path} returns=${returns} handler=${handler} ?selected=${selected} count="3">text</sett-op-row></div>`,
};
export default meta;
type Story = StoryObj;

const paper = (rows: unknown) => html`<div class="sett-paper" style="width:var(--sett-map-size-rail)">${rows}</div>`;
export const Default: Story = {};
export const Routes: Story = {
  name: 'route · five methods · return vs → handler · selected',
  render: () => paper(html`
    ${['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => html`<sett-op-row kind="route" method=${m} path=${`/subscriptions${m === 'GET' ? '' : '/:id'}`} returns=${m === 'GET' ? 'html' : '303'}></sett-op-row>`)}
    <sett-op-row kind="route" method="POST" path="/subscriptions" handler="subscribe"></sett-op-row>
    <sett-op-row kind="route" method="GET" path="/health_check" returns="200" selected></sett-op-row>`),
};
export const Kinds: Story = {
  name: 'kinds · rpc, schema, table, flag, text, more · from the fixtures',
  render: () => paper(html`
    ${opsOf(ripgrep, 'matcher.pub').slice(0, 2).map((o) => opRow(o))}
    ${opsOf(zero2prod, 'z2p.queue').slice(0, 2).map((o) => opRow(o))}
    ${opsOf(zero2prod, 'z2p.pg').slice(0, 2).map((o) => opRow(o))}
    ${opsOf(ripgrep, 'rg.cli').slice(0, 2).map((o) => opRow(o))}
    ${opsOf(zed, 'zed.proto').slice(0, 2).map((o) => opRow(o))}
    <sett-op-row kind="more" count="178"></sett-op-row>`),
};
export const AllFixtures: Story = {
  name: 'in context · every contract of api, as op rows',
  render: () => html`<div class="sett-row" style="align-items:flex-start">${Object.keys(zero2prod.contracts).map((c) => paper(html`<div style="font-family:var(--sett-font-mono);font-size:var(--sett-font-size-xs);color:var(--sett-color-mute);margin-bottom:var(--sett-space-1)">${c} · ${zero2prod.contracts[c].kind}</div>${opsOf(zero2prod, c).map((o) => opRow(o))}`))}</div>`,
};
