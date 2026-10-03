import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';
import { base } from '@tau-rs/sett-tokens';
import type { Fixture } from './fixtures.js';
import { boardRects, node, ripgrep, sheetRects, zed, zero2prod } from './map-fixtures.stories-helpers.js';
import './sett-panel.js';
import './sett-position.js';
import './sett-minimap.js';
import './sett-crumb.js';
import './sett-back.js';
import './sett-cue.js';
import type { MinimapBox, MinimapRect } from './sett-minimap.js';

/**
 * The map's chrome, docked (map rule 8): one strip on top of the map's pane
 * (back, crumb, cue) and the panel on its right (status line, position,
 * minimap). Nothing sits over the drawing. The board under it is only a
 * stand-in here: the camera is the host's.
 */
const meta: Meta = { title: 'map/chrome', parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

type Place = [name: string, level: string];
interface Scene {
  fixture: Fixture; places: Place[]; back?: string; status?: string;
  /** the map exceeds the viewport: the host shows the minimap (MAP-13) */
  minimap?: { mode: 'board' | 'sheet'; name: string; rects: MinimapRect[]; view: MinimapBox };
  cue?: { value: number; label: string };
}
const T = base.map.threshold;
const strip = 'display:flex;align-items:center;gap:var(--sett-space-2);flex:none;box-sizing:border-box;height:var(--sett-map-size-tabs);padding:0 var(--sett-space-3);border-bottom:var(--sett-stroke-hair) solid var(--sett-color-line2);background:var(--sett-color-paper)';
const board = 'display:flex;flex-wrap:wrap;align-content:flex-start;gap:var(--sett-space-6);flex:1;min-height:0;overflow:hidden;padding:var(--sett-space-5)';
/** the units of the fixture's own repo; the neighbour repos are ghosts, another lane's */
const units = (f: Fixture) => Object.values(f.repos)[0].units;

const chrome = (s: Scene) => html`
  <div style="display:flex;height:calc(var(--sett-map-size-minimap-h) * 4);border-bottom:var(--sett-stroke-hair) solid var(--sett-color-line2)">
    <div style="display:flex;flex-direction:column;flex:1;min-width:0">
      <div style=${strip}>
        ${s.back ? html`<sett-back hint="esc">${s.back}</sett-back>` : nothing}
        <sett-crumb .steps=${s.places.map(([name]) => name)}></sett-crumb>
        ${s.cue ? html`<span style="margin-left:auto"></span><sett-cue value=${s.cue.value} from=${parseFloat(T.cue)} threshold=${parseFloat(T.card)}>${s.cue.label}</sett-cue>` : nothing}
      </div>
      <div style=${board}>${units(s.fixture).map((u) => node(s.fixture, u.id, 'chip', { selected: s.places[1]?.[0] === u.id }))}</div>
    </div>
    <sett-panel status=${s.status ?? ''}>
      <sett-position>${s.places.map(([name, level], i) => html`<sett-position-row key=${name} level=${level} ?current=${i === s.places.length - 1}>${name}</sett-position-row>`)}</sett-position>
      ${s.minimap ? html`<sett-minimap slot="foot" mode=${s.minimap.mode} .rects=${s.minimap.rects} .view=${s.minimap.view}>${s.minimap.name}</sett-minimap>` : nothing}
    </sett-panel>
  </div>`;

export const Fits: Story = {
  name: 'zero2prod · the map fits the viewport: no minimap, no back at the top level',
  render: () => chrome({ fixture: zero2prod, places: [['zero2prod', 'board']] }),
};
export const Exceeds: Story = {
  name: 'zed · the map exceeds the viewport: the minimap is in the panel\'s foot',
  render: () => chrome({ fixture: zed, places: [['zed', 'board'], ['gpui', 'unit']], back: 'zed', status: 'fitted · 9 units', minimap: { mode: 'board', name: 'zed', rects: boardRects(zed, 'gpui'), view: { x: 20, y: 80, w: 760, h: 420 } } }),
};
export const InsideAUnit: Story = {
  name: 'ripgrep · inside rg: back, the crumb down to an area, the cue, the sheet on the minimap',
  render: () => chrome({ fixture: ripgrep, places: [['ripgrep', 'board'], ['rg', 'unit'], ['flags', 'area']], back: 'rg', cue: { value: 700, label: 'keep zooming · sheet' }, minimap: { mode: 'sheet', name: 'rg', rects: sheetRects(ripgrep, 'rg', 'flags'), view: { x: 0, y: 0, w: 520, h: 300 } } }),
};
