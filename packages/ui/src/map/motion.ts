/**
 * The map's shared motion (DESIGN.md § Motion, ADR 0002). Elements animate
 * themselves: the application only says which agent is live where, and when
 * that flips the element plays its own departure or arrival with these.
 * Names never move, fade or resize; nothing here touches text.
 */
import { css } from 'lit';
import { base } from '@tau-rs/sett-tokens';

const M = base.motion;
/** a `motion.*` duration token ("460ms", "2.8s") in milliseconds */
export const durationMs = (v: string): number => (v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000);
/** true when the reader turned motion off; every helper then does nothing and the element shows its still twin */
export const reducedMotion = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Keyframes and the wave box shared by every map element that shows an agent.
 * The host must be `position: relative` and expose `--_session` (see `sessionStyles`).
 */
export const presenceStyles = css`
  @keyframes sett-breathe { 0%, 100% { opacity: var(--sett-map-presence-breath-min); } 50% { opacity: 1; } }
  @keyframes sett-sheen { 0% { background-position: 110% 0; } 60%, 100% { background-position: -10% 0; } }
  @keyframes sett-badge { 0%, 100% { transform: scale(0.8); opacity: var(--sett-map-presence-breath-min); } 50% { transform: scale(1.15); opacity: 1; } }
  @keyframes sett-ignite { 0% { transform: scale(0.2); } 45% { transform: scale(1.9); } 100% { transform: scale(1); } }
  @keyframes sett-pop { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
  @keyframes sett-cool { 0% { opacity: 1; } 100% { opacity: var(--sett-map-presence-touched); } }
  .sett-wave {
    position: absolute;
    box-sizing: border-box;
    border: var(--sett-stroke-lit) solid var(--_session);
    pointer-events: none;
  }
  @media (prefers-reduced-motion: reduce) { .sett-wave { display: none; } }
`;

type Anim = { finished: Promise<unknown> };
const animate = (el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions): Promise<void> => {
  const run = (el as Element & { animate?: (f: Keyframe[], o: KeyframeAnimationOptions) => Anim }).animate;
  return typeof run === 'function' ? run.call(el, frames, opts).finished.then(() => undefined, () => undefined) : Promise.resolve();
};
const inset = (extra?: string) => (extra ? `calc(-1 * (var(--sett-map-size-ring-gap) + ${extra}))` : 'calc(-1 * var(--sett-map-size-ring-gap))');
const radius = (extra?: string) => `calc(var(--_radius, var(--sett-map-radius-item)) + var(--sett-map-size-ring-gap)${extra ? ` + ${extra}` : ''})`;

export interface WaveOptions {
  /** closing in (the agent leaves) instead of rolling outward (it arrives) */
  inward?: boolean;
  /** ms before it starts; the second of two arrival waves waits `motion.wave-gap` */
  delay?: number;
  /** a unit's box takes the larger wave (`map.size.waveNode`) */
  big?: boolean;
}

/** one wave in the host's own shape, drawn in its shadow root and removed when done */
export function wave(host: HTMLElement, { inward = false, delay = 0, big = false }: WaveOptions = {}): Promise<void> {
  const root = host.shadowRoot;
  if (!root || reducedMotion()) return Promise.resolve();
  const grow = big ? 'var(--sett-map-size-wave-node)' : 'var(--sett-map-size-wave)';
  const near = { inset: inset(), borderRadius: radius() };
  const far = { inset: inset(grow), borderRadius: radius(grow) };
  const el = document.createElement('div');
  el.className = 'sett-wave';
  el.setAttribute('part', 'wave');
  root.appendChild(el);
  const frames: Keyframe[] = inward ? [{ ...far, opacity: 0 }, { ...near, opacity: 1 }] : [{ ...near, opacity: 1 }, { ...far, opacity: 0 }];
  return animate(el, frames, { duration: durationMs(inward ? M['wave-in'] : M['wave-out']), delay, easing: inward ? M['ease-in'] : M['ease-out'], fill: 'both' }).then(() => el.remove());
}

/** the host glows in its session's colour and settles back */
export function bloom(host: HTMLElement, big = false): Promise<void> {
  if (reducedMotion()) return Promise.resolve();
  const size = big ? 'var(--sett-map-size-bloom-node)' : 'var(--sett-map-size-bloom)';
  const glow = `0 0 ${size} var(--sett-map-size-ring-gap) color-mix(in srgb, var(--_session) 55%, transparent)`;
  const none = '0 0 0 0 transparent';
  return animate(host, [{ boxShadow: none }, { boxShadow: glow, offset: 0.3 }, { boxShadow: none }], { duration: durationMs(M.bloom), easing: 'ease-out' });
}

/** an agent arrives: the host blooms and two waves in its own shape roll outward */
export function arrive(host: HTMLElement, big = false): Promise<void> {
  return Promise.all([bloom(host, big), wave(host, { big }), wave(host, { big, delay: durationMs(M['wave-gap']) })]).then(() => undefined);
}

/** an agent leaves: one wave closes in on the host and is swallowed */
export function leave(host: HTMLElement, big = false): Promise<void> {
  return wave(host, { inward: true, big });
}

/** a change: one ring flashes outward past everything, once (`motion.item-pulse`) */
export function flash(host: HTMLElement): Promise<void> {
  const root = host.shadowRoot;
  if (!root || reducedMotion()) return Promise.resolve();
  const el = document.createElement('div');
  el.className = 'sett-wave';
  el.setAttribute('part', 'flash');
  root.appendChild(el);
  return animate(el, [{ inset: inset(), borderRadius: radius(), opacity: 1 }, { inset: inset('var(--sett-map-size-wave)'), borderRadius: radius('var(--sett-map-size-wave)'), opacity: 0 }], { duration: durationMs(M['item-pulse']), easing: 'ease-out', fill: 'both' }).then(() => el.remove());
}
