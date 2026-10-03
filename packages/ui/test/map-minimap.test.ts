import { beforeAll, describe, expect, it } from 'vitest';
import '../src/index.js';
import { minimapPoint } from '../src/index.js';

type El = HTMLElement & { updateComplete: Promise<boolean>; [k: string]: any };
const cssOf = (tag: string) => ([] as any[]).concat((customElements.get(tag) as any).styles).flat().map((s: any) => s.cssText).join('\n');
const mount = async (m: string) => { document.body.innerHTML = m; const el = document.body.firstElementChild as El; await el.updateComplete; return el; };
const RECTS = [{ x: 0, y: 0, w: 100, h: 50, key: 'a' }, { x: 300, y: 150, w: 100, h: 50, key: 'b', selected: true }, { x: 0, y: 100, w: 50, h: 50, tone: 'driving' }];
const heard = (el: Element) => { const got: any[] = []; el.addEventListener('sett-pan', (e: any) => got.push(e.detail)); return got; };

beforeAll(() => customElements.whenDefined('sett-minimap'));

describe('minimapPoint', () => {
  it('maps a pointer to the world, the world fitted whole and centred', () => {
    // a 400×200 world in a 200×200 frame: scale 0.5, 50 px of margin above and below
    const frame = { x: 10, y: 20, w: 200, h: 200 }, world = { x: 0, y: 0, w: 400, h: 200 };
    expect(minimapPoint(frame, world, 10, 70)).toEqual({ x: 0, y: 0 });
    expect(minimapPoint(frame, world, 110, 120)).toEqual({ x: 200, y: 100 });
    expect(minimapPoint(frame, { x: -100, y: 50, w: 400, h: 200 }, 210, 170)).toEqual({ x: 300, y: 250 });
  });
});

describe('sett-minimap', () => {
  it('uses tokens only, at map.size.minimapW × minimapH, and never animates', () => {
    const css = cssOf('sett-minimap');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px/);
    expect(css).not.toMatch(/animation|transition|opacity/);
    expect(css).toContain('max-width: var(--sett-map-size-minimap-w)');
    expect(css).toContain('height: var(--sett-map-size-minimap-h)');
    expect(css).not.toMatch(/position:\s*(absolute|fixed)/);
  });
  it('draws the world rects and the viewport rect over them; the world is their union', async () => {
    const el = await mount('<sett-minimap>zed</sett-minimap>');
    el.rects = RECTS; el.view = { x: 350, y: 180, w: 100, h: 60 }; await el.updateComplete;
    const svg = el.shadowRoot!.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 450 240');
    const rects = Array.from(svg.querySelectorAll('rect'));
    expect(rects).toHaveLength(4);
    expect(rects[3].getAttribute('class')).toBe('view');
    expect(rects[1].hasAttribute('data-selected')).toBe(true);
    expect(rects[2].getAttribute('data-tone')).toBe('driving');
    expect(el.shadowRoot!.querySelector('.m')!.textContent).toBe('board');
    el.world = { x: 0, y: 0, w: 1000, h: 500 }; el.mode = 'sheet'; await el.updateComplete;
    expect(svg.getAttribute('viewBox')).toBe('0 0 1000 500');
    expect(el.getAttribute('mode')).toBe('sheet');
    expect(el.shadowRoot!.querySelector('.m')!.textContent).toBe('sheet');
  });
  it('takes rects and view as JSON attributes, for plain DOM', async () => {
    const el = await mount(`<sett-minimap rects='[{"x":0,"y":0,"w":10,"h":10}]' view='{"x":2,"y":2,"w":4,"h":4}'></sett-minimap>`);
    expect(el.shadowRoot!.querySelectorAll('rect')).toHaveLength(2);
  });
  it('without a view there is no viewport rect and the arrows do nothing', async () => {
    const el = await mount('<sett-minimap></sett-minimap>'); el.rects = RECTS; await el.updateComplete;
    const got = heard(el);
    expect(el.shadowRoot!.querySelector('rect.view')).toBeNull();
    el.shadowRoot!.querySelector('svg')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(got).toEqual([]);
  });
  it('a click pans to the world point under it; a drag keeps panning; it stops on release', async () => {
    const el = await mount('<sett-minimap></sett-minimap>');
    el.rects = RECTS; el.world = { x: 0, y: 0, w: 400, h: 200 }; await el.updateComplete;
    const svg = el.shadowRoot!.querySelector('svg')!;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    const got = heard(el);
    const ev = (type: string, x: number, y: number) => { const e = new Event(type) as any; e.clientX = x; e.clientY = y; e.pointerId = 1; svg.dispatchEvent(e); };
    ev('pointermove', 10, 10);
    ev('pointerdown', 100, 50);
    ev('pointermove', 150, 50);
    ev('pointerup', 150, 50);
    ev('pointermove', 20, 20);
    expect(got).toEqual([{ x: 200, y: 100 }, { x: 300, y: 100 }]);
  });
  it('the arrows pan by a quarter of the view', async () => {
    const el = await mount('<sett-minimap></sett-minimap>');
    el.rects = RECTS; el.view = { x: 100, y: 100, w: 200, h: 100 }; await el.updateComplete;
    const svg = el.shadowRoot!.querySelector('svg')!; const got = heard(el);
    expect(svg.getAttribute('tabindex')).toBe('0');
    expect(svg.getAttribute('aria-label')).toContain('minimap · board');
    for (const key of ['ArrowRight', 'ArrowUp', 'a']) svg.dispatchEvent(new KeyboardEvent('keydown', { key }));
    expect(got).toEqual([{ x: 250, y: 150 }, { x: 200, y: 125 }]);
  });
});
