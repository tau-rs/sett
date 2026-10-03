import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import type { Fixture, FixtureCode } from './fixtures.js';
import { ripgrep, zed, zero2prod } from './map-fixtures.stories-helpers.js';
import editorCss from '../editor/editor.css?raw';
import './sett-code-page.js';
import '../tabs/sett-tabs.js';

/**
 * The code of an item, on the three fixtures. The page is the head and the
 * portals; the body is the host's editor (Theia) or, with nothing slotted,
 * a read-only listing. It opens in a tab of `sett-tabbar`, the map pinned
 * first (rule 11), by double-click or ↩ only (map rule 4).
 */
const meta: Meta = {
  title: 'map/code page',
  component: 'sett-code-page',
  args: { file: 'src/routes/subscriptions.rs', line: 61, unit: 'api' },
  render: ({ file, line, unit }) => frame(html`<sett-code-page file=${file} line=${line} unit=${unit} .lines=${zero2prod.code.subscribe.lines} .callers=${zero2prod.code.subscribe.callers} .calls=${zero2prod.code.subscribe.calls}></sett-code-page>`),
};
export default meta;
type Story = StoryObj;

const frame = (p: unknown, label = '') => html`<div style="width:calc(var(--sett-map-size-card-open) - var(--sett-space-6))">${label ? html`<div style="font-size:var(--sett-font-size-xs);color:var(--sett-color-mute);margin-bottom:var(--sett-space-1)">${label}</div>` : ''}<div style="border:var(--sett-stroke-hair) solid var(--sett-color-line2);border-radius:var(--sett-map-radius-code);overflow:hidden">${p}</div></div>`;
const stack = (...rows: unknown[]) => html`<div style="display:flex;flex-direction:column;gap:var(--sett-space-4)">${rows}</div>`;
const pageOf = (c: FixtureCode, body: unknown = '') => html`<sett-code-page file=${c.file} line=${c.line} unit=${c.unit} .lines=${c.lines} .callers=${c.callers} .calls=${c.calls}>${body}</sett-code-page>`;
const of = (f: Fixture, id: string) => frame(pageOf(f.code[id]), `${f.name} · ${id}`);

export const Default: Story = {};
export const Highlighted: Story = { name: 'highlighted · the item\'s own span on the line tint, its context plain · zed', render: () => of(zed, 'window') };
export const BadLine: Story = { name: 'bad line · a finding: tinted, ⚠ in the gutter · zero2prod, zed', render: () => stack(of(zero2prod, 'publish_pub'), of(zed, 'entity')) };
export const Portals: Story = { name: 'portals · callers and calls lead to the item at the other end · ripgrep run()', render: () => of(ripgrep, 'run') };
export const NoCallers: Story = { name: 'portals · an entry point has no callers: the side says none · ripgrep main()', render: () => of(ripgrep, 'main') };
export const Fixtures: Story = { name: 'the three fixtures · ripgrep, zero2prod, zed', render: () => stack(of(ripgrep, 'spath'), of(zero2prod, 'confirm'), of(zed, 'window')) };
export const LongLine: Story = { name: 'a long line scrolls the body, never the head · zero2prod subscribe()', render: () => html`<div style="width:calc(var(--sett-map-size-panel) * 1.5)">${of(zero2prod, 'subscribe')}</div>` };
export const InATab: Story = {
  name: 'in a tab · the map pinned first, the file tab in mono (rule 11)',
  render: () => frame(html`<sett-tabbar><sett-tab pinned>map</sett-tab><sett-tab mono active scope="you">subscriptions.rs</sett-tab></sett-tabbar>${pageOf(zero2prod.code.subscribe)}`),
};
const editorStyle = () => { const el = document.createElement('style'); el.textContent = editorCss; return el; };
// a stand-in for Theia's editor: plain DOM marked with the decoration classes of editor.css
const hostEditor = (c: FixtureCode) => html`${editorStyle()}<div style="font-family:var(--sett-font-mono);font-size:var(--sett-font-size-md);line-height:var(--sett-font-line-height-code);padding:var(--sett-space-1) 0">${c.lines.map(([n, text, state]) => html`<div class=${state === 'bad' ? 'sett-ed-line--bad' : state === 'hl' ? 'sett-ed-line' : ''} style="display:flex;white-space:pre"><span class="sett-gutter-glyph ${state === 'bad' ? 'sett-gutter-glyph--finding' : ''}"></span><span style="width:var(--sett-space-6);margin-right:var(--sett-space-3);text-align:right;color:var(--sett-color-ink2)">${n}</span><span class=${state === 'bad' ? 'sett-span-finding' : ''}>${text}</span></div>`)}</div>`;
export const HostEditor: Story = {
  name: 'the host\'s editor in the body · the line states are editor.css decoration classes (rule 12)',
  render: () => frame(pageOf(zed.code.entity, hostEditor(zed.code.entity)), 'a stand-in for Theia\'s editor, slotted'),
};
