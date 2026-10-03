import { base } from '@tau-rs/sett-tokens';

/** how much of a unit its node shows; read from the node's on-screen width, never from a step machine (rule 1) */
export type NodeTier = 'mini' | 'chip' | 'card' | 'sheet';

const px = (v: string | number) => (typeof v === 'number' ? v : parseFloat(v));
const T = base.map.threshold;
/** the width at which each tier starts */
const UP: Record<Exclude<NodeTier, 'mini'>, number> = { chip: px(T.mini), card: px(T.chip), sheet: px(T.card) };
const ORDER: NodeTier[] = ['mini', 'chip', 'card', 'sheet'];
const rank = (t: NodeTier) => ORDER.indexOf(t);

/**
 * The tier for an on-screen width. With `previous`, folding back one tier waits
 * until the width is a `hysteresis` band under the threshold, so a wheel zoom
 * hovering around a threshold does not flicker between two row layouts.
 */
export function tierFor(width: number, previous?: NodeTier): NodeTier {
  const raw: NodeTier = width < UP.chip ? 'mini' : width < UP.card ? 'chip' : width < UP.sheet ? 'card' : 'sheet';
  if (!previous || rank(previous) <= rank(raw)) return raw;
  const keep = previous === 'mini' ? 0 : UP[previous] - px(T.hysteresis);
  return width >= keep && rank(previous) === rank(raw) + 1 ? previous : raw;
}

/** what an open unit shows while the camera zooms out from the scale it was opened at */
export type UnitFold = 'items' | 'areas' | 'closed';
const FOLDS: UnitFold[] = ['closed', 'areas', 'items'];
/** where each fold starts, as a fraction of the opening scale */
const FROM: Record<Exclude<UnitFold, 'closed'>, number> = { areas: Number(T.foldFloor), items: 1 };
/** the tiers' hysteresis, as a fraction of the width a sheet opens at */
const BAND = px(T.hysteresis) / UP.sheet;

/**
 * The fold of an open unit for the camera's `scale`, against the scale it
 * was `openedAt` (DESIGN.md map rule 3). An open unit keeps its place on the
 * board while you zoom out; text never shrinks, so its areas fold (`areas`)
 * as soon as the scale is under the opening scale, down to
 * `map.threshold.foldFloor` of it; below that it closes back to a card
 * (`closed`). At or above the opening scale it shows its items (`items`).
 * With `previous`, folding one step waits for the tiers' `hysteresis` band,
 * so a wheel zoom hovering at a boundary does not flicker; zooming back in
 * is immediate. A fold by hand is not this: an area folded by hand stays a
 * chip at any scale.
 */
export function foldFor(scale: number, openedAt: number, previous?: UnitFold): UnitFold {
  const ratio = scale / openedAt;
  const raw: UnitFold = ratio >= FROM.items ? 'items' : ratio >= FROM.areas ? 'areas' : 'closed';
  if (!previous || previous === 'closed') return raw;
  const at = FOLDS.indexOf(previous), now = FOLDS.indexOf(raw);
  return now === at - 1 && ratio >= FROM[previous] - BAND ? previous : raw;
}
