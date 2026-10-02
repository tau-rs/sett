import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { sessionOrder } from '@tau-rs/sett-tokens';
import './sett-chip.js';

const KINDS = ['git', 'agent', 'finding', 'review', 'pipeline', 'tree'] as const;
const STATES = ['normal', 'blocking', 'waiting', 'done'] as const;
// a group's gate has one verb, open; its words are the gate's in DESIGN.md rule 7: running · failed n/m · waiting · done
const GATE = 'group 1 → group 2';
// your own work, found by the watcher (spec §4): the git chip of a `you` session; the doors are delegate the rest · commit

const facts: Record<string, Record<string, string>> = {
  git: { normal: 'behind main|· 2', blocking: 'conflict in|pg.rs', waiting: 'rebase running|', done: 'updated to main|' },
  agent: { normal: 'Yokohama|· 3/6', blocking: 'Yokohama deviated|', waiting: 'Yokohama asks|· 2', done: 'Yokohama done|· 6/6' },
  finding: { normal: '2 remarks|', blocking: 'rule|no-http-in-domain', waiting: 'fix running|', done: 'fixed|' },
  review: { normal: '2 remarks open|', blocking: 'changes requested|', waiting: 'review requested|', done: 'approved|' },
  pipeline: { normal: 'passed|', blocking: 'tests failed|· 3', waiting: 'running|· 2/5', done: 'passed|· 5/5' },
  tree: { normal: '1 uncommitted|', blocking: 'map edits · 4|· not kept', waiting: '2 files editing|', done: 'committed|' },
  gate: { normal: `${GATE} · judge running|`, blocking: `${GATE}|· failed 1/2`, waiting: `${GATE} · waiting|`, done: `${GATE} · done|` },
  detected: { normal: 'changes detected|· 3 files', blocking: 'changes collide with w1|· pool.rs', waiting: 'commit drafted|· 3 files', done: 'committed|· 3 files' },
};
const verbs: Record<string, [string, string, string?]> = {
  gate: ['', '', 'open'],
  detected: ['delegate the rest', 'commit'],
  git: ['with Yokohama', 'update myself'], agent: ['follow', 'take over'], finding: ['with Yokohama', 'fix myself', 'allow'],
  review: ['with Yokohama', 'address myself', 'send back'], pipeline: ['fix with Yokohama', 'open log', 'rerun'], tree: ['with Yokohama', 'commit', 'discard'],
};
const chip = (kind: string, state: string, extra = {}) => {
  const [fact, count] = facts[kind][state].split('|');
  const [agent, manual, more] = verbs[kind];
  const { session, meFirst } = extra as { session?: string; meFirst?: boolean };
  return html`<sett-chip kind=${kind} state=${state} session=${session ?? ''} ?me-first=${meFirst}>${fact}${count ? html`<span slot="count">${count}</span>` : ''}${agent ? html`<a slot="agent">${agent}</a>` : ''}${manual ? html`<a slot="manual">${manual}</a>` : ''}${more ? html`<a slot="verb">${more}</a>` : ''}</sett-chip>`;
};

const meta: Meta = {
  title: 'primitives/chip',
  component: 'sett-chip',
  args: { kind: 'git', state: 'normal', meFirst: false },
  argTypes: {
    kind: { control: 'select', options: [...KINDS, 'gate', 'detected'] },
    state: { control: 'select', options: STATES },
    session: { control: 'select', options: sessionOrder },
  },
  render: ({ kind, state, session, meFirst }) => chip(kind, state, { session, meFirst }),
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
const perKind = (kind: string): Story => ({ name: `kind · ${kind} · four states`, render: () => html`<div class="sett-row">${STATES.map((s) => chip(kind, s))}</div>` });
export const Git = perKind('git');
export const Agent = perKind('agent');
export const Finding = perKind('finding');
export const Review = perKind('review');
export const Pipeline = perKind('pipeline');
export const Tree = perKind('tree');
export const GateRunning: Story = {
  name: "kind · gate · running, in the session's colour, verb open",
  render: () => html`<div class="sett-row">${chip('gate', 'normal', { session: 'yk' })}${chip('gate', 'normal', { session: 'tl' })}</div>`,
};
export const GateFailed: Story = { name: 'kind · gate · failed n/m, blocking', render: () => chip('gate', 'blocking', { session: 'yk' }) };
export const Detected: Story = { name: 'kind · detected · your own work, found by the watcher · four states', render: () => html`<div class="sett-row">${STATES.map((s) => chip('detected', s))}</div>` };
export const DetectedInBar: Story = {
  name: 'in context · a you session: the detected chip beside the agent chip',
  render: () => html`<div class="sett-paper sett-row"><span style="font-family:var(--sett-font-mono);font-weight:var(--sett-font-weight-medium)">you · fix-pool-size</span>${chip('detected', 'normal')}${chip('agent', 'normal')}${chip('git', 'normal')}</div>`,
};
const perState = (state: string): Story => ({ name: `state · ${state} · six kinds`, render: () => html`<div class="sett-row">${KINDS.map((k) => chip(k, state))}</div>` });
export const Normal = perState('normal');
export const Blocking = perState('blocking');
export const Waiting = perState('waiting');
export const Done = perState('done');
export const OtherSession: Story = {
  name: "agent · another session's colour",
  render: () => html`<div class="sett-row">${chip('agent', 'normal', { session: 'tl' })}${chip('agent', 'waiting', { session: 'mg' })}${chip('agent', 'blocking', { session: 'cy' })}</div>`,
};
export const MeFirst: Story = {
  name: 'me first · manual door first and bold',
  render: () => html`<div class="sett-row">${chip('git', 'normal', { meFirst: true })}${chip('finding', 'blocking', { meFirst: true })}</div>`,
};
export const ActionsStrip: Story = {
  name: 'in context · actions strip',
  render: () => html`<div class="sett-paper sett-row"><span style="font-family:var(--sett-font-mono);font-weight:var(--sett-font-weight-medium)">feat/refund</span>${chip('agent', 'normal')}${chip('git', 'normal')}${chip('finding', 'blocking')}${chip('git', 'done')}</div>`,
};
