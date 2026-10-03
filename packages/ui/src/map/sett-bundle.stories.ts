import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import './sett-bundle.js';
import './sett-link.js';
import './sett-sheet.js';
import './sett-column.js';
import './sett-area.js';
import './sett-item.js';
import type { BundleBranch, BundleOrigin } from './sett-bundle.js';
import { BUNDLE_ORIGINS } from './sett-bundle.js';

/**
 * The one line leaving an area at the areas level. The sheet draws it and
 * hands it its geometry; here it is given by hand, on a plain stage.
 */
const meta: Meta = { title: 'map/bundle', component: 'sett-bundle' };
export default meta;
type Story = StoryObj;

const stage = (body: unknown, h = 150) => html`<div style="position:relative;width:calc(var(--sett-map-size-column) * 2);height:${h}px;background:var(--sett-color-paper);border:var(--sett-stroke-hair) solid var(--sett-color-line2);border-radius:var(--sett-radius-node)">${body}</div>`;
const one: BundleBranch[] = [{ to: 'domain', name: 'domain', count: 3, shared: [], own: [{ x: 30, y: 40 }, { x: 150, y: 40 }, { x: 150, y: 110 }, { x: 300, y: 110 }] }];
const tree = (extra: Partial<BundleBranch> = {}, second: Partial<BundleBranch> = {}): BundleBranch[] => [
  { to: 'domain', name: 'domain', count: 3, shared: [{ x: 30, y: 30 }, { x: 150, y: 30 }, { x: 150, y: 70 }], own: [{ x: 150, y: 70 }, { x: 300, y: 70 }], ...extra },
  { to: 'auth', name: 'authentication', count: 2, shared: [{ x: 30, y: 30 }, { x: 150, y: 30 }, { x: 150, y: 70 }], own: [{ x: 150, y: 70 }, { x: 150, y: 120 }, { x: 300, y: 120 }], ...second },
];
const bundle = (branches: BundleBranch[], origin?: BundleOrigin, far = false) => html`<sett-bundle from="routes" name="routes" origin=${ifDefined(origin)} ?far=${far} .branches=${branches}></sett-bundle>`;

export const Default: Story = { name: 'a double line · three links between two areas, one arrow', render: () => stage(bundle(one, 'driving')) };
export const Origins: Story = {
  name: 'origin · the inside says the column it leaves · driving · domain · driven · a rail has none',
  render: () => html`<div style="display:grid;gap:var(--sett-space-3)">${[...BUNDLE_ORIGINS, undefined].map((o) => stage(bundle(one, o)))}</div>`,
};
export const Junction: Story = { name: 'a branch · opens like a pipe junction, no dot · point at an arrow end, or at the shared stretch', render: () => stage(bundle(tree(), 'driving')) };
export const SingleLeaving: Story = {
  name: 'a single link leaves a double line with a small dot (the link draws itself)',
  render: () => stage(html`${bundle([tree()[0], { ...tree()[1], count: 1 }], 'domain')}
    <sett-link style="pointer-events:none" kind="calls" .route=${{ points: tree()[1].own, branches: [tree()[1].own[0]], backward: false }}></sett-link>`),
};
export const Lit: Story = { name: 'lit · an area at one end is pointed at · blue edges, sel-bg inside', render: () => stage(bundle(tree({ lit: true }), 'driving')) };
export const Far: Story = { name: 'far · something else is pinned', render: () => stage(bundle(tree(), 'driving', true)) };
export const FilteredBranch: Story = { name: 'far · one branch carries nothing the filter keeps', render: () => stage(bundle(tree({}, { far: true }), 'driving')) };
export const Backward: Story = { name: 'backward · a pair pointing right to left is a smell', render: () => stage(bundle([{ ...one[0], backward: true, own: [...one[0].own].reverse() }], 'driven')) };
export const Crossing: Story = {
  name: 'crossing · one double line passes cleanly over another',
  render: () => stage(html`${bundle(one, 'driving')}${bundle([{ to: 'email', name: 'email', count: 4, shared: [], own: [{ x: 30, y: 110 }, { x: 110, y: 110 }, { x: 110, y: 60 }, { x: 300, y: 60 }] }], 'driven')}`),
};
export const Opened: Story = {
  name: 'opened by hand · the pair is no longer drawn, the other keeps its place · Tab reaches it to close it',
  render: () => stage(bundle([{ ...tree()[0], shared: [], own: [...tree()[0].shared, tree()[0].own[1]], open: true }, { ...tree()[1], shared: [], own: [...tree()[1].shared, ...tree()[1].own.slice(1)] }], 'driving')),
};
