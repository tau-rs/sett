/**
 * Where the hint pills go. Pure geometry: the window and the off-screen
 * units in, pills out. A pill sits on the window's border toward its unit,
 * on the side the ray from the window's centre meets, kept clear of the
 * corners; pills that would touch merge into one (`map.threshold.hintGroupV`
 * on a left or right border, `hintGroupH` on the top or bottom). A pill that
 * would land on a card near the border slides along it to the nearest clear
 * spot; when the border is taken all along, it stays where it belongs, over
 * the card (#56). A pill is gone the moment any part of its unit is seen.
 */
import { base } from '@tau-rs/sett-tokens';
import type { Box } from './routes.js';

export type HintSide = 'left' | 'right' | 'top' | 'bottom';
export interface HintUnit { key: string; box: Box }
export interface HintInput {
  /** the window, in board coordinates */
  view: Box;
  /** the off-screen units to point at (see `offscreenNeighbours`) */
  units: HintUnit[];
  /** the boxes in view a pill should not cover */
  cards?: Box[];
  /** the size of the pill for these keys: one name, or "n neighbours · two names" */
  size: (keys: string[]) => { w: number; h: number };
}
export interface Hint extends Box {
  /** the units it stands for: one, or several merged */
  keys: string[];
  side: HintSide;
  /** where to put the pill: the middle of its outer edge, on the inset border (`sett-hint-chip` hangs from it by its side) */
  anchor: { x: number; y: number };
}

const GROUP_V = parseFloat(base.map.threshold.hintGroupV);
const GROUP_H = parseFloat(base.map.threshold.hintGroupH);
/** a pill's inset from the border (`space.2`) */
const INSET = parseFloat(base.space['2']);
/** how far a pill's centre stays from a corner, along a left or right border and along the top or bottom (the PoC's clamps) */
const CORNER_V = 30, CORNER_H = 90;
/** the step a pill slides by to clear a card (`map.size.track`) */
const STEP = parseFloat(base.map.size.track);

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export function placeHints({ view: v, units, cards = [], size }: HintInput): Hint[] {
  const cx = v.x + v.w / 2, cy = v.y + v.h / 2;
  const raw = units.map((u) => {
    const dx = u.box.x + u.box.w / 2 - cx, dy = u.box.y + u.box.h / 2 - cy;
    const tx = Math.abs(dx) / (v.w / 2), ty = Math.abs(dy) / (v.h / 2);
    if (tx >= ty) return { key: u.key, side: (dx > 0 ? 'right' : 'left') as HintSide, at: Math.max(v.y + CORNER_V, Math.min(v.y + v.h - CORNER_V, cy + dy / (tx || 1))) };
    return { key: u.key, side: (dy > 0 ? 'bottom' : 'top') as HintSide, at: Math.max(v.x + CORNER_H, Math.min(v.x + v.w - CORNER_H, cx + dx / (ty || 1))) };
  });
  const out: Hint[] = [];
  for (const side of ['left', 'right', 'top', 'bottom'] as HintSide[]) {
    const vertical = side === 'left' || side === 'right', gap = vertical ? GROUP_V : GROUP_H;
    const groups: { keys: string[]; at: number[] }[] = [];
    for (const r of raw.filter((x) => x.side === side).sort((a, b) => a.at - b.at)) {
      const last = groups[groups.length - 1];
      if (last && r.at - last.at[last.at.length - 1] < gap) { last.keys.push(r.key); last.at.push(r.at); } else groups.push({ keys: [r.key], at: [r.at] });
    }
    for (const g of groups) {
      const { w, h } = size(g.keys), at = g.at.reduce((a, b) => a + b, 0) / g.at.length;
      const place = (c: number): Box => side === 'right' ? { x: v.x + v.w - INSET - w, y: c - h / 2, w, h }
        : side === 'left' ? { x: v.x + INSET, y: c - h / 2, w, h }
        : side === 'top' ? { x: c - w / 2, y: v.y + INSET, w, h } : { x: c - w / 2, y: v.y + v.h - INSET - h, w, h };
      const lo = vertical ? v.y + h / 2 + INSET : v.x + w / 2 + INSET, hi = vertical ? v.y + v.h - h / 2 - INSET : v.x + v.w - w / 2 - INSET;
      const clear = (c: number) => !cards.some((b) => overlaps(place(c), b)) && !out.some((p) => p.side === side && overlaps(place(c), p));
      let c = at;
      if (!clear(at)) for (let k = 1; at - k * STEP >= lo || at + k * STEP <= hi; k++) {
        if (at - k * STEP >= lo && clear(at - k * STEP)) { c = at - k * STEP; break; }
        if (at + k * STEP <= hi && clear(at + k * STEP)) { c = at + k * STEP; break; }
      }
      const b = place(c);
      const anchor = side === 'right' ? { x: b.x + b.w, y: b.y + b.h / 2 } : side === 'left' ? { x: b.x, y: b.y + b.h / 2 } : side === 'top' ? { x: b.x + b.w / 2, y: b.y } : { x: b.x + b.w / 2, y: b.y + b.h };
      out.push({ keys: g.keys, side, ...b, anchor });
    }
  }
  return out;
}

/** the units outside the window joined by an edge to one any part of which is inside it */
export function offscreenNeighbours({ view, boxes, edges }: { view: Box; boxes: Record<string, Box>; edges: { f: string; t: string }[] }): string[] {
  const seen = (k: string) => !!boxes[k] && overlaps(boxes[k], view);
  const out = new Set<string>();
  for (const e of edges) {
    if (seen(e.f) && boxes[e.t] && !seen(e.t)) out.add(e.t);
    if (seen(e.t) && boxes[e.f] && !seen(e.f)) out.add(e.f);
  }
  return [...out];
}
