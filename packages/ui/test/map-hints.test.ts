import { describe, expect, it } from 'vitest';
import { placeHints, offscreenNeighbours, type Box } from '../src/index.js';

const view: Box = { x: 0, y: 0, w: 1400, h: 900 };
const size = (keys: string[]) => ({ w: keys.length > 1 ? 200 : 100, h: 28 });
const unit = (key: string, x: number, y: number, w = 440, h = 160) => ({ key, box: { x, y, w, h } });

describe('where the hint pills go', () => {
  it('a pill sits on the border toward its unit, on the side the ray from the window\'s centre meets', () => {
    const [p] = placeHints({ view, units: [unit('east', 2000, 370)], size });
    expect(p.side).toBe('right');
    expect(p.keys).toEqual(['east']);
    expect(p.x + p.w).toBe(1400 - 8);          // inset from the border
    expect(p.y + p.h / 2).toBeCloseTo(450, 0);  // level with the ray
    const [q] = placeHints({ view, units: [unit('north', 480, -900)], size });
    expect(q.side).toBe('top');
    expect(q.y).toBe(8);
  });
  it('kept clear of the corners: 30 px on a left or right border, 90 px on the top or bottom', () => {
    const [p] = placeHints({ view, units: [unit('ne', 7480, -4080)], size });
    expect(p.side).toBe('right');
    expect(p.y + p.h / 2).toBe(30);
    const [q] = placeHints({ view, units: [unit('nw', -6450, -4130)], size });
    expect(q.side).toBe('top');
    expect(q.x + q.w / 2).toBe(90);
  });
  it('pills that would touch merge: closer than hintGroupV on a side border, hintGroupH on the top or bottom', () => {
    const near = placeHints({ view, units: [unit('a', 2000, 360), unit('b', 2000, 380)], size });
    expect(near.length).toBe(1);
    expect(near[0].keys).toEqual(['a', 'b']);
    const apart = placeHints({ view, units: [unit('a', 2000, 100), unit('b', 2000, 700)], size });
    expect(apart.length).toBe(2);
    const top = placeHints({ view, units: [unit('a', 500, -2000), unit('b', 560, -2000)], size });
    expect(top.length).toBe(1);
  });
  it('a pill that would land on a card near the border slides along it to the nearest clear spot', () => {
    const card: Box = { x: 1200, y: 400, w: 440, h: 160 };
    const [p] = placeHints({ view, units: [unit('east', 2000, 370)], cards: [card], size });
    const overlaps = p.x < card.x + card.w && p.x + p.w > card.x && p.y < card.y + card.h && p.y + p.h > card.y;
    expect(overlaps).toBe(false);
    expect(p.side).toBe('right');
    expect(Math.abs(p.y + p.h / 2 - 450)).toBeLessThan(160);
  });
  it('when the whole border is taken it stays where it belongs, over the card', () => {
    const wall: Box = { x: 1000, y: -100, w: 600, h: 1200 };
    const [p] = placeHints({ view, units: [unit('east', 2000, 370)], cards: [wall], size });
    expect(p.y + p.h / 2).toBeCloseTo(450, 0);
  });
});

describe('which neighbours are off-screen', () => {
  it('a unit outside the window joined by an edge to one inside it; a unit any part of which is seen gets no pill', () => {
    const boxes = { in: { x: 100, y: 100, w: 440, h: 160 }, out: { x: 2000, y: 100, w: 440, h: 160 }, edge: { x: 1300, y: 100, w: 440, h: 160 }, far: { x: 4000, y: 100, w: 440, h: 160 } };
    const keys = offscreenNeighbours({ view, boxes, edges: [{ f: 'in', t: 'out' }, { f: 'in', t: 'edge' }, { f: 'out', t: 'far' }] });
    expect(keys).toEqual(['out']);
  });
});
