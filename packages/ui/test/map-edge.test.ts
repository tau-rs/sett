import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import type { SettEdge } from '../src/map/sett-edge.js';
import { boardsWatched } from '../src/map/board-lines.js';

const cssOf = (tag: string) => { const s = (customElements.get(tag) as any).styles; return (Array.isArray(s) ? s : [s]).map((x: any) => x.cssText).join('\n'); };
const ROUTE = { points: [{ x: 0, y: 10 }, { x: 40, y: 10 }, { x: 40, y: 60 }, { x: 100, y: 60 }], branches: [{ x: 40, y: 30 }], backward: false };
const mount = async (attrs: string) => {
  document.body.innerHTML = `<div style="position:relative"><sett-node key="a"></sett-node><sett-node key="b"></sett-node><sett-edge from="a" to="b" ${attrs}></sett-edge></div>`;
  const el = document.body.querySelector('sett-edge') as SettEdge;
  el.route = ROUTE;
  await el.updateComplete;
  return el;
};

beforeAll(() => customElements.whenDefined('sett-edge'));
afterEach(() => { document.body.innerHTML = ''; });

describe('sett-edge', () => {
  it('uses tokens only; the only animations are the flow, and they stop under reduced motion', () => {
    const c = cssOf('sett-edge');
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(c).not.toMatch(/\d+px/);
    expect(c.match(/animation: sett-/g)?.length).toBe(2);
    expect(c).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.march, \.flow \{ animation: none; \}/);
  });
  it('every port kind has its colour and dash from map.kind.*', () => {
    const c = cssOf('sett-edge');
    for (const k of ['rpc', 'http', 'cli', 'topic', 'crate', 'sql', 'pub', 'redis', 'fs', 'tty', 'declared']) {
      expect(c).toContain(`:host([kind='${k}']) { --_kind: var(--sett-map-kind-${k}-color); --_dash: var(--sett-map-kind-${k}-stroke); }`);
    }
  });
  it('draws the halo, the line one arrow short of its end, the head at the end, and the branch dots', async () => {
    const el = await mount('kind="crate"');
    const root = el.shadowRoot!;
    expect(root.querySelector('.line')?.getAttribute('d')).toBe('M0.0 10.0 L40.0 10.0 L40.0 60.0 L92.0 60.0');
    expect(root.querySelector('.halo')?.getAttribute('d')).toBe('M0.0 10.0 L40.0 10.0 L40.0 60.0 L92.0 60.0');
    expect(root.querySelector('.h')?.getAttribute('d')).toMatch(/^M100\.0 60\.0 L92\.0/);
    expect(root.querySelectorAll('.b').length).toBe(1);
  });
  it('nothing is written at rest; pointing at it shows the kind and the label; selecting the unit does not', async () => {
    const el = await mount('kind="sql" label="issue_delivery_queue"');
    const root = el.shadowRoot!;
    expect(root.querySelector('.label')).toBeNull();
    el.selected = true; await el.updateComplete;
    expect(root.querySelector('.label')).toBeNull();
    el.selected = false; el.lit = true; await el.updateComplete;
    expect(root.querySelector('.label')?.textContent).toBe('sql · issue_delivery_queue');
    el.lit = false; await el.updateComplete;
    root.querySelector('.hit')!.dispatchEvent(new Event('pointerenter'));
    await el.updateComplete;
    expect(root.querySelector('.label')?.textContent).toBe('sql · issue_delivery_queue');
    expect(root.querySelector('svg')?.classList.contains('on')).toBe(true);
    root.querySelector('.hit')!.dispatchEvent(new Event('pointerleave'));
    await el.updateComplete;
    expect(root.querySelector('.label')).toBeNull();
  });
  it('the flow: a dashed kind marches its own dashes by one period, a solid kind carries travelling gaps', async () => {
    const el = await mount('kind="crate" selected');
    const line = el.shadowRoot!.querySelector('.line')!;
    expect(line.classList.contains('march')).toBe(true);
    expect(line.getAttribute('style')).toBe('--_period: 5px');
    expect(el.shadowRoot!.querySelector('.flow')).toBeNull();
    el.kind = 'http'; await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.line')!.classList.contains('march')).toBe(false);
    expect(el.shadowRoot!.querySelector('.flow')).not.toBeNull();
  });
  it('joins the board of its parent and leaves it when removed; the board sleeps when its last edge goes', async () => {
    const before = boardsWatched();
    await mount('');
    expect(boardsWatched()).toBe(before + 1);
    document.body.innerHTML = '';
    expect(boardsWatched()).toBe(before);
  });
  it('without a route it draws nothing', async () => {
    document.body.innerHTML = '<div><sett-edge from="x" to="y"></sett-edge></div>';
    const el = document.body.querySelector('sett-edge') as SettEdge;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('svg')).toBeNull();
  });
});
