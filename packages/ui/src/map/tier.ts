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
