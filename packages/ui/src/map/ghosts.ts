/**
 * Where the ghosts go. Pure geometry: the open unit's box and its outside
 * neighbours in, boxes out. A ghost is a neighbour from outside the
 * repository (another repository's unit, or a system from the system map);
 * it sits beside the open unit, a gutter away, on the side where it lies on
 * the system map, toward it (callers-left / dependencies-right is rejected,
 * DESIGN.md). Ghosts that would overlap merge into one cluster (#56).
 */
import { base } from '@tau-rs/sett-tokens';
import type { Box } from './routes.js';

export type GhostSide = 'left' | 'right' | 'top' | 'bottom';
export interface GhostIn {
  key: string;
  /** where it lies from the open unit's repository on the system map */
  dir: { dx: number; dy: number };
}
export interface GhostInput {
  /** the open unit's box */
  open: Box;
  ghosts: GhostIn[];
  /** the size of the body for these keys: one ghost, or a cluster of several */
  size: (keys: string[]) => { w: number; h: number };
  /** the space between the open unit and its ghosts, defaults to `map.size.columnGutter` */
  gap?: number;
}
export interface Ghost extends Box {
  /** one key, or several merged into a cluster */
  keys: string[];
  side: GhostSide;
}

const GUTTER = parseFloat(base.map.size.columnGutter);
const clamp = (lo: number, v: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)));

export function placeGhosts({ open: O, ghosts, size, gap = GUTTER }: GhostInput): Ghost[] {
  const cx = O.x + O.w / 2, cy = O.y + O.h / 2;
  const sideOf = (d: GhostIn['dir']): GhostSide => {
    const tx = Math.abs(d.dx) / (O.w / 2), ty = Math.abs(d.dy) / (O.h / 2);
    return tx >= ty ? (d.dx > 0 ? 'right' : 'left') : d.dy > 0 ? 'bottom' : 'top';
  };
  /** the ghost's centre along its side: toward the neighbour, kept within the open unit's extent */
  const along = (d: GhostIn['dir'], side: GhostSide, w: number, h: number) => {
    const tx = Math.abs(d.dx) / (O.w / 2) || 1, ty = Math.abs(d.dy) / (O.h / 2) || 1;
    return side === 'left' || side === 'right' ? clamp(O.y + h / 2, cy + d.dy / tx, O.y + O.h - h / 2) : clamp(O.x + w / 2, cx + d.dx / ty, O.x + O.w - w / 2);
  };
  const boxOf = (side: GhostSide, at: number, w: number, h: number): Box =>
    side === 'right' ? { x: O.x + O.w + gap, y: at - h / 2, w, h }
    : side === 'left' ? { x: O.x - gap - w, y: at - h / 2, w, h }
    : side === 'bottom' ? { x: at - w / 2, y: O.y + O.h + gap, w, h } : { x: at - w / 2, y: O.y - gap - h, w, h };
  const out: Ghost[] = [];
  for (const side of ['left', 'right', 'top', 'bottom'] as GhostSide[]) {
    const vertical = side === 'left' || side === 'right';
    const mine = ghosts.filter((g) => sideOf(g.dir) === side).map((g) => {
      const { w, h } = size([g.key]);
      return { keys: [g.key], at: along(g.dir, side, w, h), dirs: [g.dir] };
    }).sort((a, b) => a.at - b.at);
    // merge while two would overlap along their side
    const groups: typeof mine = [];
    for (const g of mine) {
      const last = groups[groups.length - 1];
      if (last) {
        const a = size(last.keys), b = size(g.keys);
        const reach = vertical ? (a.h + b.h) / 2 : (a.w + b.w) / 2;
        if (g.at - last.at < reach) { last.keys.push(...g.keys); last.dirs.push(...g.dirs); last.at = (last.at * (last.keys.length - g.keys.length) + g.at * g.keys.length) / last.keys.length; continue; }
      }
      groups.push({ ...g, keys: [...g.keys], dirs: [...g.dirs] });
    }
    for (const g of groups) {
      const { w, h } = size(g.keys);
      const at = vertical ? clamp(O.y + h / 2, g.at, O.y + O.h - h / 2) : clamp(O.x + w / 2, g.at, O.x + O.w - w / 2);
      out.push({ keys: g.keys, side, ...boxOf(side, at, w, h) });
    }
  }
  return out;
}
