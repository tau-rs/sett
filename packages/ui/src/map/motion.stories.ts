import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sett-item.js';
import './sett-area.js';
import './sett-column.js';
import './sett-sheet.js';
import './sett-link.js';
import type { SettItem } from './sett-item.js';

/**
 * DESIGN.md § Motion, one motion per story. The application only says which
 * agent is live where; every pulse below is the element animating itself.
 * Names never move, fade or resize.
 */
const meta: Meta = { title: 'map/motion' };
export default meta;
type Story = StoryObj;

const scene = (body: unknown, note: string, actions: unknown = '') => html`
  <div data-scene style="display:flex;flex-direction:column;gap:var(--sett-space-3);align-items:flex-start">
    <p style="margin:0;max-width:60ch;color:var(--sett-color-ink2)">${note}</p>
    <div style="display:flex;gap:var(--sett-space-2)">${actions}</div>
    <div style="display:flex;gap:var(--sett-map-size-column-gutter);align-items:flex-start;padding:var(--sett-space-4)">${body}</div>
  </div>`;
const act = (label: string, run: (root: HTMLElement) => void) => html`<button style="font:inherit;color:var(--sett-color-sel);background:var(--sett-color-paper);border:var(--sett-stroke-hair) solid var(--sett-color-line);border-radius:var(--sett-radius-chip);padding:var(--sett-space-1) var(--sett-space-2);cursor:pointer" @click=${(e: Event) => run((e.currentTarget as HTMLElement).closest('[data-scene]') as HTMLElement)}>${label}</button>`;
const box = (a: unknown) => html`<div style="width:calc(var(--sett-map-size-column) - var(--sett-space-2) * 2)">${a}</div>`;
const item = (root: HTMLElement, id: string) => root.querySelector(`[data-id="${id}"]`) as SettItem;
/** the whole choreography of a move: say who is live where; the elements do the rest */
const move = (root: HTMLElement, session: string, ids: [string, string]) => {
  const [a, b] = ids.map((id) => item(root, id));
  const from = a.live ? a : b, to = a.live ? b : a;
  from.live = false;
  to.session = session as SettItem['session'];
  to.live = true;
};

export const AnAgentIsHere: Story = {
  name: '1 · presence · an agent is here',
  render: () => scene(box(html`<sett-area name="routes · public"><sett-item entry>health_check()</sett-item><sett-item entry session="yk" live>subscribe()</sett-item><sett-item entry finding session="tl">confirm()</sett-item></sett-area>`),
    'The ring breathes and a soft sheen in the agent\'s colour sweeps across the item: Yokohama is working on subscribe() right now. confirm() was touched earlier by Taipei: a thin still ring.'),
};
export const TheAgentMovesOn: Story = {
  name: '2 · event · the agent moves on (a jump, as a pulse)',
  render: () => scene(box(html`<sett-area name="routes · public"><sett-item data-id="health" entry>health_check()</sett-item><sett-item data-id="subscribe" entry>subscribe()</sett-item><sett-item data-id="confirm" entry finding>confirm()</sett-item><sett-item data-id="getid">get_subscriber_id_from_token()</sett-item><sett-item data-id="store" session="tl" live>store_token()</sett-item></sett-area>`),
    'Nothing crosses the space between. The item it leaves swallows a wave and cools to a thin still ring; the item it reaches blooms, sends two waves in its own shape, and gets one quick bright sheen.',
    act('move Taipei', (r) => move(r, 'tl', ['store', 'subscribe']))),
};
export const TheAgentChangedSomething: Story = {
  name: '3 · event · the agent changed something',
  render: () => scene(box(html`<sett-area name="routes · public"><sett-item entry>health_check()</sett-item><sett-item data-id="subscribe" entry session="yk" live>subscribe()</sett-item><sett-item>SubscriptionToken</sett-item></sett-area>`),
    'One ring flashes outward past everything, once: this item\'s code just changed.',
    act('subscribe() changed', (r) => { void item(r, 'subscribe').flash(); })),
};
export const AFindingIsFixed: Story = {
  name: '4 · event · a finding is fixed',
  render: () => scene(box(html`<sett-area name="routes · public"><sett-item entry>health_check()</sett-item><sett-item data-id="confirm" entry finding session="tl" live>confirm()</sett-item><sett-item>SubscriptionToken</sett-item></sett-area>`),
    'The item\'s red eases back to plain, and the red count in the header pops and leaves: one problem less in this area.',
    act('fix / break confirm()', (r) => { const it = item(r, 'confirm'); it.finding = !it.finding; })),
};
export const YouFoldAnArea: Story = {
  name: '5 · response · you fold an area',
  render: () => scene(box(html`<sett-area name="routes · public"><sett-item entry>health_check()</sett-item><sett-item entry session="yk" live>subscribe()</sett-item><sett-item selected>SubscriptionToken</sett-item></sett-area>`),
    'Click the header. The area eases shut, its arrow turns, the agent\'s dot starts breathing, and a blue count says your selection is inside: the header carries what the fold hides.'),
};
export const IntoAFoldedArea: Story = {
  name: '6 · event · the agent walks into a folded area',
  render: () => scene(html`${box(html`<sett-area name="routes · public"><sett-item entry>confirm()</sett-item><sett-item data-id="store" session="tl" live>store_token()</sett-item></sett-area>`)}${box(html`<sett-area name="middleware" folded><sett-item data-id="reject">reject_anonymous_users()</sett-item><sett-item>UserId</sett-item></sett-area>`)}`,
    'The pulse lands on the nearest thing you can see. The item is hidden, so the folded area itself blooms, and the agent\'s badge ignites in its header, then breathes.',
    act('move Taipei', (r) => move(r, 'tl', ['store', 'reject']))),
};
export const ThreeAgents: Story = {
  name: '7 · presence · a busy area, three agents',
  render: () => scene(box(html`<sett-area name="routes · public"><sett-item entry>health_check()</sett-item><sett-item entry session="yk" live>subscribe()</sett-item><sett-item entry finding session="tl">confirm()</sett-item><sett-item session="mg" live>get_subscriber_id_from_token()</sett-item><sett-item session="tl" live>store_token()</sett-item><sett-item>SubscriptionToken</sett-item></sett-area>`),
    'Everything of one agent moves in step; different agents are offset, so they read as three and not as one blinking block.'),
};
export const TwoAgentsOneItem: Story = {
  name: '8 · collision · two agents on the same item',
  render: () => scene(box(html`<sett-area name="routes · public"><sett-item entry>health_check()</sett-item><sett-item entry finding session="yk" also="tl" live>confirm()</sett-item><sett-item>SubscriptionToken</sett-item></sett-area>`),
    'One ring, half in each agent\'s colour. Rings never stack: an item has room for one.'),
};

