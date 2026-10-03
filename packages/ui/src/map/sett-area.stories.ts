import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { insideOf, itemKindOf } from './fixtures.js';
import { areaEl, itemEl, ripgrep, zed, zero2prod } from './map-fixtures.stories-helpers.js';

const meta: Meta = {
  title: 'map/area',
  component: 'sett-area',
  args: { name: 'routes · public', folded: false },
  render: ({ name, folded }) => holder(html`<sett-area name=${name} ?folded=${folded}><sett-item entry>health_check()</sett-item><sett-item entry>subscribe()</sett-item><sett-item entry finding>confirm()</sett-item></sett-area>`),
};
export default meta;
type Story = StoryObj;

const holder = (a: unknown, label = '') => html`<div style="width:calc(var(--sett-map-size-column) - var(--sett-space-2) * 2)">${label ? html`<div style="font-size:var(--sett-font-size-xs);color:var(--sett-color-mute);margin-bottom:var(--sett-space-1)">${label}</div>` : ''}${a}</div>`;
const row = (...cols: unknown[]) => html`<div class="sett-row" style="align-items:flex-start;gap:var(--sett-space-4)">${cols}</div>`;
const area = (f: typeof zero2prod, unit: string, id: string) => insideOf(f, unit).flatMap((c) => c.areas).find((a) => a.id === id)!;
const routes = area(zero2prod, 'api', 'routes');

export const Default: Story = {};
export const ExpandedAndFolded: Story = {
  name: 'expanded · folded · api, rg, gpui',
  render: () => row(
    holder(areaEl(routes), 'api · routes · public'), holder(areaEl(routes, {}, true), 'folded'),
    holder(areaEl(area(ripgrep, 'rg', 'flags')), 'rg · flags'), holder(areaEl(area(zed, 'gpui', 'els')), 'gpui · elements'),
  ),
};
export const HeaderBadges: Story = {
  name: 'header · count · findings · one dot per session',
  render: () => row(
    holder(areaEl(routes, { subscribe: { session: 'yk', live: true }, confirm: { session: 'tl' }, login: { session: 'mg', live: true } }), 'open: the items carry the life, the dots are still'),
    holder(areaEl(routes, { subscribe: { session: 'yk', live: true }, confirm: { session: 'tl' }, login: { session: 'mg', live: true } }, true), 'folded: live sessions breathe in the header'),
  ),
};
export const FoldedHidesSelection: Story = {
  name: 'folded · a blue count for the selection it hides',
  render: () => row(
    holder(areaEl(routes, { subscribe: { selected: true } }), 'open'),
    holder(areaEl(routes, { subscribe: { selected: true }, confirm: { session: 'tl', live: true } }, true), 'folded'),
  ),
};
export const Overrides: Story = {
  name: 'overrides · numbers for a folded area whose items are not rendered',
  render: () => holder(html`<sett-area name="elements" folded count="214" findings="3" sessions="yk mg"></sett-area>`),
};
export const HeaderControls: Story = {
  name: 'header · two controls · the name focuses, the arrow folds',
  render: () => row(
    holder(areaEl(routes), 'at rest: Tab reaches the name, then the arrow; each takes its own ring'),
    holder(html`<sett-area key="routes" name=${routes.name} focused>${routes.items.map((it) => itemEl(it))}</sett-area>`, 'focused: the sheet set it after the name was used'),
    holder(html`<sett-area key="routes" name=${routes.name} focused folded>${routes.items.map((it) => itemEl(it))}</sett-area>`, 'focused · folded'),
  ),
};
export const Far: Story = {
  name: 'far · unrelated to the focus · recedes by colour, the red count stays',
  render: () => row(
    holder(areaEl(routes), 'at rest'),
    holder(html`<sett-area key="routes" name=${routes.name} far>${routes.items.map((it) => html`<sett-item key=${it.id} kind=${itemKindOf(it)} ?entry=${!!it.entry} ?finding=${!!it.finding} far>${it.name}</sett-item>`)}</sett-area>`, 'far: mute ink, a faint border; the finding keeps its ink'),
    holder(html`<sett-area key="routes" name=${routes.name} far folded>${routes.items.map((it) => itemEl(it))}</sett-area>`, 'far · folded'),
  ),
};
export const Empty: Story = { name: 'empty', render: () => holder(html`<sett-area name="adapters"></sett-area>`) };
