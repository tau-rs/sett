import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { opsOf, unitPorts } from './fixtures.js';
import { PORT_KINDS } from './sett-port-row.js';
import { opRow, portRow, ripgrep, zero2prod } from './map-fixtures.stories-helpers.js';

const meta: Meta = {
  title: 'map/port row',
  component: 'sett-port-row',
  args: { kind: 'http', name: 'routes', count: '12', side: 'exposes', compact: false, selected: false },
  argTypes: { kind: { control: 'select', options: PORT_KINDS }, side: { control: 'select', options: ['exposes', 'needs'] } },
  render: ({ kind, name, count, side, compact, selected }) => html`<div class="sett-paper" style="width:var(--sett-map-size-rail)"><sett-port-row kind=${kind} name=${name} count=${count} side=${side} ?compact=${compact} ?selected=${selected}></sett-port-row></div>`,
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
const paper = (rows: unknown) => html`<div class="sett-paper" style="width:var(--sett-map-size-rail)">${rows}</div>`;
export const Kinds: Story = {
  name: 'kinds · eleven, dot colour = kind · both sides',
  render: () => html`<div class="sett-row" style="align-items:flex-start">
    ${paper(PORT_KINDS.map((k) => html`<sett-port-row kind=${k} name=${k === 'declared' ? 'zed.dev · unverified' : `${k} port`} count="3" side="exposes"></sett-port-row>`))}
    ${paper(PORT_KINDS.map((k) => html`<sett-port-row kind=${k} name=${k === 'declared' ? 'zed.dev · unverified' : `${k} port`} count="3" side="needs"></sett-port-row>`))}
  </div>`,
};
export const States: Story = {
  name: 'states · selected · compact · both sides · api',
  render: () => {
    const { exposes, needs } = unitPorts(zero2prod, 'api');
    return html`<div class="sett-row" style="align-items:flex-start">
      ${paper([...exposes, ...needs].map((p, i) => portRow(p, { selected: i === 1 })))}
      ${paper([...exposes, ...needs].map((p, i) => portRow(p, { compact: true, selected: i === 1 })))}
    </div>`;
  },
};
export const WithOps: Story = {
  name: 'with ops · folded past six with … n more · rg cli flags, api routes',
  render: () => {
    const rg = unitPorts(ripgrep, 'rg').exposes[0];
    const api = unitPorts(zero2prod, 'api').exposes[0];
    return html`<div class="sett-row" style="align-items:flex-start">
      ${paper(portRow(rg, { format: ripgrep.contracts[rg.contract]?.format }, opsOf(ripgrep, rg.contract).map((o) => opRow(o))))}
      ${paper(portRow(api, { format: zero2prod.contracts[api.contract]?.format }, opsOf(zero2prod, api.contract).map((o, i) => opRow(o, i === 1))))}
    </div>`;
  },
};
export const Expanded: Story = {
  name: 'with ops · expanded',
  render: () => {
    const api = unitPorts(zero2prod, 'api').exposes[0];
    return paper(html`<sett-port-row kind=${api.kind} name=${api.name} count=${api.count ?? ''} expanded>${opsOf(zero2prod, api.contract).map((o) => opRow(o))}</sett-port-row>`);
  },
};
