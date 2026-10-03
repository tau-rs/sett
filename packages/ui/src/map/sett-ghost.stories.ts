import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { portKey, unitPorts } from './fixtures.js';
import { clusterGhost, ghostPortKey, ghostScene, node, openUnit, systemDir, systemGhost, unitGhost, zed, zero2prod } from './map-fixtures.stories-helpers.js';
import './sett-ghost.js';

/**
 * A neighbour from outside the repository, beside the open unit: another
 * repository's unit (a folded sheet) or an outside system (a port list);
 * ghosts that would overlap merge into a cluster. A ghost sits on the side
 * where it lies on the system map and recedes by colour, never by opacity.
 */
const meta: Meta = { title: 'map/ghost', component: 'sett-ghost' };
export default meta;
type Story = StoryObj;

const note = (text: string) => html`<p style="margin:0 0 var(--sett-space-3);max-width:72ch;color:var(--sett-color-ink2);font-family:var(--sett-font-sans);font-size:var(--sett-font-size-base)">${text}</p>`;
const cap = (title: string, text: string) => html`<div style="margin-top:var(--sett-space-2);max-width:440px;font-family:var(--sett-font-sans);font-size:var(--sett-font-size-sm);color:var(--sett-color-ink2)"><b style="display:block;color:var(--sett-color-ink);font-size:var(--sett-font-size-base)">${title}</b>${text}</div>`;

/** zed's cloud repository: the llm proxy offers llm.zed.dev (the system map says zed's agent needs it) */
const zedWithCloud = (() => {
  const f = structuredClone(zed);
  for (const r of Object.values(f.repos)) for (const u of r.units) { u.exposes ??= []; u.needs ??= []; }
  f.repos.cloud.units.find((u) => u.id === 'llm')!.exposes = [['http', 'llm.zed.dev', 'm0', 'llm.zed.dev']];
  return f;
})();
const needsKey = (f: typeof zed, id: string, kind: string) => portKey(unitPorts(f, id).needs.find((p) => p.kind === kind)!);

export const Recedes: Story = {
  name: 'a ghost beside a unit of this repository and a receded one',
  render: () => html`${note('Left: a unit of zero2prod. Middle: the same unit receded, as when something else is selected. Right: a ghost, an outside system. Both recede by colour, never by opacity.')}
    <div style="display:flex;gap:var(--sett-space-6);align-items:flex-start">
      <div>${node(zero2prod, 'worker', 'card')}${cap('a unit of this repository', 'worker, as a card')}</div>
      <div>${node(zero2prod, 'worker', 'card', { far: true })}${cap('the same unit, receded', 'as when you select something else')}</div>
      <div>${systemGhost(zero2prod, 'postgres')}${cap('a ghost', 'postgres, an outside system')}</div>
    </div>`,
};
export const Bodies: Story = {
  name: 'the three bodies · folded sheet, port list, cluster',
  render: () => html`${note('Another repository\'s unit is a folded sheet: its areas closed into chips, so a line lands on the area it reaches. An outside system is a port list, dashed when declared. Ghosts that would overlap merge into a cluster, one row per member.')}
    <div style="display:flex;flex-direction:column;gap:var(--sett-space-5)">
      <div>${unitGhost(zedWithCloud, 'llm')}${cap('another repository\'s unit', 'llm proxy, from zed\'s cloud repository')}</div>
      <div style="display:flex;gap:var(--sett-space-6);align-items:flex-start">
        <div>${systemGhost(zero2prod, 'postmark')}${cap('an outside system', 'Postmark')}</div>
        <div>${systemGhost(zero2prod, 'clients')}${cap('a declared outside system', 'browsers: declared, not analysed, dashed')}</div>
        <div>${clusterGhost(zero2prod, ['postgres', 'redis', 'postmark'])}${cap('a cluster', 'three ghosts that would overlap, merged')}</div>
      </div>
    </div>`,
};
export const Zero2prodApi: Story = {
  name: 'zero2prod · api open · four outside systems where the system map puts them',
  render: () => html`${note('Browsers (declared) call api from the left; postgres and redis sit to the right; Postmark lies further down, so its ghost is below.')}
    ${ghostScene(openUnit(zero2prod, 'api'), ['clients', 'postgres', 'redis', 'postmark'].map((id) => ({ body: systemGhost(zero2prod, id), dir: systemDir(zero2prod, 'z2p', id) })), [
      { from: 'clients', fromPort: ghostPortKey('clients', 'needs', 0), to: 'api', toPort: portKey(unitPorts(zero2prod, 'api').exposes[0]), kind: 'http' },
      { from: 'api', fromPort: needsKey(zero2prod, 'api', 'sql'), to: 'postgres', toPort: ghostPortKey('postgres', 'exposes', 0), kind: 'sql' },
      { from: 'api', fromPort: needsKey(zero2prod, 'api', 'redis'), to: 'redis', toPort: ghostPortKey('redis', 'exposes', 0), kind: 'redis' },
      { from: 'api', fromPort: needsKey(zero2prod, 'api', 'http'), to: 'postmark', toPort: ghostPortKey('postmark', 'exposes', 0), kind: 'http' },
    ])}`,
};
export const ZedAgent: Story = {
  name: 'zed · agent open · the llm proxy of the cloud repository, below-right',
  render: () => html`${note('agent calls the llm proxy of zed\'s cloud repository; cloud lies below and to the right of zed on the system map, so the ghost is below the open agent, toward the right.')}
    ${ghostScene(openUnit(zedWithCloud, 'agent'), [{ body: unitGhost(zedWithCloud, 'llm'), dir: systemDir(zedWithCloud, 'zed', 'cloud') }], [
      { from: 'agent', fromPort: needsKey(zedWithCloud, 'agent', 'http'), to: 'llm', toPort: 'exposes:llm.zed.dev', kind: 'http' },
    ])}`,
};
export const Cluster: Story = {
  name: 'zero2prod · api open · ghosts that would overlap merge into a cluster',
  render: () => html`${note('Here postgres, redis and Postmark are put on one spot to show it: they merge into one ghost, one row per member, and each line lands on its row.')}
    ${ghostScene(openUnit(zero2prod, 'api'), [{ body: clusterGhost(zero2prod, ['postgres', 'redis', 'postmark']), dir: { dx: 340, dy: 0 } }], [
      { from: 'api', fromPort: needsKey(zero2prod, 'api', 'sql'), to: 'postgres+redis+postmark', toPort: ghostPortKey('postgres', 'exposes', 0), kind: 'sql' },
      { from: 'api', fromPort: needsKey(zero2prod, 'api', 'redis'), to: 'postgres+redis+postmark', toPort: ghostPortKey('redis', 'exposes', 0), kind: 'redis' },
      { from: 'api', fromPort: needsKey(zero2prod, 'api', 'http'), to: 'postgres+redis+postmark', toPort: ghostPortKey('postmark', 'exposes', 0), kind: 'http' },
    ])}`,
};