/** a small open unit: two columns, three areas, the links between them */
const mini = (who: Record<string, string> = {}, folded: string[] = []) => html`
  <sett-sheet>
    <sett-column kind="driving" label="routes"><sett-area key="routes" name="routes · public" ?folded=${folded.includes('routes')}>
      <sett-item key="subscribe" entry ?selected=${who.subscribe === 'selected'}>subscribe()</sett-item><sett-item key="confirm" entry>confirm()</sett-item></sett-area></sett-column>
    <sett-column kind="domain" label="domain"><sett-area key="domain" name="domain" ?folded=${folded.includes('domain')}>
      <sett-item key="newsub" kind="struct" ?selected=${who.newsub === 'selected'}>NewSubscriber</sett-item><sett-item key="email" kind="struct">SubscriberEmail::parse</sett-item></sett-area>
      <sett-area key="auth" name="auth" ?folded=${folded.includes('auth')}><sett-item key="validate" ?selected=${who.validate === 'selected'}>validate_credentials()</sett-item><sett-item key="creds" kind="struct">Credentials</sett-item></sett-area></sett-column>
    <sett-link from="subscribe" to="newsub" kind="constructs"></sett-link>
    <sett-link from="subscribe" to="validate" kind="calls"></sett-link>
    <sett-link from="newsub" to="email" kind="constructs"></sett-link>
    <sett-link from="confirm" to="validate" kind="calls"></sett-link>
    <sett-link from="validate" to="creds" kind="uses-type"></sett-link>
  </sett-sheet>`;
const toggleAttr = (r: HTMLElement, sel: string, attr: string) => { const el = r.querySelector(sel)!; el.toggleAttribute(attr, !el.hasAttribute(attr)); };

export const PointingLights: Story = {
  name: '9 · response · pointing lights an item\'s links and the item at the other end',
  render: () => scene(mini(), 'Point at subscribe(): its two lines turn blue with NewSubscriber and validate_credentials() at their other ends, over motion.hover. Point at a line: it lights with both its ends. Nothing moves, nothing dashes.'),
};
export const SelectDrawsOutward: Story = {
  name: '10 · response · selecting draws the connections outward, then the flow travels',
  render: () => scene(mini(), 'Click select. The links of subscribe() are drawn from it toward their other ends over motion.draw; only once drawn do the flow dashes travel, on the selection alone; every other line recedes to map.far.',
    act('select subscribe()', (r) => toggleAttr(r, 'sett-item[key="subscribe"]', 'selected'))),
};
export const FoldHidesTheSelection: Story = {
  name: '11 · response · folding hides the selection: the link rides the edge, a blue dock dot lands',
  render: () => scene(mini({ validate: 'selected' }), 'Click fold. The auth area eases shut; the selected item inside is hidden, so its lines ride the area\'s edge up to the chip, the header shows the blue count, and a blue dock dot lands on the border where the links plug in (port language). Unfold and the lines come back down to the item.',
    act('fold / unfold auth', (r) => toggleAttr(r, 'sett-area[key="auth"]', 'folded'))),
};
