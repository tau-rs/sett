import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-ask.js';
import './sett-inspector.js';
import '../thread/sett-thread.js';
import '../tag/sett-tag.js';

const W = 'var(--sett-size-shell-inspector)';
const H = 'calc(var(--sett-space-6) * 22)';
const pane = (inner: unknown) => html`<div style="width:${W};height:${H};display:flex;border:var(--sett-stroke-hair) solid var(--sett-color-line);border-radius:var(--sett-radius-card);overflow:hidden">${inner}</div>`;
const inspector = (inner: unknown, sub = 'about main · OrderRepo selected') => html`<sett-inspector heading="ask" sub=${sub} state="esc" kind="framer" style="flex:1">${inner}<sett-composer slot="composer" placeholder="follow-up…"></sett-composer></sett-inspector>`;

const answered = html`<sett-ask witnesses="service.rs:14 ports.rs:6 pg.rs:14">
  <span slot="question">where does a shipment get persisted, and through what?</span>
  <sett-tool slot="ran">ran entry
ran path ship() → postgres
ran why OrderRepo::save</sett-tool>
  <sett-msg slot="answer" from="agent" author="answer · 3 witnesses">A shipment is persisted through the port <sett-tag mono>OrderRepo</sett-tag>, implemented by <sett-tag mono>PgOrderRepo</sett-tag>, called from <sett-tag mono>ship()</sett-tag> after the domain transition. No path bypasses the port on main.</sett-msg>
</sett-ask>`;
const judged = html`<sett-ask witnesses="service.rs:14 rules:3">
  <span slot="question">is it fine for ship() to write the audit log straight to postgres?</span>
  <sett-tool slot="ran">ran path ship() → postgres
ran rules api → store</sett-tool>
  <sett-msg slot="answer" from="agent" author="answer · 2 witnesses">ship() in <sett-tag mono>api</sett-tag> would reach <sett-tag mono>postgres</sett-tag> without a port; the rule <sett-tag mono>api → store</sett-tag> forbids it. Below is a judgement, not a fact.</sett-msg>
  <span slot="judgement">not fine as drawn: the write belongs behind <sett-tag mono>OrderRepo</sett-tag> or a new <sett-tag mono>AuditLog</sett-tag> port. Two facts it stands on, each with a hand to give:</span>
  <sett-resolve-row slot="judgement" source="rules:3">api must not depend on store · blocks</sett-resolve-row>
  <sett-resolve-row slot="judgement" source="service.rs:14">ship() → PgOrderRepo::save is the only path today</sett-resolve-row>
</sett-ask>`;
const cant = html`<sett-ask nearest="path ship() → postgres | why OrderRepo::save | reach OrderRepo">
  <span slot="question">how many requests per second does ship() take in production?</span>
  <sett-tool slot="ran">ran entry
ran path ship() → postgres</sett-tool>
  <span slot="cant">arch has no runtime facts: the map knows paths, callers and contracts, not load. The nearest things it can answer:</span>
</sett-ask>`;

const meta: Meta = { title: 'shell/ask', component: 'sett-ask' };
export default meta;
type Story = StoryObj;

export const Answered: Story = { name: 'ask · question, ran, answer with items as tags and witnesses as links, make it so', render: () => pane(inspector(answered)) };
export const Judgement: Story = { name: 'ask · a judgement labelled with facts and resolve rows', render: () => pane(inspector(judged)) };
export const CantCompute: Story = { name: "ask · can't compute, the nearest queries as links", render: () => pane(inspector(cant)) };
export const Alone: Story = { name: 'ask alone · no inspector, no composer', render: () => html`<div style="width:${W};background:var(--sett-color-paper);border:var(--sett-stroke-hair) solid var(--sett-color-line2);border-radius:var(--sett-radius-card)">${answered}</div>` };
